import { useState, useEffect } from 'react'
import './App.css'
import Users from './components/Users'
import AddExpense from './components/AddExpense'
import ExpenseList from './components/ExpenseList'
import Balances from './components/Balances'

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })
  
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('users')
    return saved ? JSON.parse(saved) : []
  })
  
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('expenses')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses))
  }, [expenses])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const addUser = (name) => {
    const newUser = {
      id: `U${Date.now()}`,
      name: name.trim()
    }
    setUsers(prev => [...prev, newUser])
  }

  const addExpense = (expense) => {
    const newExpense = {
      id: `E${Date.now()}`,
      ...expense
    }
    setExpenses(prev => [...prev, newExpense])
  }

  // Calculate balances - who owes whom
  const calculateBalances = () => {
    const balanceMap = {} // { 'debtor': { 'creditor': amount } }

    expenses.forEach(expense => {
      const { paidBy, participants, amount } = expense
      const numParticipants = participants.length
      
      if (numParticipants === 0) return
      
      // Use precise decimal arithmetic (cents)
      const amountInCents = Math.round(amount * 100)
      const sharePerPersonCents = Math.floor(amountInCents / numParticipants)
      
      participants.forEach(participantId => {
        if (participantId !== paidBy) {
          // This participant owes the payer
          if (!balanceMap[participantId]) {
            balanceMap[participantId] = {}
          }
          if (!balanceMap[participantId][paidBy]) {
            balanceMap[participantId][paidBy] = 0
          }
          balanceMap[participantId][paidBy] += sharePerPersonCents
        }
      })
    })

    // Simplify balances (net out mutual debts)
    const simplifiedBalances = []
    const processed = new Set()

    Object.keys(balanceMap).forEach(debtor => {
      Object.keys(balanceMap[debtor]).forEach(creditor => {
        const pairKey = [debtor, creditor].sort().join('-')
        
        if (processed.has(pairKey)) return
        processed.add(pairKey)

        const debtorOwes = balanceMap[debtor]?.[creditor] || 0
        const creditorOwes = balanceMap[creditor]?.[debtor] || 0
        const netAmountCents = debtorOwes - creditorOwes

        if (netAmountCents > 0) {
          simplifiedBalances.push({
            from: debtor,
            to: creditor,
            amount: netAmountCents / 100
          })
        } else if (netAmountCents < 0) {
          simplifiedBalances.push({
            from: creditor,
            to: debtor,
            amount: Math.abs(netAmountCents) / 100
          })
        }
      })
    })

    return simplifiedBalances
  }

  const balances = calculateBalances()

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>💰 Expense Splitter</h1>
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="grid">
          <section className="section users-section">
            <Users users={users} onAddUser={addUser} />
          </section>

          <section className="section expense-section">
            <AddExpense users={users} onAddExpense={addExpense} />
          </section>

          <section className="section list-section">
            <ExpenseList expenses={expenses} users={users} />
          </section>

          <section className="section balance-section">
            <Balances balances={balances} users={users} />
          </section>
        </div>
      </main>

      <footer className="footer">
        <p>Expense Splitter © 2026</p>
      </footer>
    </div>
  )
}

export default App
