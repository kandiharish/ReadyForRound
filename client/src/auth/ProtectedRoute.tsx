import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './AuthProvider'
import { ShellSkeleton } from '../components/Skeleton'

// Only shows the page if someone is logged in; otherwise sends them to /login.
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) return <ShellSkeleton />
  if (!session) return <Navigate to="/login" replace />
  return children
}
