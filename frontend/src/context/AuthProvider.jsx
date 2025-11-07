import React, { createContext, useEffect, useMemo, useState } from 'react'
import { auth } from '../lib/firebase'

export const AuthContext = createContext(null)

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [idToken, setIdToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = auth.onIdTokenChanged(async (u) => {
      try {
        setUser(u)
        if (u) {
          const token = await u.getIdToken()
          setIdToken(token)
        } else {
          setIdToken(null)
        }
      } catch (err) {
        setError(err.message)
        console.error('Auth error:', err)
      } finally {
        setLoading(false)
      }
    })

    const interval = setInterval(async () => {
      try {
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true)
        }
      } catch (err) {
        console.error('Token refresh error:', err)
      }
    }, 10 * 60 * 1000)

    return () => { 
      unsub()
      clearInterval(interval) 
    }
  }, [])

  const value = useMemo(() => ({ 
    user, 
    idToken, 
    loading,
    error,
    isAuthenticated: !!user 
  }), [user, idToken, loading, error])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-custom">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 rounded-lg bg-white shadow-xl">
          <div className="text-red-500 text-xl mb-4">Authentication Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}