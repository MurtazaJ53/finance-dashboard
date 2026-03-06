import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
    getTransactions: () => ipcRenderer.invoke('get-transactions'),
    addTransaction: (transaction: any) => ipcRenderer.invoke('add-transaction', transaction),
    deleteTransaction: (id: number) => ipcRenderer.invoke('delete-transaction', id),
    getCategories: () => ipcRenderer.invoke('get-categories'),
    updateCategoryRule: (rule: any) => ipcRenderer.invoke('update-category-rule', rule),
    getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
    updateSetting: (key: string, value: string) => ipcRenderer.invoke('update-setting', { key, value }),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    restartApp: () => ipcRenderer.invoke('restart-app'),
    onUpdateAvailable: (callback: () => void) => ipcRenderer.on('update-available', () => callback()),
    onUpdateDownloaded: (callback: () => void) => ipcRenderer.on('update-downloaded', () => callback())
})
