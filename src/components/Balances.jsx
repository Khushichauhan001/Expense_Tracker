function Balances({ balances, users }) {
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : 'Unknown'
  }

  return (
    <div className="balances">
      <h2>⚖️ Balances</h2>
      
      {balances.length === 0 ? (
        <p className="empty-message">No pending balances.</p>
      ) : (
        <div className="balance-list">
          {balances.map((balance, index) => (
            <div key={index} className="balance-item">
              <div className="balance-arrow">
                <span className="from-user">{getUserName(balance.from)}</span>
                <span className="arrow">→</span>
                <span className="to-user">{getUserName(balance.to)}</span>
              </div>
              <span className="balance-amount">₹{balance.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {balances.length > 0 && (
        <div className="balance-summary">
          <h3>Summary</h3>
          <ul>
            {balances.map((balance, index) => (
              <li key={index}>
                <strong>{getUserName(balance.from)}</strong> owes <strong>{getUserName(balance.to)}</strong> ₹{balance.amount.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Balances
