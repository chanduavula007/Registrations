import axios from 'axios'

// In production (Netlify), use the deployed backend URL via env variable.
// In development, Vite proxy handles /api → localhost:5000
const baseURL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL,
})

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
