import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

let mainWindow: BrowserWindow | null = null
let db: any = null

interface Transaction {
    id?: number
    date: string
    description: string
    amount: number
    type: string
    category: string
    bank_source?: string
}

process.on('uncaughtException', (error: any) => {
    if (error.code === 'EPIPE') return
    const fs = require('fs')
    try {
        fs.appendFileSync(path.join(app.getPath('userData'), 'error.log'), new Date().toISOString() + ' ' + (error.stack || error) + '\n')
    } catch (e) { }
})

const getLogPath = () => {
    try {
        return path.join(app.getPath('userData'), 'main.log')
    } catch (e) {
        return path.join(__dirname, 'main.log')
    }
}

const logToFile = (level: string, ...args: any[]) => {
    try {
        const timestamp = new Date().toISOString()
        require('fs').appendFileSync(getLogPath(), `${timestamp} [${level}]: ${args.join(' ')}\n`)
    } catch (e) { }
}

console.log = (...args) => logToFile('INFO', ...args)
console.error = (...args) => logToFile('ERROR', ...args)
console.warn = (...args) => logToFile('WARN', ...args)

function initDatabase() {
    try {
        console.log('Initializing database...')
        const dbPath = path.join(app.getPath('userData'), 'finance.db')
        console.log(`DB Path: ${dbPath}`)

        const Database = require('better-sqlite3')
        db = new Database(dbPath)

        db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                bank_source TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyword TEXT UNIQUE NOT NULL,
                category TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
        `)

        const tableInfo = db.pragma('table_info(transactions)') as any[]
        if (!tableInfo.some((col: any) => col.name === 'bank_source')) {
            db.exec('ALTER TABLE transactions ADD COLUMN bank_source TEXT DEFAULT "Bank"')
        }

        const count = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
        if (count.count === 0) {
            const insert = db.prepare('INSERT INTO categories (keyword, category) VALUES (?, ?)')
            const defaults = [
                ['Zomato', 'Food/Dining'], ['Swiggy', 'Food/Dining'], ['Grocery', 'Food/Dining'],
                ['Netflix', 'Entertainment'], ['Spotify', 'Entertainment'],
                ['UPI', 'Transfers/Cash'], ['ATM', 'Transfers/Cash']
            ]
            defaults.forEach(([k, c]) => insert.run(k, c))
        }
        console.log('Database initialized successfully.')
    } catch (e) {
        console.error('FATAL ERROR initializing database:', e)
        db = {
            prepare: () => ({ all: () => [], get: () => ({ count: 0 }), run: () => ({ lastInsertRowid: 0 }) }),
            exec: () => { },
            pragma: () => []
        }
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#000000',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
    })

    if (process.env.VITE_DEV_SERVER_URL || !app.isPackaged) {
        mainWindow.webContents.openDevTools()
    }

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`Failed to load URL: ${validatedURL} (Error: ${errorCode} - ${errorDescription})`)
        // -102 is ERR_CONNECTION_REFUSED, common during startup race conditions
        if (errorCode === -102 && validatedURL.startsWith('http://localhost')) {
            console.log('Vite server not ready yet, retrying in 2 seconds...')
            setTimeout(() => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.loadURL(validatedURL)
                }
            }, 2000)
        }
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }
}

app.whenReady().then(() => {
    console.log('App ready. Starting initialization sequence...')
    try {
        initDatabase()
    } catch (e) {
        console.error('CRITICAL: initDatabase failed at the top level:', e)
    }

    try {
        createWindow()
    } catch (e) {
        console.error('CRITICAL: createWindow failed at the top level:', e)
    }

    if (app.isPackaged) {
        autoUpdater.checkForUpdatesAndNotify()
    }

    console.log('Initialization sequence complete.')
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// IPC Handlers
ipcMain.handle('get-transactions', () => {
    try {
        return db.prepare('SELECT * FROM transactions ORDER BY date DESC').all()
    } catch (e) {
        console.error('Error fetching transactions:', e)
        throw e
    }
})

ipcMain.handle('add-transaction', (event, transaction) => {
    try {
        const { date, description, amount, type, category, bank_source } = transaction as Transaction
        const stmt = db.prepare(`
            INSERT INTO transactions (date, description, amount, type, category, bank_source)
            VALUES (?, ?, ?, ?, ?, ?)
        `)
        const info = stmt.run(date, description, amount, type, category, bank_source || 'Bank')
        return info.lastInsertRowid
    } catch (e) {
        console.error('Error adding transaction:', e)
        throw e
    }
})

ipcMain.handle('delete-transaction', (event, id) => {
    try {
        return db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
    } catch (e) {
        console.error('Error deleting transaction:', e)
        throw e
    }
})

ipcMain.handle('get-categories', () => {
    try {
        const refCategories = db.prepare('SELECT category FROM categories').all().map((c: any) => c.category)
        const usedCategories = db.prepare('SELECT DISTINCT category FROM transactions').all().map((c: any) => c.category)
        return Array.from(new Set([...refCategories, ...usedCategories])).filter(Boolean).sort()
    } catch (e) {
        console.error('Error fetching categories:', e)
        throw e
    }
})

ipcMain.handle('update-category-rule', (event, { keyword, category }) => {
    try {
        const stmt = db.prepare('INSERT OR REPLACE INTO categories (keyword, category) VALUES (?, ?)')
        return stmt.run(keyword, category)
    } catch (e) {
        console.error('Error updating category rule:', e)
        throw e
    }
})

ipcMain.handle('get-setting', (event, key) => {
    try {
        const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
        const result = stmt.get(key) as { value: string } | undefined
        return result ? result.value : null
    } catch (e) {
        console.error('Error fetching setting:', e)
        throw e
    }
})

ipcMain.handle('update-setting', (event, { key, value }) => {
    try {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
        return stmt.run(key, value)
    } catch (e) {
        console.error('Error updating setting:', e)
        throw e
    }
})

// --- Auto-Updater Events ---
autoUpdater.on('update-available', () => {
    mainWindow?.webContents.send('update-available')
})

autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded')
})

autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err)
})

ipcMain.handle('check-for-updates', () => {
    if (app.isPackaged) {
        return autoUpdater.checkForUpdatesAndNotify()
    }
    return null
})

ipcMain.handle('restart-app', () => {
    autoUpdater.quitAndInstall()
})

// --- Security Handlers ---
const hashPin = (pin: string) => {
    return crypto.createHash('sha256').update(pin).digest('hex')
}

ipcMain.handle('is-security-enabled', () => {
    try {
        const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
        const result = stmt.get('app_pin_hash')
        return !!result
    } catch (e) {
        return false
    }
})

ipcMain.handle('verify-pin', (event, pin) => {
    try {
        const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
        const result = stmt.get('app_pin_hash')
        if (!result) return true // No pin set, allow access
        return result.value === hashPin(pin)
    } catch (e) {
        return false
    }
})

ipcMain.handle('set-pin', (event, pin) => {
    try {
        const hash = hashPin(pin)
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
        stmt.run('app_pin_hash', hash)
        return true
    } catch (e) {
        console.error('Error setting PIN:', e)
        return false
    }
})

ipcMain.handle('disable-security', (event, pin) => {
    try {
        const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
        const result = stmt.get('app_pin_hash')
        if (result && result.value === hashPin(pin)) {
            db.prepare('DELETE FROM settings WHERE key = ?').run('app_pin_hash')
            return true
        }
        return false
    } catch (e) {
        return false
    }
})
