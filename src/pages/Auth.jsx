// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Code2, ArrowLeft, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '../lib/AuthContext'

export default function Auth() {
  const authContext = /** @type {any} */(useAuth())
  const { signIn, signUp, user } = authContext
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'signup')
  }, [searchParams])

  const handleSubmit = async (/** @type {React.FormEvent<HTMLFormElement>} */ e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)

        if (error) {
          setMessage(error.message)
          return
        }

        navigate('/dashboard')
      } else {
        const { error } = await signUp(email, password)

        if (error) {
          setMessage(error.message)
          return
        }

        setMessage('Cont creat. Verifică emailul și apasă linkul de confirmare.')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'A apărut o eroare.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Code2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-bold text-sm">iTECify</span>
            </div>
          </div>

          <Badge variant="outline" className="text-[10px] border-border">
            {isLogin ? 'Log in' : 'Sign up'}
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-5"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
              <Code2 className="w-3.5 h-3.5 text-primary" />
              Real accounts for your collaborative editor
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">
                {isLogin ? 'Welcome back.' : 'Create your account.'}
              </h1>
              <p className="text-muted-foreground max-w-lg">
                Intră în platformă, creează proiecte reale și păstrează totul salvat
                în baza de date pentru fiecare utilizator.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Card className="bg-card/60 border-border">
                <CardContent className="p-4">
                  <p className="text-sm font-medium">Real login</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Email + password cu sesiuni persistente
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-border">
                <CardContent className="p-4">
                  <p className="text-sm font-medium">Projects saved</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fiecare utilizator își vede proiectele lui
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-border">
                <CardContent className="p-4">
                  <p className="text-sm font-medium">Ready for demo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Design consistent cu restul aplicației
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <Card className="bg-card/70 border-border shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">
                  {isLogin ? 'Log in' : 'Sign up'}
                </CardTitle>
                <CardDescription>
                  {isLogin
                    ? 'Autentifică-te pentru a accesa dashboard-ul și editorul.'
                    : 'Creează un cont nou pentru a salva proiecte reale.'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nume@email.com"
                      value={email}
                      onChange={(/** @type {React.ChangeEvent<HTMLInputElement>} */ e) => setEmail(e.target.value)}
                      className="bg-secondary/40"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Parolă</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(/** @type {React.ChangeEvent<HTMLInputElement>} */ e) => setPassword(e.target.value)}
                      className="bg-secondary/40"
                      required
                    />
                  </div>

                  {message && (
                    <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                      {message}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={loading}
                  >
                    {isLogin ? (
                      <>
                        <LogIn className="w-4 h-4" />
                        {loading ? 'Se conectează...' : 'Log in'}
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        {loading ? 'Se creează...' : 'Sign up'}
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsLogin(!isLogin)
                      setMessage('')
                    }}
                  >
                    {isLogin
                      ? 'Nu ai cont? Treci la Sign up'
                      : 'Ai deja cont? Treci la Log in'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}