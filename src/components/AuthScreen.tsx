import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ShieldCheck, ShieldAlert, Delete, ArrowRight } from 'lucide-react'

interface AuthScreenProps {
    onUnlock: () => void
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onUnlock }) => {
    const [pin, setPin] = useState('')
    const [error, setError] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleNumberClick = (num: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + num)
            setError(false)
        }
    }

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1))
        setError(false)
    }

    const handleSubmit = async () => {
        if (pin.length < 4) return

        setLoading(true)
        const isValid = await window.electron.verifyPin(pin)

        if (isValid) {
            onUnlock()
        } else {
            setError(true)
            setPin('')
            // Add a small delay for the vibration effect
            setTimeout(() => setError(false), 500)
        }
        setLoading(false)
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') {
                handleNumberClick(e.key)
            } else if (e.key === 'Backspace') {
                handleDelete()
            } else if (e.key === 'Enter') {
                handleSubmit()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [pin])

    // Auto-submit if pin length is 6? Let's stick to explicit Enter or 4-6 digits
    useEffect(() => {
        if (pin.length === 6) {
            handleSubmit()
        }
    }, [pin])

    return (
        <div className="auth-overlay">
            <motion.div
                className={`auth-container ${error ? 'shake' : ''}`}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
            >
                <div className="auth-header">
                    <motion.div
                        className="auth-icon-wrapper"
                        animate={error ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
                    >
                        {error ? <ShieldAlert size={48} color="#ff4757" /> : <Lock size={48} color="var(--blue)" />}
                    </motion.div>
                    <h1>Security Lock</h1>
                    <p>{error ? 'Incorrect PIN, please try again' : 'Enter your security PIN to access FinancePro'}</p>
                </div>

                <div className="pin-display">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={`pin-dot ${pin.length > i ? 'active' : ''} ${error ? 'error' : ''}`} />
                    ))}
                </div>

                <div className="keypad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'back', 0, 'enter'].map((key, i) => {
                        if (key === 'back') {
                            return (
                                <button key={i} className="key-btn special" onClick={handleDelete}>
                                    <Delete size={20} />
                                </button>
                            )
                        }
                        if (key === 'enter') {
                            return (
                                <button key={i} className="key-btn special enter" onClick={handleSubmit} disabled={pin.length < 4}>
                                    <ArrowRight size={20} />
                                </button>
                            )
                        }
                        return (
                            <button key={i} className="key-btn" onClick={() => handleNumberClick(key.toString())}>
                                {key}
                            </button>
                        )
                    })}
                </div>

                <div className="auth-footer">
                    <ShieldCheck size={14} />
                    <span>Protected by end-to-end local encryption</span>
                </div>
            </motion.div>
        </div>
    )
}

export default AuthScreen
