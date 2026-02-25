function ExpenseList({ expenses, users }) {
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : 'Unknown'
  }

  const getParticipantNames = (participantIds) => {
    return participantIds.map(id => getUserName(id)).join(', ')
  }

  return (
    <div className="expense-list">
      <h2>📋 Expenses</h2>
      
      {expenses.length === 0 ? (
        <p className="empty-message">No expenses yet. Add your first expense!</p>
      ) : (
        <div className="expenses-container">
          {expenses.map(expense => (
            <div key={expense.id} className="expense-card">
              <div className="expense-header">
                <h3 className="expense-description">{expense.description}</h3>
                <span className="expense-amount">₹{expense.amount.toFixed(2)}</span>
              </div>
              <div className="expense-details">
                <div className="expense-detail">
                  <span className="label">Paid by:</span>
                  <span className="value">{getUserName(expense.paidBy)}</span>
                </div>
                <div className="expense-detail">
                  <span className="label">Split among:</span>
                  <span className="value participants">{getParticipantNames(expense.participants)}</span>
                </div>
                <div className="expense-detail">
                  <span className="label">Per person:</span>
                  <span className="value">₹{(expense.amount / expense.participants.length).toFixed(2)}</span>
                </div>
              </div>
              <div className="expense-id">{expense.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExpenseList
