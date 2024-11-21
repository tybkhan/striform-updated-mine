import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, AuthContextType } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state
    const initAuth = () => {
      // For development, set default authenticated state
      const devUser = {
        id: 'dev-user',
        name: 'Development User',
        email: 'dev@example.com',
        isPro: true
      }
      const devToken = 'dev-token'

      setUser(devUser)
      setToken(devToken)
      setIsAuthenticated(true)
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const mockUser = {
      id: 'dev-user',
      name: email.split('@')[0],
      email,
      isPro: true
    }
    const mockToken = 'dev-token'

    setUser(mockUser)
    setToken(mockToken)
    setIsAuthenticated(true)

    return Promise.resolve({ token: mockToken, user: mockUser })
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}