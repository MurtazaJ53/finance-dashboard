import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle, LogOut, Shield } from 'lucide-react'

interface CloudSyncProps {
    onSyncComplete?: () => void
}

const CloudSync: React.FC<CloudSyncProps> = ({ onSyncComplete }) => {
    const [isConnected, setIsConnected] = useState(false)
    const [lastSync, setLastSync] = useState<string | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadStatus = async () => {
            const syncTime = await window.electron.getSetting('last_cloud_sync')
            if (syncTime) setLastSync(syncTime)
            // Ideally check connection status via token presence
        }
        loadStatus()
    }, [])

    const handleConnect = async () => {
        setIsSyncing(true)
        setError(null)
        try {
            const success = await window.electron.authGoogle()
            if (success) {
                setIsConnected(true)
                // Trigger initial backup
                await handleBackup()
            } else {
                setError('Authentication failed')
            }
        } catch (e) {
            setError('Connection error')
        } finally {
            setIsSyncing(false)
        }
    }

    const handleBackup = async () => {
        setIsSyncing(true)
        setError(null)
        try {
            const success = await window.electron.backupData()
            if (success) {
                const now = new Date().toLocaleString()
                setLastSync(now)
                await window.electron.updateSetting('last_cloud_sync', now)
                onSyncComplete?.()
            } else {
                setError('Backup failed. Check permissions.')
            }
        } catch (e) {
            setError('Sync error')
        } finally {
            setIsSyncing(false)
        }
    }

    const handleRestore = async () => {
        if (!confirm('Are you sure? This will replace your local data with the cloud backup. The app will restart.')) return

        setIsSyncing(true)
        try {
            const success = await window.electron.restoreData()
            if (success) {
                await window.electron.restartApp()
            } else {
                setError('No backup found or restore failed')
            }
        } catch (e) {
            setError('Restore error')
        } finally {
            setIsSyncing(false)
        }
    }

    const handleLogout = async () => {
        await window.electron.logoutGoogle()
        setIsConnected(false)
        setLastSync(null)
        await window.electron.updateSetting('last_cloud_sync', '')
    }

    return (
        <div className="cloud-sync-card">
            <div className="sync-header">
                <div className="sync-title">
                    {isConnected ? <Cloud size={20} color="var(--green)" /> : <CloudOff size={20} color="var(--text-muted)" />}
                    <h3>Google Drive Backup</h3>
                </div>
                {isConnected && (
                    <button className="icon-btn-small" onClick={handleLogout} title="Logout">
                        <LogOut size={14} />
                    </button>
                )}
            </div>

            <div className="sync-body">
                {isConnected ? (
                    <>
                        <div className="sync-status">
                            <span className="label">Last Sync:</span>
                            <span className="value">{lastSync || 'Never'}</span>
                        </div>
                        <div className="sync-actions">
                            <button className="btn-primary-small" onClick={handleBackup} disabled={isSyncing}>
                                <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
                                {isSyncing ? 'Syncing...' : 'Backup Now'}
                            </button>
                            <button className="btn-ghost-small" onClick={handleRestore} disabled={isSyncing}>
                                Restore
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="sync-connect">
                        <p>Keep your data safe and synced across devices with Google Drive.</p>
                        <button className="btn-google" onClick={handleConnect} disabled={isSyncing}>
                            {isSyncing ? <RefreshCw size={16} className="spin" /> : <Shield size={16} />}
                            CONNECT DRIVE
                        </button>
                    </div>
                )}
                {error && (
                    <div className="sync-error">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <div className="sync-footer">
                <div className="lock-tag">
                    <CheckCircle2 size={12} />
                    <span>Private & Secure</span>
                </div>
            </div>
        </div>
    )
}

export default CloudSync
