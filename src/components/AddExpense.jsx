import { useState } from 'react'

function AddExpense({ users, onAddExpense }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [participants, setParticipants] = useState([])

  const handleParticipantToggle = (userId) => {
    setParticipants(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      }
      return [...prev, userId]
    })
  }

  const selectAllParticipants = () => {
    setParticipants(users.map(u => u.id))
  }

  const clearParticipants = () => {
    setParticipants([])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!description.trim() || !amount || !paidBy || participants.length === 0) {
      alert('Please fill all fields and select at least one participant')
      return
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    onAddExpense({
      description: description.trim(),
      amount: parsedAmount,
      paidBy,
      participants
    })

    // Reset form
    setDescription('')
    setAmount('')
    setPaidBy('')
    setParticipants([])
  }

  return (
    <div className="add-expense">
      <h2>➕ Add Expense</h2>
      
      {users.length < 2 ? (
        <p className="empty-message">Add at least 2 users to create an expense.</p>
      ) : (
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Dinner, Movie tickets"
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="paidBy">Paid By</label>
            <select
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="select"
            >
              <option value="">Select who paid</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Participants (Split Among)</label>
            <div className="participant-actions">
              <button type="button" onClick={selectAllParticipants} className="btn btn-small">
                Select All
              </button>
              <button type="button" onClick={clearParticipants} className="btn btn-small btn-secondary">
                Clear
              </button>
            </div>
            <div className="participants-grid">
              {users.map(user => (
                <label key={user.id} className="participant-checkbox">
                  <input
                    type="checkbox"
                    checked={participants.includes(user.id)}
                    onChange={() => handleParticipantToggle(user.id)}
                  />
                  <span className="checkmark"></span>
                  <span>{user.name}</span>
                </label>
              ))}
            </div>
          </div>

          {participants.length > 0 && amount && (
            <div className="split-preview">
              <p>
                Split: <strong>₹{(parseFloat(amount) / participants.length).toFixed(2)}</strong> per person
                ({participants.length} participant{participants.length > 1 ? 's' : ''})
              </p>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-full">
            Add Expense
          </button>
        </form>
      )}
    </div>
  )
}

export default AddExpense
