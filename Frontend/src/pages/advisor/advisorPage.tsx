import axios from 'axios'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import '../dashboard/dashboard.css'
import './advisor.css'
import {
  API_BASE_URL,
  authHeaders,
  type SessionUser,
} from '../../lib'

type AdvisorPageProps = {
  user: SessionUser | null
}

type RoleItem = {
  id: number
  nombre_rol: string
  descripcion?: string | null
}

type UserItem = {
  id: number
  username: string
  email: string
  nombres: string
  apellidos: string
  full_name: string
  telefono: string | null
  direccion: string | null
  estado: 'activo' | 'inactivo'
  fecha_creacion: string
  role: string | null
  permissions: string[]
  total_clientes: number
  total_carteras: number
}

type CarteraItem = {
  id: number
  nombre_cartera: string
  fecha_inicio: string | null
  fecha_fin: string | null
  estado: string
  total_clientes: number
}

type AdvisorSearchResponse = {
  asesor: UserItem
  carteras: CarteraItem[]
}

type TransferResponse = {
  asesor_origen: {
    id: number
    username: string
    nombre_completo: string
  }
  asesor_destino: {
    id: number
    username: string
    nombre_completo: string
  }
  carteras_transferidas: Array<{
    id: number
    nombre_cartera: string
  }>
  total_clientes_transferidos: number
  observaciones: string
}

type AdvisorTabKey = 'nuevo' | 'transferencia' | 'asesores'

type TabItem = {
  key: AdvisorTabKey
  label: string
  visible: boolean
}

function getErrorDetail(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string } | undefined

    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail
    }
  }

  return fallback
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

function AdvisorPage({ user }: AdvisorPageProps) {
  const roleLower = user?.role?.trim().toLowerCase() ?? ''

  const isAdminRole =
    roleLower === 'administrador' ||
    roleLower === 'admin' ||
    roleLower === 'gerente'

  const canManageUsers = isAdminRole
  const canTransfer = isAdminRole

  const tabs: TabItem[] = [
    {
      key: 'nuevo',
      label: 'Nuevo Asesor',
      visible: canManageUsers,
    },
    {
      key: 'transferencia',
      label: 'Transferencia de Cartera',
      visible: canTransfer,
    },
    {
      key: 'asesores',
      label: 'Asesores',
      visible: canManageUsers,
    },
  ]

  const visibleTabs = tabs.filter((tab) => tab.visible)
  const [activeTab, setActiveTab] = useState<AdvisorTabKey>(
    visibleTabs[0]?.key ?? 'nuevo',
  )

  const safeActiveTab = visibleTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : visibleTabs[0]?.key ?? 'nuevo'

  const renderView = () => {
    switch (safeActiveTab) {
      case 'nuevo':
        return <VistaNuevoAsesor />
      case 'transferencia':
        return <VistaTransferenciaPortafolio />
      case 'asesores':
        return <VistaListaAsesores />
      default:
        return <VistaNuevoAsesor />
    }
  }

  if (visibleTabs.length === 0) {
    return (
      <div className="w-100 h-100 d-flex flex-column">
        <div className="extruded-form-card p-4 p-lg-5 flex-fill overflow-auto custom-scrollbar">
          <div className="d-flex align-items-center mb-4">
            <div className="form-icon-box me-3">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#cca641"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <h4 className="text-white fw-bold mb-1">Gestión de Asesores</h4>
              <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
                Tu rol no tiene acceso a este módulo.
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-100 h-100 d-flex flex-column">
      <div className="mb-4">
        <div className="d-flex gap-3 tabs-container flex-wrap">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-btn ${safeActiveTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="extruded-form-card p-4 p-lg-5 flex-fill overflow-auto custom-scrollbar">
        {renderView()}
      </div>
    </div>
  )
}

// =====================================================================
// Vista 1: Formulario de Nuevo Asesor
// =====================================================================

function VistaNuevoAsesor() {
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    rol_id: '',
    direccion: '',
    observaciones: '',
  })

  const loadRoles = useCallback(async () => {
    setLoadingRoles(true)
    try {
      const { data } = await axios.get<RoleItem[]>(
        `${API_BASE_URL}/users/roles/`,
        { headers: authHeaders() },
      )
      setRoles(data)
    } catch {
      setRoles([])
    } finally {
      setLoadingRoles(false)
    }
  }, [])

  useEffect(() => {
    void loadRoles()
  }, [loadRoles])

  const onChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setForm({
      nombres: '',
      apellidos: '',
      telefono: '',
      username: '',
      email: '',
      password: '',
      confirm_password: '',
      rol_id: '',
      direccion: '',
      observaciones: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    setSaving(true)

    try {
      await axios.post(
        `${API_BASE_URL}/users/`,
        {
          nombres: form.nombres,
          apellidos: form.apellidos,
          telefono: form.telefono,
          username: form.username,
          email: form.email,
          password: form.password,
          confirm_password: form.confirm_password,
          rol_id: form.rol_id ? Number(form.rol_id) : null,
          direccion: form.direccion,
          observaciones: form.observaciones,
        },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      setMessage('Usuario registrado correctamente.')
      resetForm()
    } catch (error) {
      setError(getErrorDetail(error, 'No se pudo registrar el usuario.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div className="form-icon-box me-3">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#cca641"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <line x1="19" y1="8" x2="19" y2="14"></line>
            <line x1="22" y1="11" x2="16" y2="11"></line>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
            Registro de Nuevo Asesor
          </h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
            Complete los datos del usuario. Los campos marcados con (*) son obligatorios.
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">🧑</span> Datos personales
        </h6>

        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Nombre *</label>
            <div className="inset-input-box">
              <input
                type="text"
                placeholder="Ej. Juan"
                required
                value={form.nombres}
                onChange={(e) => onChange('nombres', e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Apellido *</label>
            <div className="inset-input-box">
              <input
                type="text"
                placeholder="Ej. Pérez"
                required
                value={form.apellidos}
                onChange={(e) => onChange('apellidos', e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Teléfono</label>
            <div className="inset-input-box">
              <input
                type="tel"
                placeholder="Ej. 5555-5555"
                value={form.telefono}
                onChange={(e) => onChange('telefono', e.target.value)}
              />
            </div>
          </div>
        </div>

        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">🔐</span> Acceso al sistema
        </h6>

        <div className="row g-4 mb-5">
          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">Usuario *</label>
            <div className="inset-input-box">
              <input
                type="text"
                placeholder="Ej. juanperez"
                required
                value={form.username}
                onChange={(e) => onChange('username', e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">Email *</label>
            <div className="inset-input-box">
              <input
                type="email"
                placeholder="Ej. juan@empresa.com"
                required
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">Contraseña *</label>
            <div className="inset-input-box">
              <input
                type="password"
                placeholder="Ej. *********"
                required
                value={form.password}
                onChange={(e) => onChange('password', e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              Confirmar contraseña *
            </label>
            <div className="inset-input-box">
              <input
                type="password"
                placeholder="Ej. *********"
                required
                value={form.confirm_password}
                onChange={(e) => onChange('confirm_password', e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">Rol Asignado *</label>
            <div className="inset-input-box pe-2">
              <select
                className="w-100 bg-transparent border-0 outline-none select-custom"
                required
                value={form.rol_id}
                onChange={(e) => onChange('rol_id', e.target.value)}
              >
                <option value="">
                  {loadingRoles ? 'Cargando roles...' : 'Seleccione...'}
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.nombre_rol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">Dirección</label>
            <div className="inset-input-box">
              <input
                type="text"
                placeholder="Ej. Quetzaltenango"
                value={form.direccion}
                onChange={(e) => onChange('direccion', e.target.value)}
              />
            </div>
          </div>

          <div className="col-12">
            <label className="form-label text-white-50 small mb-2">Observaciones</label>
            <div className="inset-input-box">
              <input
                type="text"
                placeholder="Asignación de zona, detalles adicionales..."
                value={form.observaciones}
                onChange={(e) => onChange('observaciones', e.target.value)}
              />
            </div>
          </div>
        </div>

        {(error || message) && (
          <div className="mb-4">
            {error ? <div className="text-warning small">{error}</div> : null}
            {message ? <div className="text-success small">{message}</div> : null}
          </div>
        )}

        <div className="d-flex justify-content-end mt-5 pt-4 form-header-border">
          <button
            type="submit"
            className="btn-gold-action px-5 py-3 d-flex align-items-center gap-2"
            style={{ fontSize: '14px', borderRadius: '12px' }}
            disabled={saving}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            {saving ? 'REGISTRANDO...' : 'REGISTRAR ASESOR'}
          </button>
        </div>
      </form>
    </>
  )
}

// =====================================================================
// Vista 2: Transferencia de Portafolio
// =====================================================================

function VistaTransferenciaPortafolio() {
  const [originQuery, setOriginQuery] = useState('')
  const [destinationQuery, setDestinationQuery] = useState('')
  const [originResults, setOriginResults] = useState<UserItem[]>([])
  const [destinationResults, setDestinationResults] = useState<UserItem[]>([])
  const [selectedOrigin, setSelectedOrigin] = useState<UserItem | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<UserItem | null>(
    null,
  )
  const [carteras, setCarteras] = useState<CarteraItem[]>([])
  const [carterasSeleccionadas, setCarterasSeleccionadas] = useState<number[]>([])
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loadingOriginSearch, setLoadingOriginSearch] = useState(false)
  const [loadingDestinationSearch, setLoadingDestinationSearch] = useState(false)
  const [loadingCarteras, setLoadingCarteras] = useState(false)
  const [transferring, setTransferring] = useState(false)

  const searchAdvisors = async (
    query: string,
    mode: 'origin' | 'destination',
  ) => {
    if (!query.trim()) {
      if (mode === 'origin') setOriginResults([])
      else setDestinationResults([])
      return
    }

    if (mode === 'origin') setLoadingOriginSearch(true)
    else setLoadingDestinationSearch(true)

    try {
      const { data } = await axios.get<UserItem[]>(`${API_BASE_URL}/users/advisors/`, {
        params: { q: query.trim() },
        headers: authHeaders(),
      })

      if (mode === 'origin') setOriginResults(data)
      else setDestinationResults(data)
    } catch {
      if (mode === 'origin') setOriginResults([])
      else setDestinationResults([])
    } finally {
      if (mode === 'origin') setLoadingOriginSearch(false)
      else setLoadingDestinationSearch(false)
    }
  }

  const loadOriginCarteras = async (advisorId: number) => {
    setLoadingCarteras(true)
    setCarteras([])
    setCarterasSeleccionadas([])

    try {
      const { data } = await axios.get<AdvisorSearchResponse>(
        `${API_BASE_URL}/users/advisors/${advisorId}/carteras/`,
        {
          headers: authHeaders(),
        },
      )
      setCarteras(data.carteras)
    } catch {
      setCarteras([])
    } finally {
      setLoadingCarteras(false)
    }
  }

  const toggleCartera = (id: number) => {
    setCarterasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  const toggleAll = () => {
    if (carterasSeleccionadas.length === carteras.length) {
      setCarterasSeleccionadas([])
    } else {
      setCarterasSeleccionadas(carteras.map((c) => c.id))
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!selectedOrigin || !selectedDestination) {
      setError('Debes seleccionar asesor de origen y destino.')
      return
    }

    if (selectedOrigin.id === selectedDestination.id) {
      setError('El asesor de origen y destino no pueden ser el mismo.')
      return
    }

    if (carterasSeleccionadas.length === 0) {
      setError('Debes seleccionar al menos una cartera.')
      return
    }

    setTransferring(true)

    try {
      const { data } = await axios.post<TransferResponse>(
        `${API_BASE_URL}/users/transfer-cartera/`,
        {
          asesor_origen_id: selectedOrigin.id,
          asesor_destino_id: selectedDestination.id,
          cartera_ids: carterasSeleccionadas,
          observaciones,
        },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      setMessage(
        `Transferencia realizada: ${data.carteras_transferidas.length} cartera(s), ${data.total_clientes_transferidos} cliente(s).`,
      )
      setSelectedOrigin(null)
      setSelectedDestination(null)
      setOriginQuery('')
      setDestinationQuery('')
      setOriginResults([])
      setDestinationResults([])
      setCarteras([])
      setCarterasSeleccionadas([])
      setObservaciones('')
    } catch (error) {
      setError(getErrorDetail(error, 'No se pudo transferir la cartera.'))
    } finally {
      setTransferring(false)
    }
  }

  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div
          className="form-icon-box me-3"
          style={{ borderColor: '#4ecdc4', background: 'rgba(78, 205, 196, 0.1)' }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4ecdc4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
            Transferencia de Cartera
          </h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
            Transfiera una o varias carteras entre asesores del sistema.
          </span>
        </div>
      </div>

      <form onSubmit={handleTransfer}>
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">01.</span> Asesor de Origen
        </h6>

        <div className="row g-4 mb-4">
          <div className="col-md-8">
            <label className="form-label text-white-50 small mb-2">
              Buscar Asesor (nombre o usuario) *
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                placeholder="Ingrese nombre o usuario del asesor de origen..."
                value={originQuery}
                onChange={(e) => setOriginQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  (e.preventDefault(), void searchAdvisors(originQuery, 'origin'))
                }
                required
              />
            </div>
          </div>

          <div className="col-md-4 d-flex align-items-end">
            <button
              type="button"
              className="btn-gold-action px-4 py-3 d-flex align-items-center gap-2 w-100 justify-content-center"
              style={{ fontSize: '13px', borderRadius: '10px' }}
              onClick={() => {
                void searchAdvisors(originQuery, 'origin')
              }}
              disabled={loadingOriginSearch}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              {loadingOriginSearch ? 'BUSCANDO...' : 'BUSCAR'}
            </button>
          </div>

          {originResults.length > 0 && (
            <div className="col-12">
              <div className="reference-box p-3">
                <div className="d-flex flex-column gap-2">
                  {originResults.map((advisor) => (
                    <button
                      key={advisor.id}
                      type="button"
                      className="btn-modern-dark d-flex justify-content-between align-items-center text-start"
                      onClick={() => {
                        setSelectedOrigin(advisor)
                        void loadOriginCarteras(advisor.id)
                      }}
                    >
                      <span>{advisor.full_name} • {advisor.username}</span>
                      <span>{advisor.estado}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="col-12">
            <div className="reference-box p-3 d-flex align-items-center gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#cca641"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="text-white-50 small">
                {selectedOrigin
                  ? `Origen seleccionado: ${selectedOrigin.full_name} (${selectedOrigin.username})`
                  : 'Ningún asesor de origen seleccionado.'}
              </span>
            </div>
          </div>
        </div>

        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">02.</span> Asesor de Destino
        </h6>

        <div className="row g-4 mb-4">
          <div className="col-md-8">
            <label className="form-label text-white-50 small mb-2">
              Buscar Asesor (nombre o usuario) *
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                placeholder="Ingrese nombre o usuario del asesor de destino..."
                value={destinationQuery}
                onChange={(e) => setDestinationQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  (e.preventDefault(), void searchAdvisors(destinationQuery, 'destination'))
                }
                required
              />
            </div>
          </div>

          <div className="col-md-4 d-flex align-items-end">
            <button
              type="button"
              className="btn-gold-action px-4 py-3 d-flex align-items-center gap-2 w-100 justify-content-center"
              style={{ fontSize: '13px', borderRadius: '10px' }}
              onClick={() => {
                void searchAdvisors(destinationQuery, 'destination')
              }}
              disabled={loadingDestinationSearch}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              {loadingDestinationSearch ? 'BUSCANDO...' : 'BUSCAR'}
            </button>
          </div>

          {destinationResults.length > 0 && (
            <div className="col-12">
              <div className="reference-box p-3">
                <div className="d-flex flex-column gap-2">
                  {destinationResults.map((advisor) => (
                    <button
                      key={advisor.id}
                      type="button"
                      className="btn-modern-dark d-flex justify-content-between align-items-center text-start"
                      onClick={() => setSelectedDestination(advisor)}
                    >
                      <span>{advisor.full_name} • {advisor.username}</span>
                      <span>{advisor.estado}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="col-12">
            <div className="reference-box p-3 d-flex align-items-center gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#cca641"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="text-white-50 small">
                {selectedDestination
                  ? `Destino seleccionado: ${selectedDestination.full_name} (${selectedDestination.username})`
                  : 'Ningún asesor de destino seleccionado.'}
              </span>
            </div>
          </div>
        </div>

        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">03.</span> Carteras a Transferir
          {carterasSeleccionadas.length > 0 && (
            <span className="transfer-count-badge">
              {carterasSeleccionadas.length} seleccionada(s)
            </span>
          )}
        </h6>

        {loadingCarteras ? (
          <div className="reference-box p-4 mb-4 text-center">
            <p className="text-white-50 small mb-0">Cargando carteras del asesor de origen...</p>
          </div>
        ) : carteras.length > 0 ? (
          <>
            <div className="mb-3">
              <label className="transfer-check-item transfer-check-all" onClick={toggleAll}>
                <div
                  className={`transfer-checkbox ${
                    carterasSeleccionadas.length === carteras.length ? 'checked' : ''
                  }`}
                >
                  {carterasSeleccionadas.length === carteras.length && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <span className="text-white-50 small fw-bold">
                  Seleccionar todas las carteras
                </span>
              </label>
            </div>

            <div className="transfer-cartera-list mb-5">
              {carteras.map((cartera) => {
                const isSelected = carterasSeleccionadas.includes(cartera.id)
                return (
                  <label
                    key={cartera.id}
                    className={`transfer-check-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleCartera(cartera.id)}
                  >
                    <div className={`transfer-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <div className="transfer-cartera-info">
                      <span className="transfer-cartera-name">{cartera.nombre_cartera}</span>
                      <span className="transfer-cartera-count">
                        {cartera.total_clientes} clientes
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          </>
        ) : (
          <div className="reference-box p-4 mb-5 text-center">
            <p className="text-white-50 small mb-0">
              Selecciona un asesor de origen para cargar sus carteras.
            </p>
          </div>
        )}

        <div className="row g-4 mb-5">
          <div className="col-12">
            <label className="form-label text-white-50 small mb-2">
              Motivo de Transferencia
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                placeholder="Ej. Cambio de zona, renuncia, reorganización..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </div>
        </div>

        {(error || message) && (
          <div className="mb-4">
            {error ? <div className="text-warning small">{error}</div> : null}
            {message ? <div className="text-success small">{message}</div> : null}
          </div>
        )}

        <div className="d-flex justify-content-end mt-5 pt-4 form-header-border">
          <button
            type="submit"
            className="btn-gold-action px-5 py-3 d-flex align-items-center gap-2"
            style={{ fontSize: '14px', borderRadius: '12px' }}
            disabled={transferring}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            </svg>
            {transferring
              ? 'TRANSFIRIENDO...'
              : `TRANSFERIR ${
                  carterasSeleccionadas.length > 0
                    ? `(${carterasSeleccionadas.length}) `
                    : ''
                }CARTERA${carterasSeleccionadas.length !== 1 ? 'S' : ''}`}
          </button>
        </div>
      </form>
    </>
  )
}

// =====================================================================
// Vista 3: Lista de Asesores en el Sistema
// =====================================================================

function VistaListaAsesores() {
  const [busqueda, setBusqueda] = useState('')
  const [usuarios, setUsuarios] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const loadUsuarios = useCallback(async (query: string = '') => {
    setLoading(true)
    setError('')

    try {
      const { data } = await axios.get<UserItem[]>(`${API_BASE_URL}/users/`, {
        params: query ? { q: query } : {},
        headers: authHeaders(),
      })
      setUsuarios(data)
    } catch (error) {
      setUsuarios([])
      setError(getErrorDetail(error, 'No se pudieron cargar los usuarios.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsuarios('')
  }, [loadUsuarios])

  const toggleEstado = async (usuario: UserItem) => {
    setActionMessage('')
    setTogglingId(usuario.id)

    const nuevoEstado = usuario.estado === 'activo' ? 'inactivo' : 'activo'

    try {
      await axios.patch(
        `${API_BASE_URL}/users/${usuario.id}/status/`,
        { estado: nuevoEstado },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      setActionMessage(
        `${usuario.full_name} ahora está ${nuevoEstado}.`,
      )
      await loadUsuarios(busqueda.trim())
    } catch (error) {
      setActionMessage(
        getErrorDetail(error, 'No se pudo cambiar el estado del usuario.'),
      )
    } finally {
      setTogglingId(null)
    }
  }

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const target = `${u.full_name} ${u.username} ${u.role || ''}`.toLowerCase()
      return target.includes(busqueda.toLowerCase())
    })
  }, [usuarios, busqueda])

  const activos = usuariosFiltrados.filter((u) => u.estado === 'activo')
  const inactivos = usuariosFiltrados.filter((u) => u.estado === 'inactivo')

  const renderUsuarioCard = (usuario: UserItem) => (
    <div
      key={usuario.id}
      className={`advisor-card ${usuario.estado === 'inactivo' ? 'advisor-card-inactive' : ''}`}
    >
      <div
        className={`advisor-avatar ${
          usuario.estado === 'inactivo' ? 'advisor-avatar-inactive' : ''
        }`}
      >
        <span>{getInitials(usuario.full_name)}</span>
      </div>

      <div className="advisor-info">
        <div className="advisor-name-row">
          <h6 className="advisor-name">{usuario.full_name}</h6>
          <span
            className={`advisor-estado-badge ${
              usuario.estado === 'activo' ? 'estado-activo' : 'estado-inactivo'
            }`}
          >
            {usuario.estado}
          </span>
        </div>
        <span className="advisor-role">{usuario.role || 'Sin rol'}</span>
      </div>

      <div className="advisor-contact">
        <div className="advisor-contact-item">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span>{usuario.telefono || 'Sin teléfono'}</span>
        </div>

        <div className="advisor-contact-item">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <span>{usuario.email}</span>
        </div>
      </div>

      <button
        className={`advisor-toggle-btn ${
          usuario.estado === 'activo' ? 'toggle-to-inactive' : 'toggle-to-active'
        }`}
        onClick={() => {
          void toggleEstado(usuario)
        }}
        title={usuario.estado === 'activo' ? 'Desactivar usuario' : 'Activar usuario'}
        disabled={togglingId === usuario.id}
      >
        {usuario.estado === 'activo' ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
            <line x1="12" y1="2" x2="12" y2="12"></line>
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </button>
    </div>
  )

  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div
          className="form-icon-box me-3"
          style={{ borderColor: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
            Asesores del Sistema
          </h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
            Lista de usuarios registrados en el sistema.
          </span>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="inset-input-box">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              style={{ flexShrink: 0, marginRight: '10px' }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, usuario o rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                (e.preventDefault(), void loadUsuarios(busqueda.trim()))
              }
            />
          </div>
        </div>
      </div>

      <div className="mb-4 d-flex gap-2">
        <button
          type="button"
          className="btn-gold-action px-4 py-2"
          style={{ borderRadius: '8px' }}
          onClick={() => {
            void loadUsuarios(busqueda.trim())
          }}
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Actualizar lista'}
        </button>
      </div>

      {error ? <div className="text-warning small mb-3">{error}</div> : null}
      {actionMessage ? <div className="text-success small mb-3">{actionMessage}</div> : null}

      {usuariosFiltrados.length === 0 ? (
        <div className="reference-box p-4 text-center">
          <p className="text-white-50 small mb-0">
            No se encontraron usuarios con ese criterio de búsqueda.
          </p>
        </div>
      ) : (
        <>
          {activos.length > 0 && (
            <div className="mb-5">
              <div className="advisor-section-header">
                <span className="advisor-section-dot" style={{ background: '#10b981' }}></span>
                <h6 className="advisor-section-title">Activos</h6>
                <span className="advisor-section-count">{activos.length}</span>
              </div>
              <div className="advisor-list">{activos.map(renderUsuarioCard)}</div>
            </div>
          )}

          {inactivos.length > 0 && (
            <div className="mb-4">
              <div className="advisor-section-header">
                <span className="advisor-section-dot" style={{ background: '#ef4444' }}></span>
                <h6 className="advisor-section-title">Inactivos</h6>
                <span className="advisor-section-count">{inactivos.length}</span>
              </div>
              <div className="advisor-list">{inactivos.map(renderUsuarioCard)}</div>
            </div>
          )}
        </>
      )}

      <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-white-50 small mb-0 text-center">
          {activos.length} activo(s) · {inactivos.length} inactivo(s) · {usuarios.length} total
        </p>
      </div>
    </>
  )
}

export default AdvisorPage