import Papa from 'papaparse'

export interface ParsedTransaction {
    date: string
    description: string
    amount: number
    type: 'Credit' | 'Debit'
    bank_source: string
}

export const parseBankCSV = (fileContent: string, bankType: string): Promise<ParsedTransaction[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data as any[]
                const parsed: ParsedTransaction[] = []

                data.forEach(row => {
                    let date = '', desc = '', amt = 0, type: 'Credit' | 'Debit' = 'Debit'

                    if (bankType === 'HDFC') {
                        // HDFC Headers: Date, Narration, Chq./Ref.No., Value Dt, Withdrawal Amt., Deposit Amt., Closing Balance
                        date = row['Date'] || row['Value Dt']
                        desc = row['Narration']
                        const withdrawal = parseFloat(row['Withdrawal Amt.']) || 0
                        const deposit = parseFloat(row['Deposit Amt.']) || 0
                        amt = withdrawal > 0 ? withdrawal : deposit
                        type = withdrawal > 0 ? 'Debit' : 'Credit'
                    } else if (bankType === 'SBI') {
                        // SBI Headers: Date, Description, Ref No., Debit, Credit, Balance
                        date = row['Date']
                        desc = row['Description']
                        const debit = parseFloat(row['Debit']) || 0
                        const credit = parseFloat(row['Credit']) || 0
                        amt = debit > 0 ? debit : credit
                        type = debit > 0 ? 'Debit' : 'Credit'
                    } else if (bankType === 'BOB') {
                        // BOB Headers: Transaction Date, Description, Withdrawal, Deposit, Balance
                        date = row['Transaction Date']
                        desc = row['Description']
                        const withdrawal = parseFloat(row['Withdrawal']) || 0
                        const deposit = parseFloat(row['Deposit']) || 0
                        amt = withdrawal > 0 ? withdrawal : deposit
                        type = withdrawal > 0 ? 'Debit' : 'Credit'
                    }

                    if (date && desc && amt > 0) {
                        parsed.push({
                            date: formatDate(date),
                            description: desc,
                            amount: amt,
                            type,
                            bank_source: bankType
                        })
                    }
                })
                resolve(parsed)
            },
            error: (err) => reject(err)
        })
    })
}

const formatDate = (dateStr: string) => {
    // Simple format normalizer for DD/MM/YYYY or YYYY-MM-DD
    const parts = dateStr.split(/[/-]/)
    if (parts[0].length === 4) return dateStr // Already YYYY-MM-DD
    return `${parts[2]}-${parts[1]}-${parts[0]}` // DD-MM-YYYY to YYYY-MM-DD
}
