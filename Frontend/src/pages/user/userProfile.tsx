import './user.css'
import '../dashboard/dashboard.css'
import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
  API_BASE_URL,
  authHeaders,
  buildApiFileUrl,
  storage,
  type SessionUser,
} from '../../lib'

type UserProfileProps = {
  user: SessionUser | null
  onOpenPortfolio?: () => void
  onOpenRoute?: () => void
  onUserChange?: (user: SessionUser) => void
}

function UserProfile({
  user,
  onOpenPortfolio,
  onOpenRoute,
  onUserChange,
}: UserProfileProps) {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(user)
  const [username, setUsername] = useState(user?.username || '')
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState(user?.username || '')

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    buildApiFileUrl(user?.ruta_foto_perfil),
  )

  const usernameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const syncSessionUser = (nextUser: SessionUser) => {
    setSessionUser(nextUser)
    setUsername(nextUser.username || '')
    setUsernameInput(nextUser.username || '')

    const token = storage.getToken()
    if (token) {
      storage.setSession({
        token,
        refreshToken: storage.getRefreshToken() || undefined,
        user: nextUser,
      })
    } else {
      storage.saveUser(nextUser)
    }

    onUserChange?.(nextUser)
  }

  useEffect(() => {
    setSessionUser(user)
    setUsername(user?.username || '')
    setUsernameInput(user?.username || '')
    setAvatarPreview(buildApiFileUrl(user?.ruta_foto_perfil))
  }, [user])

  useEffect(() => {
    if (isEditingUsername && usernameInputRef.current) {
      usernameInputRef.current.focus()
      usernameInputRef.current.select()
    }
  }, [isEditingUsername])

  const clearPasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim()

    if (!trimmed) {
      setUsernameInput(username)
      setIsEditingUsername(false)
      return
    }

    if (trimmed === username) {
      setIsEditingUsername(false)
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const { data } = await axios.patch<SessionUser>(
        `${API_BASE_URL}/users/me/username/`,
        { username: trimmed },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      syncSessionUser(data)
      setMessage('Username actualizado correctamente.')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail =
          err.response?.data?.username?.[0] ||
          err.response?.data?.detail ||
          'No se pudo actualizar el username.'
        setError(detail)
      } else {
        setError('No se pudo actualizar el username.')
      }

      setUsernameInput(username)
    } finally {
      setSaving(false)
      setIsEditingUsername(false)
    }
  }

  const handleUsernameKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter') {
      await handleSaveUsername()
    } else if (e.key === 'Escape') {
      setUsernameInput(username)
      setIsEditingUsername(false)
    }
  }

  const handlePickPhoto = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Debes seleccionar una imagen válida.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('photo', file)

      const { data } = await axios.patch<SessionUser>(
        `${API_BASE_URL}/users/me/photo/`,
        formData,
        {
          headers: {
            ...authHeaders(),
          },
        },
      )

      syncSessionUser(data)
      setAvatarPreview(buildApiFileUrl(data.ruta_foto_perfil))
      setMessage('Foto de perfil actualizada correctamente.')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            'No se pudo actualizar la foto de perfil.',
        )
      } else {
        setError('No se pudo actualizar la foto de perfil.')
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!currentPassword.trim()) {
      setError('Debes ingresar tu contraseña actual.')
      return
    }

    if (!newPassword.trim()) {
      setError('Debes ingresar la nueva contraseña.')
      return
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }

    setSaving(true)

    try {
      await axios.patch(
        `${API_BASE_URL}/users/me/password/`,
        {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      clearPasswordForm()
      setShowPasswordForm(false)
      setMessage('Contraseña actualizada correctamente.')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            'No se pudo actualizar la contraseña.',
        )
      } else {
        setError('No se pudo actualizar la contraseña.')
      }
    } finally {
      setSaving(false)
    }
  }

  const displayName =
    sessionUser?.full_name ||
    `${sessionUser?.first_name ?? ''} ${sessionUser?.last_name ?? ''}`.trim() ||
    'Usuario'

  const displayRole = sessionUser?.role || 'Sin rol'

  return (
    <div className="w-100 h-100 d-flex align-items-center justify-content-center user-profile-container">
      <div className="d-flex align-items-center gap-5 flex-wrap justify-content-center">
        <div className="d-flex flex-column align-items-center">
          <div className="profile-avatar-wrapper mb-4">
            <div className="profile-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Foto de perfil" />
              ) : (
                <svg
                  width="60"
                  height="60"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>

            <button
              type="button"
              className="profile-avatar-edit"
              onClick={handlePickPhoto}
              disabled={saving}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="d-none"
              onChange={(event) => {
                void handlePhotoChange(event)
              }}
            />
          </div>

          <h5 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
            {username}
          </h5>

          {isEditingUsername ? (
            <input
              ref={usernameInputRef}
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onBlur={() => {
                void handleSaveUsername()
              }}
              onKeyDown={(e) => {
                void handleUsernameKeyDown(e)
              }}
              className="profile-username-input"
              maxLength={30}
              disabled={saving}
            />
          ) : (
            <span
              className="profile-username-display"
              onClick={() => {
                setUsernameInput(username)
                setIsEditingUsername(true)
              }}
              title="Clic para editar"
            >
              @{username}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ marginLeft: '6px', opacity: 0.4 }}
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </span>
          )}

          {(message || error) && (
            <div className="mt-3 text-center">
              {message ? <div className="text-success small">{message}</div> : null}
              {error ? <div className="text-warning small">{error}</div> : null}
            </div>
          )}
        </div>

        <div className="d-flex flex-column align-items-center">
          <h3 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
            {displayName}
          </h3>
          <span className="profile-role-badge mb-4">{displayRole}</span>

          <div className="profile-actions-card">
            <button
              type="button"
              className="profile-btn-gold"
              onClick={onOpenPortfolio}
            >
              CARTERA
            </button>

            <button
              type="button"
              className="profile-btn-dark"
              onClick={onOpenRoute}
            >
              RUTA DE COBRO
            </button>

            <button
              type="button"
              className="profile-btn-dark"
              onClick={() => {
                setShowPasswordForm((prev) => !prev)
                setError('')
                setMessage('')
              }}
            >
              CAMBIAR CONTRASEÑA
            </button>
          </div>

          {showPasswordForm && (
            <form
              onSubmit={handleChangePassword}
              className="profile-actions-card mt-4"
              style={{ width: '320px' }}
            >
              <div className="mb-3 w-100">
                <label className="form-label text-white-50 small">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  className="profile-username-input w-100"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="mb-3 w-100">
                <label className="form-label text-white-50 small">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  className="profile-username-input w-100"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="mb-3 w-100">
                <label className="form-label text-white-50 small">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  className="profile-username-input w-100"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={saving}
                />
              </div>

              <button
                type="submit"
                className="profile-btn-gold"
                disabled={saving}
              >
                {saving ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}
              </button>

              <button
                type="button"
                className="profile-btn-dark"
                disabled={saving}
                onClick={() => {
                  clearPasswordForm()
                  setShowPasswordForm(false)
                }}
              >
                CANCELAR
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile