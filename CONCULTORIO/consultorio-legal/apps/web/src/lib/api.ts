import axios from 'axios'
import { getToken, removeToken } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor: agrega JWT
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: maneja 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// API endpoints
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: Record<string, unknown>) =>
    api.post('/auth/registro', data),
  me: () => api.get('/auth/me'),
}

export const consultaAPI = {
  clasificar: (descripcion: string) =>
    api.post('/consultas/clasificar', { descripcion }),
  crear: (data: Record<string, unknown>) =>
    api.post('/consultas', data),
  listar: (params?: Record<string, unknown>) =>
    api.get('/consultas', { params }),
  obtener: (id: string) =>
    api.get(`/consultas/${id}`),
}

export const documentoAPI = {
  listar: () => api.get('/documentos'),
  obtener: (id: string) => api.get(`/documentos/${id}`),
  descargar: (id: string) => api.get(`/documentos/${id}/descargar`, { responseType: 'blob' }),
}

export const pagoAPI = {
  crear: (data: Record<string, unknown>) => api.post('/pagos', data),
  estado: (id: string) => api.get(`/pagos/${id}/estado`),
}
