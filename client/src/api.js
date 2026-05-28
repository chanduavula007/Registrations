import axios from 'axios'

// When deployed on Netlify: VITE_API_URL = https://your-render-backend.onrender.com
// When deployed on Render (single server): VITE_API_URL is empty, uses same origin
// In local dev: Vite proxy handles /api → localhost:5000
const baseURL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL,
  timeout: 30000, // 30s timeout (handles Render free tier cold start)
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
