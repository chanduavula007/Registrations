import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin]     = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount — restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      api.get('/api/auth/me')
        .then(res => {
          if (res.data.success) setAdmin(res.data.admin)
          else logout()
        })
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    if (res.data.success) {
      const { token, admin } = res.data
      localStorage.setItem('adminToken', token)
      setAdmin(admin)
      return { success: true }
    }
    return { success: false, message: res.data.message }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
