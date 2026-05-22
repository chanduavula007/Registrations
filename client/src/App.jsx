import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RegistrationForm from './components/RegistrationForm'
import AdminDashboard from './pages/AdminDashboard'
import LoginPage from './pages/LoginPage'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public — Student Registration */}
          <Route path="/" element={<RegistrationForm />} />

          {/* Public — Admin Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
