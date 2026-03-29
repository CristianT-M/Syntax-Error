import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import { Toaster } from '@/components/ui/toaster'

import Landing from '@/pages/Landing'
import Editor from '@/pages/Editor'
import Dashboard from '@/pages/Dashboard'
import Auth from '@/pages/Auth'
import PageNotFound from '@/lib/PageNotFound'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return user ? children : <Navigate to="/auth" replace />
}
<Route
  path="/editor/:slug"
  element={
    <ProtectedRoute>
      <Editor />
    </ProtectedRoute>
  }
/>
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor/:slug"
        element={
          <ProtectedRoute>
            <Editor />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}