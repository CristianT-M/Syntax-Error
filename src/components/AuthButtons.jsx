// @ts-nocheck
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, LogOut, UserPlus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '../lib/AuthContext'

export default function AuthButtons() {
  const authContext = /** @type {any} */(useAuth())
  const { user, logout } = authContext
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/auth')
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
          <User className="w-3.5 h-3.5" />
          <span className="max-w-[180px] truncate">{user.email}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={handleLogout}
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link to="/auth">
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
          <LogIn className="w-3.5 h-3.5" />
          Log in
        </Button>
      </Link>

      <Link to="/auth?mode=signup">
        <Button size="sm" className="h-8 text-xs gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          Sign up
        </Button>
      </Link>
    </div>
  )
}