import { useState } from 'react'

function Users({ users, onAddUser }) {
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      onAddUser(name)
      setName('')
    }
  }

  return (
    <div className="users">
      <h2>👥 Users</h2>
      
      <form onSubmit={handleSubmit} className="user-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter user name"
          className="input"
        />
        <button type="submit" className="btn btn-primary">
          Add User
        </button>
      </form>

      {users.length === 0 ? (
        <p className="empty-message">No users yet. Add some users to get started!</p>
      ) : (
        <ul className="user-list">
          {users.map(user => (
            <li key={user.id} className="user-item">
              <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-id">{user.id}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Users
