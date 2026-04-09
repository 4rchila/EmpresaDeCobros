import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ensureSessionUser, storage } from './lib'

export function ProtectedRoute() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthorized'>('loading')

  useEffect(() => {
    let isMounted = true

    const boot = async () => {
      if (!storage.getToken()) {
        if (isMounted) setStatus('unauthorized')
        return
      }

      const user = await ensureSessionUser()
      if (!isMounted) return
      setStatus(user ? 'ready' : 'unauthorized')
    }

    void boot()

    return () => {
      isMounted = false
    }
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: '#1a2332' }}>
        <div className="text-center text-white">
          <div className="spinner-border text-warning mb-3" role="status" />
          <div>Validando sesión...</div>
        </div>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
