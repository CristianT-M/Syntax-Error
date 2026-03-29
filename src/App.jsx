import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground">
        <div className="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground">
          Loading...
        </div>
      </div>
    )
  }

  return user ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/auth"
        element={
          <GuestRoute>
            <Auth />
          </GuestRoute>
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
      <Route
        path="/quick-create"
        element={
          <ProtectedRoute>
            <QuickCreateEditor />
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <Router>
            <AppRoutes />
            <Toaster richColors position="top-right" />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}