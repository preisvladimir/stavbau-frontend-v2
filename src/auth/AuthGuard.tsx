import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth()
  if (state.loading) return null // TODO: loader
  if (!state.user) return <Navigate to="/login" replace />
  return <>{children}</>
}
