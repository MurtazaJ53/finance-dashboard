import React, { useState, useEffect, useMemo } from 'react'
import {
    LayoutDashboard,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    Settings,
    Upload,
    Trash2,
    Search,
    Filter,
    X,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Wallet,
    TrendingUp,
    Activity,
    Briefcase,
    RefreshCw,
    MessageSquare,
    Sparkles,
    PieChart,
    BarChart3,
    Coins,
    FileText,
    Download,
    Lock,
    Unlock,
    Shield
} from 'lucide-react'
import Papa from 'papaparse'
import { motion, AnimatePresence } from 'framer-motion'
import ReportGenerator from './components/ReportGenerator'
import AuthScreen from './components/AuthScreen'
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Filler
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'

// Register ChartJS
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Filler
)

declare global {
    interface Window {
        electron: {
            getTransactions: () => Promise<Transaction[]>
            addTransaction: (tx: Omit<Transaction, 'id'> | Transaction) => Promise<number>
            deleteTransaction: (id: number) => Promise<void>
            getCategories: () => Promise<string[]>
            updateCategoryRule: (rule: { keyword: string, category: string }) => Promise<void>
            getSetting: (key: string) => Promise<string>
            updateSetting: (key: string, value: string) => Promise<void>
            checkForUpdates: () => Promise<void>
            restartApp: () => Promise<void>
            onUpdateAvailable: (callback: () => void) => void
            onUpdateDownloaded: (callback: () => void) => void
            isSecurityEnabled: () => Promise<boolean>
            verifyPin: (pin: string) => Promise<boolean>
            setPin: (pin: string) => Promise<boolean>
            disableSecurity: (pin: string) => Promise<boolean>
        }
    }
}

// --- Types ---
interface Transaction {
    id?: number
    date: string
    description: string
    amount: number
    type: 'Credit' | 'Debit'
    category: string
}

// --- Components ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.95 }}
        className={`toast toast-${type}`}
    >
        <div className="toast-icon">
            {type === 'success' ? <CheckCircle2 size={18} /> : type === 'error' ? <AlertCircle size={18} /> : <Activity size={18} />}
        </div>
        <span>{message}</span>
        <button className="toast-close" onClick={onClose}><X size={14} /></button>
    </motion.div>
)

const AnimatedValue = ({ value, prefix = '₹' }: { value: number, prefix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
        let start = displayValue
        const end = value
        if (start === end) return

        const duration = 800
        const startTime = performance.now()

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 3) // easeOutCubic

            const current = Math.floor(start + (end - start) * ease)
            setDisplayValue(current)

            if (progress < 1) requestAnimationFrame(animate)
        }

        requestAnimationFrame(animate)
    }, [value])

    return <span>{prefix}{displayValue.toLocaleString()}</span>
}

const EmptyState = ({ icon: Icon, title, message }: { icon: any, title: string, message: string }) => (
    <div className="empty-state">
        <div className="empty-icon"><Icon size={48} /></div>
        <h3>{title}</h3>
        <p>{message}</p>
    </div>
)

const Sidebar = ({ activePage, setActivePage, onAddIncome, onAddExpense, aiInsight, updateStatus }: { activePage: string, setActivePage: (p: string) => void, onAddIncome: () => void, onAddExpense: () => void, aiInsight: string, updateStatus: 'none' | 'available' | 'downloaded' }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <Coins size={22} color="white" />
                </div>
                <h2>FINANCEPRO</h2>
            </div>

            <div className="sidebar-actions">
                <button className="sidebar-action-btn income" onClick={onAddIncome}>
                    <Plus size={16} /> Add Income
                </button>
                <button className="sidebar-action-btn expense" onClick={onAddExpense}>
                    <Plus size={16} /> Add Expense
                </button>
            </div>

            <nav style={{ flex: 1 }}>
                <div
                    className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActivePage('dashboard')}
                >
                    <LayoutDashboard size={18} /> Dashboard
                </div>
                <div
                    className={`nav-item ${activePage === 'transactions' ? 'active' : ''}`}
                    onClick={() => setActivePage('transactions')}
                >
                    <Activity size={18} /> Transactions
                </div>
                <div
                    className={`nav-item ${activePage === 'upload' ? 'active' : ''}`}
                    onClick={() => setActivePage('upload')}
                >
                    <RefreshCw size={18} /> Bank Sync
                </div>
                <div
                    className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
                    onClick={() => setActivePage('settings')}
                >
                    <MessageSquare size={18} /> AI Coach
                </div>
            </nav>

            <div className="ai-coach-widget">
                <div className="ai-coach-avatar">
                    <Sparkles size={20} color="white" />
                </div>
                <div className="ai-coach-text">
                    {aiInsight}
                </div>
                <button
                    className="ai-coach-btn"
                    onClick={() => {
                        setActivePage('dashboard');
                        setTimeout(() => {
                            const section = document.querySelector('.forecast-section');
                            section?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                    }}
                >
                    Adjust Budgets
                </button>
            </div>

            <div className="sidebar-divider" />

            {updateStatus !== 'none' && (
                <div className={`sidebar-update-prompt ${updateStatus}`} title={updateStatus === 'downloaded' ? 'Click to restart and update' : 'Downloading update...'}>
                    <div className="update-icon-wrapper">
                        {updateStatus === 'downloaded' ? (
                            <ArrowUpRight size={18} color="#00ff88" onClick={() => window.electron.restartApp()} />
                        ) : (
                            <RefreshCw size={18} className="spin" />
                        )}
                    </div>
                    <div className="update-text" onClick={() => updateStatus === 'downloaded' && window.electron.restartApp()}>
                        {updateStatus === 'downloaded' ? 'Update Ready' : 'Downloading...'}
                    </div>
                </div>
            )}

            <div className="sidebar-footer">
                FINANCEPRO V0.1.1
            </div>
        </div>
    )
}

// --- Main App ---

export default function App() {
    const [activePage, setActivePage] = useState('dashboard')
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' | 'info' }[]>([])
    const [startingBalance, setStartingBalance] = useState(0)
    const [isFabOpen, setIsFabOpen] = useState(false)

    // Modals
    const [showAddModal, setShowAddModal] = useState(false)
    const [modalType, setModalType] = useState<'Credit' | 'Debit'>('Debit')
    const [showBalanceModal, setShowBalanceModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

    // Form State
    const [newTx, setNewTx] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Miscellaneous' })
    const [budgets, setBudgets] = useState<Record<string, number>>({})
    const [showBudgetModal, setShowBudgetModal] = useState(false)
    const [categories, setCategories] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState('All Categories')
    const [showImportModal, setShowImportModal] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [isLocked, setIsLocked] = useState(true)
    const [isSecurityEnabled, setIsSecurityEnabled] = useState(false)
    const [showSecurityModal, setShowSecurityModal] = useState(false)
    const [securityPinInput, setSecurityPinInput] = useState('')
    const [securityPinCurrent, setSecurityPinCurrent] = useState('')
    const [importData, setImportData] = useState<Transaction[]>([])
    const [updateStatus, setUpdateStatus] = useState<'none' | 'available' | 'downloaded'>('none')

    useEffect(() => {
        const checkSecurity = async () => {
            const enabled = await window.electron.isSecurityEnabled()
            setIsSecurityEnabled(enabled)
            setIsLocked(enabled)
        }
        checkSecurity()
        loadData()

        window.electron.onUpdateAvailable(() => {
            setUpdateStatus('available')
            addToast('New update is available and downloading in background...', 'info')
        })

        window.electron.onUpdateDownloaded(() => {
            setUpdateStatus('downloaded')
            addToast('Update ready! Click the update icon in sidebar to restart.', 'success')
        })
    }, [])

    const loadData = async () => {
        try {
            const txs = await window.electron.getTransactions()
            setTransactions(txs || [])
            const bal = await window.electron.getSetting('starting_balance')
            setStartingBalance(Number(bal) || 0)

            const cats = await window.electron.getCategories()
            setCategories(cats || [])

            const savedBudgets = await window.electron.getSetting('category_budgets')
            if (savedBudgets) {
                try {
                    setBudgets(JSON.parse(savedBudgets))
                } catch (e) {
                    console.error('Failed to parse budgets', e)
                }
            } else {
                // Default budgets
                setBudgets({
                    'Food & Dining': 5000,
                    'Shopping': 3000,
                    'Rent/Bills': 15000,
                    'Miscellaneous': 2000
                })
            }
        } catch (err) {
            addToast('Failed to load data', 'error')
        }
    }

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }

    const handleAddTransaction = async () => {
        if (!newTx.description || !newTx.amount) {
            addToast('Please fill all required fields', 'error')
            return
        }
        try {
            await window.electron.addTransaction({
                ...newTx,
                amount: Number(newTx.amount),
                type: modalType
            })
            addToast(`Transaction added successfully`, 'success')
            setShowAddModal(false)
            setNewTx({ description: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'Miscellaneous' })
            loadData()
        } catch (err) {
            addToast('Failed to add transaction', 'error')
        }
    }

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: Papa.ParseResult<any>) => {
                const parsed: Transaction[] = results.data.map((row: any) => ({
                    date: row.Date || row.date || new Date().toISOString().split('T')[0],
                    description: row.Description || row.description || row.Payee || 'Imported Transaction',
                    amount: Math.abs(Number(row.Amount || row.amount || 0)),
                    type: (Number(row.Amount || row.amount || 0) >= 0 ? 'Credit' : 'Debit') as 'Credit' | 'Debit',
                    category: row.Category || row.category || 'Miscellaneous'
                })).filter((t) => t.description && !isNaN(t.amount))

                setImportData(parsed)
                setShowImportModal(true)
            }
        })
    }

    const confirmImport = async () => {
        try {
            for (const tx of importData) {
                await window.electron.addTransaction(tx)
            }
            addToast(`Successfully imported ${importData.length} transactions`, 'success')
            setShowImportModal(false)
            loadData()
        } catch (err) {
            addToast('Error importing transactions', 'error')
        }
    }

    const handleDeleteTransaction = async (id: number) => {
        try {
            await window.electron.deleteTransaction(id)
            addToast('Transaction deleted', 'info')
            setShowDeleteConfirm(null)
            loadData()
        } catch (err) {
            addToast('Failed to delete', 'error')
        }
    }

    const updateBalance = async (val: string) => {
        try {
            await window.electron.updateSetting('starting_balance', val)
            setStartingBalance(Number(val))
            addToast('Starting funds updated', 'success')
            setShowBalanceModal(false)
        } catch (err) {
            addToast('Failed to update balance', 'error')
        }
    }

    const updateBudget = async (category: string, amount: number) => {
        try {
            const newBudgets = { ...budgets, [category]: amount }
            setBudgets(newBudgets)
            await window.electron.updateSetting('category_budgets', JSON.stringify(newBudgets))
            addToast(`Budget updated for ${category}`, 'success')
        } catch (err) {
            addToast('Failed to update budget', 'error')
        }
    }

    const handleSetPin = async () => {
        if (securityPinInput.length < 4) {
            addToast('PIN must be at least 4 digits', 'error')
            return
        }
        const success = await window.electron.setPin(securityPinInput)
        if (success) {
            setIsSecurityEnabled(true)
            setShowSecurityModal(false)
            setSecurityPinInput('')
            addToast('Security PIN set successfully!', 'success')
        } else {
            addToast('Failed to set PIN', 'error')
        }
    }

    const handleDisableSecurity = async () => {
        const success = await window.electron.disableSecurity(securityPinCurrent)
        if (success) {
            setIsSecurityEnabled(false)
            setShowSecurityModal(false)
            setSecurityPinCurrent('')
            addToast('Security PIN disabled', 'info')
        } else {
            addToast('Incorrect current PIN', 'error')
        }
    }

    // --- Calculations ---

    const filteredTransactions = useMemo(() => {
        return transactions.filter((t: Transaction) => {
            if (!t) return false
            const matchesSearch = (t.description || '').toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = filterCategory === 'All Categories' || t.category === filterCategory
            return matchesSearch && matchesCategory
        })
    }, [transactions, searchQuery, filterCategory])

    const summary = useMemo(() => {
        const income = transactions.filter((t: Transaction) => t && t.type === 'Credit').reduce((sum: number, t: Transaction) => sum + (t?.amount || 0), 0)
        const expense = transactions.filter((t: Transaction) => t && t.type === 'Debit').reduce((sum: number, t: Transaction) => sum + (t?.amount || 0), 0)
        return {
            income,
            expense,
            balance: income - expense,
            netWorth: startingBalance + (income - expense)
        }
    }, [transactions, startingBalance])

    const chartData = useMemo(() => {
        const categories: Record<string, number> = {}
        transactions.filter(t => t && t.type === 'Debit').forEach(t => {
            if (t?.category) categories[t.category] = (categories[t.category] || 0) + (t.amount || 0)
        })

        const labels = Object.keys(categories)
        const data = Object.values(categories)

        return {
            labels,
            datasets: [{
                data,
                backgroundColor: [
                    '#4f7cff', '#00c897', '#ff4757', '#7c5cfc', '#ffb347', '#00d4ff', '#ff6b9d', '#c084fc'
                ],
                borderWidth: 0,
                hoverOffset: 15,
                cutout: '75%'
            }]
        }
    }, [transactions])

    const budgetStatus = useMemo(() => {
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()

        const monthlySpent: Record<string, number> = {}
        transactions.filter(t => {
            if (!t) return false
            const d = new Date(t.date)
            return t.type === 'Debit' && d.getMonth() === currentMonth && d.getFullYear() === currentYear
        }).forEach(t => {
            if (t?.category) monthlySpent[t.category] = (monthlySpent[t.category] || 0) + (t.amount || 0)
        })

        const safeBudgets = (budgets && typeof budgets === 'object') ? budgets : {}
        return Object.entries(safeBudgets as Record<string, number>).map(([category, limit]) => {
            const spent = monthlySpent[category] || 0
            const percent = limit > 0 ? (spent / limit) * 100 : 0
            return { category, spent, limit, percent }
        })
    }, [transactions, budgets])

    const financialHealth = useMemo(() => {
        const monthlyIncome = transactions.filter((t: Transaction) => t && t.type === 'Credit').reduce((sum: number, t: Transaction) => sum + (t?.amount || 0), 0)
        const monthlyExpense = transactions.filter((t: Transaction) => t && t.type === 'Debit').reduce((sum: number, t: Transaction) => sum + (t?.amount || 0), 0)
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0
        const budgetAdherence = budgetStatus.length > 0 ? (budgetStatus.filter(b => b.spent <= b.limit).length / budgetStatus.length) * 100 : 100
        return Math.min(100, Math.max(0, (savingsRate * 0.6) + (budgetAdherence * 0.4)))
    }, [transactions, budgetStatus])

    const forecastData = useMemo(() => {
        const months = []
        const trendData = []

        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            const monthLabel = d.toLocaleString('default', { month: 'short' })
            months.push(monthLabel)

            const monthTotal = transactions.filter((t: Transaction) => {
                if (!t) return false
                const td = new Date(t.date)
                return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
            }).reduce((sum: number, t: Transaction) => sum + (t?.type === 'Credit' ? (t.amount || 0) : -(t?.amount || 0)), 0)

            trendData.push(monthTotal)
        }

        return {
            labels: months,
            datasets: [{
                label: 'Net Trend',
                data: trendData,
                borderColor: '#4f7cff',
                backgroundColor: 'rgba(79, 124, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2
            }]
        }
    }, [transactions])

    // --- Advanced AI Insights Engine ---
    const insights = useMemo(() => {
        if (transactions.length === 0) return { primary: "Welcome! Add your first transaction.", metrics: [] }

        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1)
        const lastMonth = lastMonthDate.getMonth()
        const lastYear = lastMonthDate.getFullYear()

        const filterMonth = (txs: Transaction[], m: number, y: number) =>
            txs.filter(t => {
                const d = new Date(t.date)
                return d.getMonth() === m && d.getFullYear() === y
            })

        const currentTxs = filterMonth(transactions, currentMonth, currentYear)
        const prevTxs = filterMonth(transactions, lastMonth, lastYear)

        const getSpending = (txs: Transaction[]) => txs.filter(t => t.type === 'Debit').reduce((acc, t) => acc + t.amount, 0)

        const currentSpending = getSpending(currentTxs)
        const prevSpending = getSpending(prevTxs)

        let momText = ""
        if (prevSpending > 0) {
            const diff = ((currentSpending - prevSpending) / prevSpending) * 100
            momText = diff > 0
                ? `You've spent ${diff.toFixed(0)}% more than last month.`
                : `Great! You're spending ${Math.abs(diff).toFixed(0)}% less than last month.`
        }

        // Pacing Alert
        const dayOfMonth = now.getDate()
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        const monthProgress = dayOfMonth / daysInMonth

        const alerts: string[] = []
        Object.entries(budgets).forEach(([cat, limit]) => {
            const catSpending = currentTxs.filter(t => t.category === cat && t.type === 'Debit').reduce((acc, t) => acc + t.amount, 0)
            if (catSpending > limit * monthProgress && catSpending <= limit) {
                alerts.push(`Caution: You are pacing fast on "${cat}".`)
            } else if (catSpending > limit) {
                alerts.push(`Alert: Over budget on "${cat}"!`)
            }
        })

        // Pattern Recognition (Simple similarity)
        const recurring: string[] = []
        const descriptions = transactions.map(t => t.description.toLowerCase())
        const uniqueDescs = Array.from(new Set(descriptions))
        uniqueDescs.forEach(desc => {
            const occurrences = transactions.filter(t => t.description.toLowerCase() === desc)
            if (occurrences.length >= 3) {
                const months = new Set(occurrences.map(t => new Date(t.date).getMonth()))
                if (months.size >= 2) recurring.push(occurrences[0].description)
            }
        })

        return {
            primary: momText || (currentSpending > 0 ? `Analysis: You've spent ₹${currentSpending.toLocaleString()} this month.` : "Start tracking to see trends."),
            alerts,
            recurring: recurring.slice(0, 2),
            pacing: currentSpending > (summary.income * 0.8) ? "High spending alert" : null
        }
    }, [transactions, summary.income, budgets])

    const aiInsight = useMemo(() => {
        if (insights.alerts && insights.alerts.length > 0) return insights.alerts[0]
        if (insights.recurring && insights.recurring.length > 0) return `Recurring found: ${insights.recurring[0]}`
        return insights.primary || "Finances looking stable. Review your weekly forecast for upcoming trends."
    }, [insights])

    return (
        <>
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                onAddIncome={() => { setModalType('Credit'); setShowAddModal(true); }}
                onAddExpense={() => { setModalType('Debit'); setShowAddModal(true); }}
                aiInsight={aiInsight}
                updateStatus={updateStatus}
            />

            <main className="main-content">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1>{activePage.toUpperCase()} OVERVIEW</h1>
                        <div className="subtitle">{transactions.length} transactions recorded — {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                    </div>
                    <div className="page-header-actions">
                        <button className="btn-green" onClick={() => { setModalType('Debit'); setShowAddModal(true); }}>
                            <Plus size={16} /> NEW TRANSACTION
                        </button>
                        <button className="btn-ghost" onClick={() => setShowReportModal(true)}>
                            <FileText size={16} /> GENERATE REPORT
                        </button>
                        <button className="btn-ghost" onClick={() => setShowSecurityModal(true)}>
                            <Shield size={16} /> SECURITY
                        </button>
                        <button className="btn-ghost" onClick={() => setShowBalanceModal(true)}>
                            <Settings size={16} /> CONFIGURE STARTING FUNDS
                        </button>
                    </div>
                </div>

                {activePage === 'dashboard' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        {/* 4 Summary Cards */}
                        <div className="dashboard-grid">
                            <div className="glass summary-card income-card">
                                <div className="card-header">
                                    <h3>TOTAL INCOME</h3>
                                    <div className="card-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                                        <ArrowUpRight size={18} />
                                    </div>
                                </div>
                                <div className="value"><AnimatedValue value={summary.income} /></div>
                                <div className="trend trend-up">
                                    <TrendingUp size={14} /> <span>Earnings</span>
                                </div>
                            </div>

                            <div className="glass summary-card expense-card">
                                <div className="card-header">
                                    <h3>TOTAL EXPENSES</h3>
                                    <div className="card-icon" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
                                        <ArrowDownRight size={18} />
                                    </div>
                                </div>
                                <div className="value"><AnimatedValue value={summary.expense} /></div>
                                <div className="trend trend-down">
                                    <ArrowDownRight size={14} /> <span>Spending</span>
                                </div>
                            </div>

                            <div className="glass summary-card balance-card">
                                <div className="card-header">
                                    <h3>NET BALANCE</h3>
                                    <div className="card-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                                        <Wallet size={18} />
                                    </div>
                                </div>
                                <div className="value"><AnimatedValue value={summary.balance} /></div>
                                <div className="trend">
                                    <Settings size={14} /> <span>Starting: ₹{startingBalance.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="glass summary-card networth-card">
                                <div className="card-header">
                                    <h3>NET WORTH</h3>
                                    <div className="card-icon" style={{ background: 'var(--purple-bg)', color: 'var(--purple)' }}>
                                        <Activity size={18} />
                                    </div>
                                </div>
                                <div className="value"><AnimatedValue value={summary.netWorth} /></div>
                                <div className="trend">
                                    <div style={{ height: '14px', width: '60px', borderRadius: '4px', overflow: 'hidden' }}>
                                        <svg width="60" height="14" viewBox="0 0 60 14" fill="none">
                                            <path d="M0 10C5 8 10 12 15 10C20 8 25 2 30 6C35 10 40 12 45 8C50 4 55 6 60 2" stroke="var(--purple)" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Row 1: Expenses By Category & Recent Activity */}
                        <div className="content-grid">
                            <div className="glass chart-container">
                                <div className="chart-header">
                                    <h3>EXPENSES BY CATEGORY</h3>
                                    <div className="chart-meta">{transactions.filter(t => t && t.type === 'Debit').length} categories</div>
                                </div>
                                {transactions.some(t => t && t.type === 'Debit') ? (
                                    <div className="doughnut-wrapper">
                                        <div style={{ width: '220px', height: '220px' }}>
                                            <Doughnut
                                                data={chartData}
                                                options={{ plugins: { legend: { display: false } }, cutout: '78%' }}
                                            />
                                        </div>
                                        <div className="doughnut-center">
                                            <div className="center-amount">₹{summary.expense.toLocaleString()}</div>
                                            <div className="center-label">Total Spent</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '4px' }}>100%</div>
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyState icon={PieChart} title="No Expenses Yet" message="Add transactions to see your spending breakdown" />
                                )}

                                <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                    {(chartData.labels || []).filter(Boolean).map((label: any, i: number) => (
                                        <div key={label} className="category-badge">
                                            <span className="cat-dot" style={{ background: chartData.datasets?.[0]?.backgroundColor?.[i] || 'var(--blue)' }} />
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass chart-container">
                                <div className="chart-header">
                                    <h3>RECENT ACTIVITY</h3>
                                </div>
                                <div className="activity-list">
                                    {transactions.filter(t => !!t).slice(0, 10).map((tx, i) => (
                                        <motion.div
                                            key={tx.id || i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="activity-item"
                                        >
                                            <div className="activity-icon" style={{
                                                background: tx.type === 'Credit' ? 'var(--green-bg)' : 'var(--red-bg)',
                                                color: tx.type === 'Credit' ? 'var(--green)' : 'var(--red)'
                                            }}>
                                                {tx.type === 'Credit' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                            </div>
                                            <div className="activity-details">
                                                <div className="activity-desc">{tx.description}</div>
                                                <div className="activity-meta">{new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {tx.category}</div>
                                            </div>
                                            <div className="activity-amount">
                                                <div className={`amount ${tx.type === 'Credit' ? 'trend-up' : 'trend-down'}`}>
                                                    {tx.type === 'Credit' ? '+' : '-'}{tx.amount.toLocaleString()}
                                                </div>
                                                <div className={`status-badge ${i % 3 === 0 ? 'badge-confirmed' : 'badge-pending'}`}>
                                                    {i % 3 === 0 ? 'CONFIRMED' : 'MANUAL'}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {transactions.length === 0 && <EmptyState icon={Activity} title="No Activity" message="Your recent transactions will appear here" />}
                                </div>
                            </div>
                        </div>

                        {/* Content Row 2: Investment Portfolio & Forecast */}
                        <div className="content-grid-3">
                            <div className="glass investment-widget">
                                <h3>INVESTMENT PORTFOLIO</h3>
                                <div className="investment-items">
                                    <div className="investment-item">
                                        <div className="investment-icon" style={{ background: 'rgba(255, 179, 71, 0.1)', color: 'var(--amber)' }}>
                                            <Coins size={20} />
                                        </div>
                                        <div className="investment-label">Gold Asset</div>
                                        <div className="investment-value">₹0</div>
                                        <div className="investment-change">0%</div>
                                    </div>
                                    <div className="investment-item">
                                        <div className="investment-icon" style={{ background: 'rgba(200, 200, 200, 0.1)', color: '#a0a0b0' }}>
                                            <Activity size={20} />
                                        </div>
                                        <div className="investment-label">Silver Asset</div>
                                        <div className="investment-value">₹0</div>
                                        <div className="investment-change">0%</div>
                                    </div>
                                </div>
                            </div>
                            <div className="glass forecast-section">
                                <div className="chart-header">
                                    <h3>MONTHLY BUDGET STATUS</h3>
                                    <button className="btn-tiny" onClick={() => setShowBudgetModal(true)}>MANAGE</button>
                                </div>
                                {budgetStatus.length > 0 ? budgetStatus.map(b => (
                                    <div className="budget-item" key={b.category}>
                                        <div className="budget-item-header">
                                            <div className="budget-item-label">{b.category}</div>
                                            <div className="budget-item-value">{Math.round(b.percent)}%</div>
                                        </div>
                                        <div className="budget-bar">
                                            <div
                                                className="budget-bar-fill"
                                                style={{
                                                    width: `${Math.min(b.percent, 100)}%`,
                                                    background: b.percent > 100 ? 'var(--red)' : b.percent > 80 ? 'var(--amber)' : 'var(--blue)'
                                                }}
                                            />
                                        </div>
                                        <div className="budget-meta">₹{b.spent.toLocaleString()} / ₹{b.limit.toLocaleString()}</div>
                                    </div>
                                )) : (
                                    <EmptyState icon={PieChart} title="No Budgets" message="Click Manage to set your first budget limit" />
                                )}
                            </div>
                        </div>

                        {/* Forecast Row 3 */}
                        <div className="glass forecast-section" style={{ marginBottom: '2rem' }}>
                            <div className="chart-header">
                                <h3>SIX-MONTH FINANCIAL FORECAST</h3>
                            </div>
                            <div style={{ height: '180px' }}>
                                <Line
                                    data={forecastData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            x: { grid: { display: false }, ticks: { color: '#5c5c7a' } },
                                            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#5c5c7a' } }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {activePage === 'upload' && (
                    <div className="glass" style={{ padding: '3rem', textAlign: 'center' }}>
                        <div className="empty-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)', width: '64px', height: '64px', margin: '0 auto 1.5rem' }}>
                            <Upload size={32} />
                        </div>
                        <h2>BANK SYNC</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                            Upload your bank statement (CSV) to automatically categorize and log your transactions.
                        </p>
                        <input
                            type="file"
                            accept=".csv"
                            id="csv-upload"
                            style={{ display: 'none' }}
                            onChange={handleImportCSV}
                        />
                        <label htmlFor="csv-upload" className="btn-green" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={18} /> SELECT CSV FILE
                        </label>

                        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                            <div className="glass-sm" style={{ padding: '1.5rem' }}>
                                <CheckCircle2 size={24} color="var(--green)" />
                                <h4 style={{ marginTop: '1rem' }}>Automatic</h4>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Smart matching</p>
                            </div>
                            <div className="glass-sm" style={{ padding: '1.5rem' }}>
                                <Activity size={24} color="var(--blue)" />
                                <h4 style={{ marginTop: '1rem' }}>Secure</h4>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Local parsing</p>
                            </div>
                            <div className="glass-sm" style={{ padding: '1.5rem' }}>
                                <TrendingUp size={24} color="var(--purple)" />
                                <h4 style={{ marginTop: '1rem' }}>Synced</h4>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Instant update</p>
                            </div>
                        </div>
                    </div>
                )}

                {activePage === 'settings' && (
                    <div className="ai-coach-page">
                        <div className="glass ai-header-card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(79,124,255,0.1) 0%, rgba(124,92,252,0.1) 100%)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div className="ai-coach-avatar-lg">
                                    <Sparkles size={32} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0 }}>MEET YOUR AI COACH</h2>
                                    <p style={{ opacity: 0.8, margin: '0.2rem 0 0' }}>Personalized financial strategy powered by your data</p>
                                </div>
                            </div>
                        </div>

                        <div className="content-grid">
                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <div className="chart-header">
                                    <h3>FINANCIAL HEALTH SCORE</h3>
                                </div>
                                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                    <div style={{ fontSize: '4rem', fontWeight: 800, color: financialHealth > 70 ? 'var(--green)' : financialHealth > 40 ? 'var(--amber)' : 'var(--red)' }}>
                                        {Math.round(financialHealth)}
                                    </div>
                                    <div style={{ fontWeight: 600, opacity: 0.7 }}>Out of 100</div>
                                </div>
                                <p style={{ fontSize: '0.9rem', textAlign: 'center', opacity: 0.8 }}>
                                    {financialHealth > 70
                                        ? "Excellent! You're saving more than you spend. Your financial habits are very strong."
                                        : financialHealth > 40
                                            ? "You're doing okay, but there's room for improvement. Watch your miscellaneous spending."
                                            : "Action needed: Your expenses are very high relative to your income. Review your budget immediately."}
                                </p>
                            </div>

                            <div className="glass" style={{ padding: '1.5rem' }}>
                                <div className="chart-header">
                                    <h3>SMART ALERTS</h3>
                                </div>
                                <div className="activity-list">
                                    <div className="activity-item">
                                        <AlertCircle size={18} color="var(--amber)" />
                                        <div className="activity-details">
                                            <div className="activity-desc">Subscription Overload</div>
                                            <div className="activity-meta">You have 5 recurring charges this week.</div>
                                        </div>
                                    </div>
                                    <div className="activity-item">
                                        <CheckCircle2 size={18} color="var(--green)" />
                                        <div className="activity-details">
                                            <div className="activity-desc">Rent Protected</div>
                                            <div className="activity-meta">Your balance covers next month's rent.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                            <h3>COACH'S RECOMMENDATIONS</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                <div className=" glass-sm" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                                    <h4 style={{ color: 'var(--blue)', marginBottom: '0.5rem' }}>Emergency Fund</h4>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Save at least 3 months of expenses (₹{(summary.expense * 3).toLocaleString()}) to be safe.</p>
                                </div>
                                <div className=" glass-sm" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                                    <h4 style={{ color: 'var(--purple)', marginBottom: '0.5rem' }}>Investment Opportunity</h4>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Based on your savings trend, you can comfortably invest ₹{Math.floor(summary.balance * 0.2).toLocaleString()} monthly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activePage === 'transactions' && (
                    <div className="glass table-container">
                        <div className="search-filter-bar">
                            <div className="search-input-wrapper">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchQuery}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select
                                className="filter-select"
                                value={filterCategory}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCategory(e.target.value)}
                            >
                                <option>All Categories</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>DATE</th>
                                    <th>DESCRIPTION</th>
                                    <th>CATEGORY</th>
                                    <th>TYPE</th>
                                    <th>AMOUNT</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(filteredTransactions || []).map(tx => {
                                    if (!tx) return null
                                    const dateStr = tx.date ? new Date(tx.date).toLocaleDateString() : 'Unknown Date'
                                    return (
                                        <tr key={tx.id || Math.random()}>
                                            <td>{dateStr}</td>
                                            <td>{tx.description || 'N/A'}</td>
                                            <td><span className="category-badge">{tx.category}</span></td>
                                            <td>
                                                <span className={`type-badge ${tx.type === 'Credit' ? 'type-credit' : 'type-debit'}`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className={tx.type === 'Credit' ? 'trend-up' : 'trend-down'} style={{ fontWeight: 700 }}>
                                                ₹{tx.amount.toLocaleString()}
                                            </td>
                                            <td>
                                                <button className="delete-btn" onClick={() => setShowDeleteConfirm(tx.id ?? null)}>
                                                    <Trash2 size={16} color="var(--red)" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && <EmptyState icon={Activity} title="No Transactions Foundations" message="No matching records found" />}
                    </div>
                )}

                {/* FAB Menu */}
                <div className="fab-container">
                    <AnimatePresence>
                        {isFabOpen && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fab-menu">
                                <div className="fab-option income" onClick={() => { setModalType('Credit'); setShowAddModal(true); setIsFabOpen(false); }}>
                                    <Plus size={16} /> ADD INCOME
                                </div>
                                <div className="fab-option expense" onClick={() => { setModalType('Debit'); setShowAddModal(true); setIsFabOpen(false); }}>
                                    <Plus size={16} /> ADD EXPENSE
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button className={`fab-btn ${isFabOpen ? 'open' : ''}`} onClick={() => setIsFabOpen(!isFabOpen)}>
                        <Plus size={24} />
                    </button>
                </div>
            </main >

            {/* Modals & Toasts */}
            <AnimatePresence>
                {
                    showImportModal && (
                        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-card import-modal" onClick={e => e.stopPropagation()}>
                                <h2>CONFIRM IMPORT</h2>
                                <p className="modal-subtitle">Previewing {importData.length} detected transactions</p>

                                <div className="import-preview" style={{ maxHeight: '300px', overflowY: 'auto', margin: '1.5rem 0', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}>
                                    <table style={{ width: '100%', fontSize: '0.75rem' }}>
                                        <thead>
                                            <tr>
                                                <th>DATE</th>
                                                <th>DESC</th>
                                                <th>AMOUNT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importData.map((t, idx) => (
                                                <tr key={idx}>
                                                    <td>{t.date}</td>
                                                    <td>{t.description}</td>
                                                    <td>₹{t.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <datalist id="category-list">
                                    {categories.filter(Boolean).map(cat => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>

                                <div className="modal-actions">
                                    <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowImportModal(false)}>CANCEL</button>
                                    <button className="btn-green" style={{ flex: 2 }} onClick={confirmImport}>IMPORT ALL</button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {
                    showAddModal && (
                        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-card" onClick={e => e.stopPropagation()}>
                                <h2>ADD {modalType.toUpperCase()}</h2>
                                <p className="modal-subtitle">Log a new financial entry</p>

                                <div className="form-group">
                                    <label>DESCRIPTION</label>
                                    <input value={newTx.description} onChange={e => setNewTx({ ...newTx, description: e.target.value })} placeholder="e.g. Salary, Coffee" />
                                </div>
                                <div className="form-group">
                                    <label>AMOUNT (₹)</label>
                                    <input type="number" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} placeholder="0.00" />
                                </div>
                                <div className="form-group">
                                    <label>DATE</label>
                                    <input type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>CATEGORY</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            list="category-suggestions"
                                            value={newTx.category}
                                            onChange={e => setNewTx({ ...newTx, category: e.target.value })}
                                            placeholder="Type or select category"
                                        />
                                        <datalist id="category-suggestions">
                                            {categories.filter(Boolean).map(c => <option key={c} value={c} />)}
                                            <option value="Food & Dining" />
                                            <option value="Shopping" />
                                            <option value="Travel" />
                                            <option value="Salary" />
                                            <option value="Investment" />
                                            <option value="Rent/Bills" />
                                            <option value="Miscellaneous" />
                                        </datalist>
                                    </div>
                                </div>
                                <datalist id="filter-category-list">
                                    <option value="All Categories" />
                                    {categories.filter(Boolean).map(cat => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>

                                <div className="modal-actions">
                                    <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>CANCEL</button>
                                    <button
                                        className={modalType === 'Credit' ? 'btn-green' : 'btn-red'}
                                        style={{ flex: 2 }}
                                        onClick={handleAddTransaction}
                                    >
                                        SAVE {modalType.toUpperCase()}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {
                    showBalanceModal && (
                        <div className="modal-overlay" onClick={() => setShowBalanceModal(false)}>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-card" onClick={e => e.stopPropagation()}>
                                <h2>UPDATE FUNDS</h2>
                                <p className="modal-subtitle">Set your starting account balance</p>
                                <div className="form-group">
                                    <label>TOTAL ASSETS (₹)</label>
                                    <input
                                        type="number"
                                        defaultValue={startingBalance}
                                        autoFocus
                                        onKeyDown={e => { if (e.key === 'Enter') updateBalance(e.currentTarget.value) }}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowBalanceModal(false)}>CANCEL</button>
                                    <button className="btn-green" style={{ flex: 2 }} onClick={(e) => {
                                        const val = (e.currentTarget.parentElement?.previousElementSibling?.querySelector('input') as HTMLInputElement).value
                                        updateBalance(val)
                                    }}>SAVE CHANGES</button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {
                    showDeleteConfirm && (
                        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-card" onClick={e => e.stopPropagation()}>
                                <h2>CONFIRM DELETE</h2>
                                <div className="confirm-dialog">
                                    <p>Are you sure you want to remove this transaction? This action cannot be undone.</p>
                                    <div className="modal-actions">
                                        <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>KEEP IT</button>
                                        <button className="btn-danger" style={{ flex: 1 }} onClick={() => handleDeleteTransaction(showDeleteConfirm)}>DELETE</button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {
                    showSecurityModal && (
                        <div className="modal-overlay" onClick={() => setShowSecurityModal(false)}>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-card" onClick={e => e.stopPropagation()}>
                                <div className="modal-header">
                                    <div className="title-with-icon">
                                        <Lock size={20} color="var(--blue)" />
                                        <h2>APP SECURITY</h2>
                                    </div>
                                    <button className="close-btn" onClick={() => setShowSecurityModal(false)}><X size={20} /></button>
                                </div>

                                <div className="security-settings">
                                    {isSecurityEnabled ? (
                                        <div className="security-form">
                                            <p className="modal-subtitle">Security is currently ENABLED. Enter your current PIN to disable it.</p>
                                            <div className="form-group">
                                                <label>CURRENT PIN</label>
                                                <input
                                                    type="password"
                                                    maxLength={6}
                                                    value={securityPinCurrent}
                                                    onChange={e => setSecurityPinCurrent(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="Enter 4-6 digit PIN"
                                                />
                                            </div>
                                            <div className="modal-actions">
                                                <button className="btn-danger" style={{ width: '100%' }} onClick={handleDisableSecurity}>DISABLE SECURITY</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="security-form">
                                            <p className="modal-subtitle">Set a 4-6 digit PIN to protect your financial data on startup.</p>
                                            <div className="form-group">
                                                <label>NEW PIN</label>
                                                <input
                                                    type="password"
                                                    maxLength={6}
                                                    value={securityPinInput}
                                                    onChange={e => setSecurityPinInput(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="Create 4-6 digit PIN"
                                                />
                                            </div>
                                            <div className="modal-actions">
                                                <button className="btn-green" style={{ width: '100%' }} onClick={handleSetPin}>ENABLE SECURITY</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {
                    showBudgetModal && (
                        <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-card" onClick={e => e.stopPropagation()}>
                                <h2>MANAGE BUDGETS</h2>
                                <p className="modal-subtitle">Set monthly spending limits by category</p>
                                <div className="budget-editor-list">
                                    {['Food & Dining', 'Shopping', 'Travel', 'Investment', 'Rent/Bills', 'Miscellaneous'].map(cat => (
                                        <div className="budget-editor-item" key={cat}>
                                            <label>{cat.toUpperCase()}</label>
                                            <input
                                                type="number"
                                                value={budgets[cat] || 0}
                                                onChange={e => updateBudget(cat, Number(e.target.value))}
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="modal-actions" style={{ marginTop: '2rem' }}>
                                    <button className="btn-green" style={{ width: '100%' }} onClick={() => setShowBudgetModal(false)}>DONE</button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
                <AnimatePresence>
                    {showReportModal && (
                        <ReportGenerator
                            transactions={filteredTransactions}
                            onClose={() => setShowReportModal(false)}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isLocked && isSecurityEnabled && (
                        <AuthScreen onUnlock={() => setIsLocked(false)} />
                    )}
                </AnimatePresence>
            </AnimatePresence >

            <div className="toast-container">
                <AnimatePresence>
                    {toasts.map(t => (
                        <Toast key={t.id} {...t} onClose={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} />
                    ))}
                </AnimatePresence>
            </div>
        </>
    )
}
