'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile, UserRole } from '@/types/api'
import { authService } from '@/lib/services'
import { apiClient } from '@/lib/api-client'
import { DEMO_DOCTOR_USER, DEMO_PATIENT_USER } from '@/lib/mock-seed'

interface AuthContextType {
  user: UserProfile | null
  role: UserRole | null
  isLoading: boolean
  login: (email: string, password?: string, roleHint?: UserRole) => Promise<boolean>
  loginAsDemo: (demoRole: 'DOCTOR' | 'PATIENT') => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  login: async () => false,
  loginAsDemo: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const storedRole = localStorage.getItem('early_demo_role')
      if (storedRole === 'PATIENT') {
        setUser(DEMO_PATIENT_USER)
        setRole('PATIENT')
        setIsLoading(false)
        return
      } else if (storedRole === 'DOCTOR') {
        setUser(DEMO_DOCTOR_USER)
        setRole('DOCTOR')
        setIsLoading(false)
        return
      }

      const res = await authService.getMe()
      if (res.success && res.data) {
        setUser(res.data)
        setRole(res.data.role)
      } else {
        setUser(null)
        setRole(null)
      }
    } catch {
      setUser(null)
      setRole(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password = 'password', roleHint?: UserRole): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await authService.login(email, password, roleHint)
      if (res.success && res.data) {
        apiClient.setTokens({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        })
        const activeUser = res.data.user
        setUser(activeUser)
        setRole(activeUser.role)
        localStorage.setItem('early_demo_role', activeUser.role)
        if (activeUser.role === 'PATIENT') {
          router.push('/patient/dashboard')
        } else {
          router.push('/doctor/dashboard')
        }
        return true
      }
    } catch (err) {
      console.error('Login error', err)
    } finally {
      setIsLoading(false)
    }

    // Fallback if backend offline
    const isPatient =
      roleHint === 'PATIENT' ||
      email.toLowerCase().includes('patient') ||
      email.toLowerCase().includes('sharma') ||
      email.toLowerCase().includes('aarav')
    loginAsDemo(isPatient ? 'PATIENT' : 'DOCTOR')
    return true
  }

  const loginAsDemo = (demoRole: 'DOCTOR' | 'PATIENT') => {
    setIsLoading(true)
    const demoUser = demoRole === 'PATIENT' ? DEMO_PATIENT_USER : DEMO_DOCTOR_USER
    setUser(demoUser)
    setRole(demoUser.role)
    localStorage.setItem('early_demo_role', demoUser.role)
    apiClient.setTokens({
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token',
    })
    setIsLoading(false)
    if (demoRole === 'PATIENT') {
      router.push('/patient/dashboard')
    } else {
      router.push('/doctor/dashboard')
    }
  }

  const logout = () => {
    apiClient.setTokens(null)
    localStorage.removeItem('early_demo_role')
    setUser(null)
    setRole(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
