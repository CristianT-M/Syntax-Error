import React, { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleTheme() {
    const nextDark = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', nextDark)
    localStorage.setItem('itecify-theme', nextDark ? 'dark' : 'light')
    setDark(nextDark)
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggleTheme}
      className={`border-border bg-card/80 backdrop-blur-sm hover:bg-muted ${className}`}
      aria-label="Toggle theme"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="ml-2 hidden sm:inline">
        {dark ? 'Light mode' : 'Dark mode'}
      </span>
    </Button>
  )
}
