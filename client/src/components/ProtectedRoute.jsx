import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '18px'
      }}>
        ⏳ Loading...
      </div>
    )
  }

  return admin ? children : <Navigate to="/login" replace />
}
