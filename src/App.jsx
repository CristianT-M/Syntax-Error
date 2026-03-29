import { useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import PageNotFound from './lib/PageNotFound'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Landing from './pages/Landing'
import Editor from './pages/Editor'
import Dashboard from './pages/Dashboard'
import Auth from './pages/Auth'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/auth" replace />
}

function ThemeBoot() {
  useEffect(() => {
    const saved = localStorage.getItem('itecify-theme')

    if (saved === 'light') {
      document.documentElement.classList.remove('dark')
      return
    }

    if (saved === 'dark') {
      document.documentElement.classList.add('dark')
      return
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', prefersDark)
  }, [])

  return null
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/editor/:projectId"
        element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ThemeBoot />
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
