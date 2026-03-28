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
        path="/editor/:roomId"
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
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App