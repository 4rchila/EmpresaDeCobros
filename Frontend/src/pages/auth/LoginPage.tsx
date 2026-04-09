import './login.css'
import logo from '../../assets/logoFinal.png'
import finance from '../../assets/imagenFinance.png'
import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { API_BASE_URL, storage, type LoginResponse } from '../../lib'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Ingresa tu correo y contraseña.')
      return
    }

    setLoading(true)

    try {
      const res = await axios.post<LoginResponse>(`${API_BASE_URL}/users/login/`, {
        email: email.trim().toLowerCase(),
        password,
      })

      storage.saveSession(res.data)
      navigate('/PrendaSol', { replace: true })
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string }>
      setError(
        axiosError.response?.data?.detail ||
          'Credenciales incorrectas o servidor no disponible.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex flex-column flex-md-row">
      <div
        className="d-flex flex-column align-items-center justify-content-center flex-fill py-4 px-3"
        style={{ background: '#F2EDE4' }}
      >
        <div className="text-center mb-4">
          <img src={logo} alt="logoMomentaneo" className="logo-img" />
          <h2
            style={{
              letterSpacing: '3px',
              color: '#1a2332',
              fontWeight: 700,
              fontFamily: 'Segoe UI',
            }}
          >
            PRENDA SOL
          </h2>
          <div
            style={{
              letterSpacing: '2px',
              color: '#1a2332',
              fontSize: '13px',
              fontFamily: 'Segoe UI',
            }}
          >
            S. A
          </div>
          <div
            style={{
              letterSpacing: '3px',
              color: '#C9A84C',
              fontSize: '11px',
            }}
          >
            FINANCE
          </div>
        </div>

        <img src={finance} alt="imagenContenedor" className="finance-img" />
      </div>

      <div
        className="d-flex flex-column align-items-center justify-content-center flex-fill right-panel px-3 py-4"
        style={{ background: '#1a2332' }}
      >
        <div className="p-4 login-card shadow-lg">
          <h3 className="text-white text-center mb-4">Iniciar sesión</h3>

          <div style={{ width: '100%', maxWidth: '300px', marginBottom: '1.5rem' }}>
            <p style={{ color: '#fff' }}>Correo electrónico</p>
            <div
              className="d-flex align-items-center"
              style={{
                background: '#f5f5f5',
                borderRadius: '50px',
                padding: '6px 16px 6px 6px',
                gap: '12px',
              }}
            >
              <input
                className="input-custom"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                autoComplete="username"
                placeholder="Ingresa tu correo"
                type="email"
              />
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: '300px', marginBottom: '1rem' }}>
            <p style={{ color: '#fff' }}>Contraseña</p>
            <div
              className="d-flex align-items-center"
              style={{
                background: '#f5f5f5',
                borderRadius: '50px',
                padding: '6px 6px 6px 16px',
                gap: '12px',
              }}
            >
              <input
                type="password"
                className="input-custom"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
              />
            </div>
          </div>

          <div
            style={{
              width: '100%',
              maxWidth: '300px',
              minHeight: '24px',
              marginBottom: '1rem',
            }}
          >
            {error && <small className="text-warning">{error}</small>}
          </div>

          <div style={{ width: '100%', maxWidth: '300px' }}>
            <button
              className="btn-dora-login w-100"
              onClick={handleLogin}
              disabled={loading}
              type="button"
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </div>

          <div className="text-white-50 text-center mt-4" style={{ fontSize: '0.9rem' }}>
            Inicia sesión con tu correo registrado en el sistema
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage