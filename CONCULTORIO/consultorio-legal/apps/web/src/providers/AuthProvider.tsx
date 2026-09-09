'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authAPI } from '@/lib/api'
import { getToken, removeToken, setToken, getCurrentUser, setCurrentUser, type AuthUser } from '@/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (data: RegisterData) => Promise<void>
}

interface RegisterData {
  nombre: string
  email: string
  password: string
  telefono: string
  cedula: string
  tipo: 'ciudadano' | 'abogado'
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      const currentUser = getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      } else {
        authAPI.me()
          .then((res) => {
            setUser(res.data)
            setCurrentUser(res.data)
          })
          .catch(() => removeToken())
          .finally(() => setIsLoading(false))
        return
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authAPI.login({ email, password })
    const { token, user: userData } = res.data
    setToken(token)
    setCurrentUser(userData)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
    window.location.href = '/login'
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    const res = await authAPI.register(data)
    const { token, user: userData } = res.data
    setToken(token)
    setCurrentUser(userData)
    setUser(userData)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
