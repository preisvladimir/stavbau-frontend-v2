import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/api/v1',
  withCredentials: true, // kvůli refresh cookie
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    // TODO: doplnit logiku refresh flow (401 -> /auth/refresh -> retry)
    return Promise.reject(error)
  }
)
