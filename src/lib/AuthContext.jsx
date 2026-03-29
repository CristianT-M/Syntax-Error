import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

/**
 * @typedef {{
 *   user: any | null
 *   signUp: (email: string, password: string) => Promise<any>
 *   signIn: (email: string, password: string) => Promise<any>
 *   logout: () => Promise<void>
 * }} AuthContextType
 */

const AuthContext = createContext(/** @type {AuthContextType | null} */ (null))

export function AuthProvider(/** @type {{ children: React.ReactNode }} */ { children }) {
  /** @type {[any | null, Function]} */
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signUp = async (/** @type {string} */ email, /** @type {string} */ password) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`
      }
    })
  }

  const signIn = async (/** @type {string} */ email, /** @type {string} */ password) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)