import React from 'react'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { FileText, Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Transaction {
    id?: number
    date: string
    description: string
    amount: number
    type: string
    category: string
    bank_source?: string
}

interface ReportGeneratorProps {
    transactions: Transaction[]
    onClose: () => void
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ transactions, onClose }) => {
    const exportToCSV = () => {
        const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Source']
        const csvContent = [
            headers.join(','),
            ...transactions.map(t => [
                t.date,
                `"${t.description.replace(/"/g, '""')}"`,
                t.amount,
                t.type,
                t.category,
                t.bank_source || 'Bank'
            ].join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `FinancePro_Report_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const exportToPDF = () => {
        const doc = new jsPDF()

        // Header
        doc.setFillColor(30, 41, 59)
        doc.rect(0, 0, 210, 40, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.text('FINANCEPRO - STATEMENT', 15, 25)

        doc.setFontSize(10)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 33)
        doc.text(`Total Transactions: ${transactions.length}`, 160, 33)

        // Summary Section
        const income = transactions.filter(t => t.type === 'Credit').reduce((acc, t) => acc + t.amount, 0)
        const expense = transactions.filter(t => t.type === 'Debit').reduce((acc, t) => acc + t.amount, 0)
        const balance = income - expense

        doc.setTextColor(30, 41, 59)
        doc.setFontSize(14)
        doc.text('Summary', 15, 55)

        doc.setFontSize(10)
        doc.text(`Total Income: Rs. ${income.toLocaleString()}`, 15, 65)
        doc.text(`Total Expenses: Rs. ${expense.toLocaleString()}`, 15, 72)
        doc.text(`Net Balance: Rs. ${balance.toLocaleString()}`, 15, 79)

        // Category Breakdown
        doc.setFontSize(14)
        doc.text('Spending by Category', 120, 55)

        const categories: Record<string, number> = {}
        transactions.filter(t => t.type === 'Debit').forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount
        })

        let yPos = 65
        Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([cat, amt]) => {
            doc.setFontSize(9)
            doc.text(`${cat}: Rs. ${amt.toLocaleString()}`, 120, yPos)
            yPos += 7
        })

        // Table
        const tableData = transactions.map(t => [
            t.date,
            t.description,
            t.category,
            t.type,
            `Rs. ${t.amount.toLocaleString()}`
        ])

            ; (doc as any).autoTable({
                startY: 100,
                head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
                body: tableData,
                headStyles: { fillColor: [79, 124, 255] },
                alternateRowStyles: { fillColor: [245, 247, 255] },
                margin: { top: 100 }
            })

        doc.save(`FinancePro_Statement_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="glass modal-content report-modal"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
            >
                <div className="modal-header">
                    <div className="title-with-icon">
                        <FileText size={20} color="var(--blue)" />
                        <h2>Generate Professional Report</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="report-options">
                    <div className="report-card" onClick={exportToPDF}>
                        <div className="report-icon pdf">
                            <FileText size={32} />
                        </div>
                        <div className="report-details">
                            <h3>PDF Statement</h3>
                            <p>Professional document with summaries, category charts, and organized table.</p>
                            <button className="btn-primary"><Download size={16} /> DOWNLOAD PDF</button>
                        </div>
                    </div>

                    <div className="report-card" onClick={exportToCSV}>
                        <div className="report-icon csv">
                            <Download size={32} />
                        </div>
                        <div className="report-details">
                            <h3>CSV Data Export</h3>
                            <p>Raw transaction data compatible with Excel, Google Sheets, and other tools.</p>
                            <button className="btn-ghost"><Download size={16} /> DOWNLOAD CSV</button>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <p className="hint">Your report will include all {transactions.length} filtered transactions.</p>
                </div>
            </motion.div>
        </motion.div>
    )
}

export default ReportGenerator
