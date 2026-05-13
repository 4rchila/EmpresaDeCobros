import "./portafolio.css"
import '../dashboard/dashboard.css'
import axios from 'axios'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  API_BASE_URL,
  authHeaders,
  buildApiFileUrl,
  type SessionUser,
} from '../../lib'

// =====================================================================
// Interfaces
// =====================================================================
interface GarantiaFoto {
  id: string
  rutaArchivo: string
  descripcion: string
  esPrincipal: boolean
}

interface Garantia {
  id: string
  descripcion: string
  categoria: string
  valorEstimado: string
  estado: string
  fotosCount: number
  fotos: GarantiaFoto[]
}

interface Loan {
  id: string
  amount: string
  interes: string
  montoTotal: string
  destino: string
  periodicidad: string
  cuotas: number
  mora: string
  status: string
  date: string
  garantias: Garantia[]
}

interface Cliente {
  id: string
  carteraId: string
  name: string
  dpi: string
  phone: string
  loans: Loan[]
}

interface Cartera {
  id: string
  name: string
  status: 'activa' | 'vencida' | 'muerta'
}

type BackendGarantiaFoto = {
  id: number
  ruta_archivo: string
  descripcion?: string | null
  es_principal?: boolean
}

type BackendGarantia = {
  id: number
  descripcion: string
  tipo_garantia?: string | null
  valor_estimado: string
  estado_garantia: string
  fotos?: BackendGarantiaFoto[]
}

type BackendLoan = {
  id: number
  monto_solicitado: string
  interes: string
  monto_total: number | string
  destino_uso: string | null
  periodicidad: string | null
  cuotas: number | null
  mora: string | number | null
  status: string
  date: string
  garantias: BackendGarantia[]
}

type BackendCliente = {
  id: number
  carteraId: number | null
  name: string
  dpi: string | null
  phone: string | null
  loans: BackendLoan[]
}

type BackendCartera = {
  id: number
  name: string
  status: 'activa' | 'vencida' | 'muerta'
  fecha_inicio?: string | null
  fecha_fin?: string | null
  clientes_count?: number
  clientes: BackendCliente[]
}

type PortfolioResponse = {
  carteras: BackendCartera[]
  sin_cartera: BackendCliente[]
}

type PortafolioPageProps = {
  user?: SessionUser | null
}

// Configuración visual por estado
const STATUS_CONFIG = {
  activa: { label: 'Activas', color: '#10b981', colorRgb: '16, 185, 129' },
  vencida: { label: 'Vencidas', color: '#f59e0b', colorRgb: '245, 158, 11' },
  muerta: { label: 'Muertas', color: '#ef4444', colorRgb: '239, 68, 68' },
} as const

function formatMoney(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0)
  return `Q${amount.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatPercent(value: string | number | null | undefined): string {
  const num = Number(value ?? 0)
  return `${num}%`
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-GT')
}

function getErrorDetail(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
  }
  return fallback
}

function resolveFileUrl(path?: string | null): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return buildApiFileUrl(path) ?? ''
}

function mapGarantiaFoto(item: BackendGarantiaFoto): GarantiaFoto {
  return {
    id: String(item.id),
    rutaArchivo: resolveFileUrl(item.ruta_archivo),
    descripcion: item.descripcion || 'Imagen',
    esPrincipal: Boolean(item.es_principal),
  }
}

function mapGarantia(item: BackendGarantia): Garantia {
  const fotos = (item.fotos || []).map(mapGarantiaFoto)

  return {
    id: String(item.id),
    descripcion: item.descripcion,
    categoria: item.tipo_garantia || 'Sin categoría',
    valorEstimado: formatMoney(item.valor_estimado),
    estado: item.estado_garantia,
    fotosCount: fotos.length,
    fotos,
  }
}

function mapLoan(item: BackendLoan): Loan {
  return {
    id: String(item.id),
    amount: formatMoney(item.monto_solicitado),
    interes: formatPercent(item.interes),
    montoTotal: formatMoney(item.monto_total),
    destino: item.destino_uso || 'Sin destino',
    periodicidad: item.periodicidad || 'Sin periodicidad',
    cuotas: Number(item.cuotas ?? 0),
    mora: formatPercent(item.mora),
    status: item.status || 'pendiente',
    date: formatDate(item.date),
    garantias: (item.garantias || []).map(mapGarantia),
  }
}

function mapCliente(item: BackendCliente): Cliente {
  return {
    id: String(item.id),
    carteraId: item.carteraId ? String(item.carteraId) : 'sin_cartera',
    name: item.name,
    dpi: item.dpi || 'Sin DPI',
    phone: item.phone || 'Sin teléfono',
    loans: (item.loans || []).map(mapLoan),
  }
}

function mapCartera(item: BackendCartera): Cartera {
  return {
    id: String(item.id),
    name: item.name,
    status: item.status,
  }
}

// =====================================================================
// Componente Principal
// =====================================================================
function PortafolioPage({ user }: PortafolioPageProps) {
  const [carteras, setCarteras] = useState<Cartera[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [editingCarteraId, setEditingCarteraId] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [showGarantias, setShowGarantias] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedImageLabel, setSelectedImageLabel] = useState('')
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savingEditId, setSavingEditId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [movingClientId, setMovingClientId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const roleLower = user?.role?.trim().toLowerCase() ?? ''
  const portfolioEnabledRoles = ['administrador', 'admin', 'gerente', 'secretaria', 'asesor']
  const canCreate = portfolioEnabledRoles.includes(roleLower)
  const canEdit = portfolioEnabledRoles.includes(roleLower)
  const canDelete = portfolioEnabledRoles.includes(roleLower)
  const canMove = portfolioEnabledRoles.includes(roleLower)

  const loadPortfolio = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await axios.get<PortfolioResponse>(
        `${API_BASE_URL}/creditors/portfolio/`,
        {
          headers: authHeaders(),
        },
      )

      const mappedCarteras = data.carteras.map(mapCartera)
      const mappedClientes = [
        ...data.carteras.flatMap((cartera) => cartera.clientes.map(mapCliente)),
        ...(data.sin_cartera || []).map(mapCliente),
      ]

      setCarteras(mappedCarteras)
      setClientes(mappedClientes)
    } catch (error) {
      setError(getErrorDetail(error, 'No se pudo cargar el portafolio.'))
      setCarteras([])
      setClientes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPortfolio()
  }, [loadPortfolio])

  const clientesSinCartera = useMemo(
    () => clientes.filter((cli) => cli.carteraId === 'sin_cartera'),
    [clientes],
  )

  const handleImageError = (key: string) => {
    setBrokenImages((prev) => ({ ...prev, [key]: true }))
  }

  const openImageModal = (url: string, label: string) => {
    if (!url) return
    setSelectedImage(url)
    setSelectedImageLabel(label)
  }

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, clienteId: string) => {
    if (!canMove) return
    e.dataTransfer.setData('clienteId', clienteId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!canMove) return
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, carteraId: string) => {
    if (!canMove) return
    e.preventDefault()
    const clienteId = e.dataTransfer.getData('clienteId')
    if (!clienteId) return

    setMessage('')
    setError('')
    setMovingClientId(clienteId)

    try {
      await axios.post(
        `${API_BASE_URL}/creditors/portfolio/move-client/`,
        {
          cliente_id: Number(clienteId),
          cartera_destino_id: Number(carteraId),
        },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      setClientes((prev) =>
        prev.map((cli) =>
          cli.id === clienteId ? { ...cli, carteraId } : cli,
        ),
      )
      setMessage('Cliente movido correctamente.')
    } catch (error) {
      setError(getErrorDetail(error, 'No se pudo mover el cliente.'))
    } finally {
      setMovingClientId(null)
    }
  }

  const startEditing = (cartera: Cartera) => {
    if (!canEdit) return
    setEditingCarteraId(cartera.id)
    setEditNameValue(cartera.name)
  }

  const saveEditing = async (id: string) => {
    if (!canEdit) return

    setMessage('')
    setError('')
    setSavingEditId(id)

    try {
      const { data } = await axios.patch<{
        id: number
        name: string
        status: 'activa' | 'vencida' | 'muerta'
      }>(
        `${API_BASE_URL}/creditors/portfolio/${id}/`,
        {
          nombre_cartera: editNameValue || 'Sin Nombre',
        },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      setCarteras((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, name: data.name || editNameValue || 'Sin Nombre' } : c,
        ),
      )
      setEditingCarteraId(null)
      setMessage('Cartera actualizada correctamente.')
    } catch (error) {
      setError(getErrorDetail(error, 'No se pudo editar la cartera.'))
    } finally {
      setSavingEditId(null)
    }
  }

  const cancelEditing = () => {
    setEditingCarteraId(null)
  }

  const handleCrearCartera = async () => {
    if (!canCreate) return

    setMessage('')
    setError('')
    setCreating(true)

    try {
      const { data } = await axios.post<{
        id: number
        name: string
        status: 'activa' | 'vencida' | 'muerta'
      }>(
        `${API_BASE_URL}/creditors/portfolio/create/`,
        {
          nombre_cartera: 'Nueva Cartera',
          estado: 'activa',
        },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      setCarteras((prev) => [
        ...prev,
        {
          id: String(data.id),
          name: data.name || 'Nueva Cartera',
          status: data.status || 'activa',
        },
      ])
      setMessage('Cartera creada correctamente.')
    } catch (error) {
      setError(getErrorDetail(error, 'No se pudo crear la cartera.'))
    } finally {
      setCreating(false)
    }
  }

  const handleEliminarCartera = async (carteraId: string) => {
    if (!canDelete) return

    setMessage('')
    setError('')
    setDeletingId(carteraId)

    try {
      await axios.delete(`${API_BASE_URL}/creditors/portfolio/${carteraId}/`, {
        headers: authHeaders(),
      })

      setCarteras((prev) => prev.filter((c) => c.id !== carteraId))
      setMessage('Cartera eliminada correctamente.')
    } catch (error) {
      setError(getErrorDetail(error, 'No se pudo eliminar la cartera.'))
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpenLoan = (loan: Loan) => {
    setSelectedLoan(loan)
    setShowGarantias(false)
  }

  const handleDownloadDocument = async (loanId: string, docType: 'pagare' | 'contrato', format: 'docx' | 'pdf') => {
    setMessage('')
    setError('')
    const downloadKey = `${docType}-${format}`
    setDownloading(downloadKey)

    try {
      const response = await axios.get(
        `${API_BASE_URL}/loans/${loanId}/documento/${docType}/?format=${format}`,
        {
          headers: authHeaders(),
          responseType: 'blob',
        }
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${docType}_${loanId}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setMessage('Documento descargado con éxito.')
    } catch (error) {
      setError(getErrorDetail(error, 'No se pudo descargar el documento.'))
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="portafolio-page">
      <div className="portafolio-header">
        <div>
          <h1 className="portafolio-title">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Gestión de Carteras
          </h1>
          <p className="portafolio-subtitle">Administración estructural de portafolios y clientes.</p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="portafolio-btn-crear"
            onClick={handleCrearCartera}
            disabled={!canCreate || creating}
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {creating ? 'Creando...' : 'Crear Nueva Cartera'}
          </button>

          <button
            className="btn-modern-dark"
            onClick={() => {
              void loadPortfolio()
            }}
            type="button"
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {(error || message) && (
        <div className="mb-4">
          {error ? <div className="text-warning small">{error}</div> : null}
          {message ? <div className="text-success small">{message}</div> : null}
        </div>
      )}

      {clientesSinCartera.length > 0 && (
        <div className="portafolio-section">
          <div className="portafolio-section-header">
            <span className="portafolio-status-dot" style={{ background: '#64748b' }}></span>
            <h2 className="portafolio-section-title">Clientes sin cartera</h2>
          </div>

          <div className="portafolio-grid">
            <div className="cartera-card">
              <div
                className="cartera-header"
                style={{ background: 'linear-gradient(135deg, rgba(100,116,139,0.8), rgba(100,116,139,0.5))' }}
              >
                <div className="cartera-header-left">
                  <h3 className="cartera-title">Sin cartera</h3>
                  <span className="cartera-count">{clientesSinCartera.length} clientes</span>
                </div>
              </div>

              <div className="cartera-body">
                {clientesSinCartera.map((cliente) => (
                  <div
                    key={cliente.id}
                    className={`cliente-card ${movingClientId === cliente.id ? 'opacity-50' : ''}`}
                    draggable={canMove}
                    onDragStart={(e) => handleDragStart(e, cliente.id)}
                    onClick={() => setSelectedCliente(cliente)}
                  >
                    <div className="cliente-info">
                      <h4 className="cliente-name">{cliente.name}</h4>
                      <p className="cliente-dpi">{cliente.dpi}</p>
                      <p className="cliente-phone">{cliente.phone}</p>
                    </div>
                    <div className="cliente-loans-count">
                      {cliente.loans.length} préstamo(s)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="portafolio-sections">
        {(['activa', 'vencida', 'muerta'] as const).map((statusKey) => {
          const carterasOfStatus = carteras.filter((c) => c.status === statusKey)
          if (carterasOfStatus.length === 0) return null
          const config = STATUS_CONFIG[statusKey]

          return (
            <div key={statusKey} className="portafolio-section">
              <div className="portafolio-section-header">
                <span className="portafolio-status-dot" style={{ background: config.color }}></span>
                <h2 className="portafolio-section-title">Carteras {config.label}</h2>
              </div>

              <div className="portafolio-grid">
                {carterasOfStatus.map((cartera) => {
                  const carteraClientes = clientes.filter((cli) => cli.carteraId === cartera.id)

                  return (
                    <div
                      key={cartera.id}
                      className="cartera-card"
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        void handleDrop(e, cartera.id)
                      }}
                    >
                      <div
                        className="cartera-header"
                        style={{
                          background: `linear-gradient(135deg, rgba(${config.colorRgb}, 0.8), rgba(${config.colorRgb}, 0.5))`,
                        }}
                      >
                        <div className="cartera-header-left">
                          {editingCarteraId === cartera.id ? (
                            <div className="cartera-edit-row">
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                className="cartera-edit-input"
                                autoFocus
                                onKeyDown={(e) =>
                                  e.key === 'Enter' && void saveEditing(cartera.id)
                                }
                              />
                              <button
                                className="cartera-edit-btn save"
                                onClick={() => {
                                  void saveEditing(cartera.id)
                                }}
                                type="button"
                                disabled={savingEditId === cartera.id}
                              >
                                ✓
                              </button>
                              <button
                                className="cartera-edit-btn cancel"
                                onClick={cancelEditing}
                                type="button"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <>
                              <h3 className="cartera-title">{cartera.name}</h3>
                              <span className="cartera-count">
                                {carteraClientes.length} cliente(s)
                              </span>
                            </>
                          )}
                        </div>

                        {editingCarteraId !== cartera.id && (
                          <div className="cartera-actions">
                            <button
                              className="cartera-action-btn"
                              onClick={() => startEditing(cartera)}
                              title="Editar nombre"
                              type="button"
                              disabled={!canEdit}
                            >
                              ✎
                            </button>
                            <button
                              className="cartera-action-btn delete"
                              onClick={() => {
                                void handleEliminarCartera(cartera.id)
                              }}
                              title="Eliminar cartera"
                              type="button"
                              disabled={!canDelete || deletingId === cartera.id}
                            >
                              {deletingId === cartera.id ? '...' : '🗑'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="cartera-body">
                        {carteraClientes.length === 0 ? (
                          <p className="cartera-empty">Arrastra clientes aquí</p>
                        ) : (
                          carteraClientes.map((cliente) => (
                            <div
                              key={cliente.id}
                              className={`cliente-card ${movingClientId === cliente.id ? 'opacity-50' : ''}`}
                              draggable={canMove}
                              onDragStart={(e) => handleDragStart(e, cliente.id)}
                              onClick={() => setSelectedCliente(cliente)}
                            >
                              <div className="cliente-info">
                                <h4 className="cliente-name">{cliente.name}</h4>
                                <p className="cliente-dpi">{cliente.dpi}</p>
                                <p className="cliente-phone">{cliente.phone}</p>
                              </div>
                              <div className="cliente-loans-count">
                                {cliente.loans.length} préstamo(s)
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {selectedCliente && (
        <div className="modal-overlay" onClick={() => setSelectedCliente(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedCliente.name}</h3>
                <p className="modal-subtitle">
                  DPI: {selectedCliente.dpi} • Tel: {selectedCliente.phone}
                </p>
              </div>
              <button className="modal-close" onClick={() => setSelectedCliente(null)} type="button">
                ✕
              </button>
            </div>

            <div className="modal-body">
              {selectedCliente.loans.length === 0 ? (
                <p className="loan-garantia-empty">Este cliente no tiene préstamos registrados.</p>
              ) : (
                selectedCliente.loans.map((loan) => (
                  <div key={loan.id} className="loan-card-detail" onClick={() => handleOpenLoan(loan)}>
                    <div className="loan-detail-grid">
                      <div className="loan-detail-item">
                        <span className="modal-data-label">Préstamo</span>
                        <span className="modal-data-value">#{loan.id}</span>
                      </div>
                      <div className="loan-detail-item">
                        <span className="modal-data-label">Monto</span>
                        <span className="modal-data-value text-gold">{loan.amount}</span>
                      </div>
                      <div className="loan-detail-item">
                        <span className="modal-data-label">Interés</span>
                        <span className="modal-data-value">{loan.interes}</span>
                      </div>
                      <div className="loan-detail-item">
                        <span className="modal-data-label">Destino</span>
                        <span className="modal-data-value">{loan.destino}</span>
                      </div>
                      <div className="loan-detail-item">
                        <span className="modal-data-label">Periodicidad</span>
                        <span className="modal-data-value">{loan.periodicidad}</span>
                      </div>
                      <div className="loan-detail-item">
                        <span className="modal-data-label">Cuotas</span>
                        <span className="modal-data-value">{loan.cuotas}</span>
                      </div>
                      <div className="loan-detail-item">
                        <span className="modal-data-label">Mora</span>
                        <span className="modal-data-value">{loan.mora}</span>
                      </div>
                      <div className="loan-detail-item">
                        <span className="modal-data-label">Estado</span>
                        <span className="modal-data-value">{loan.status}</span>
                      </div>
                    </div>

                    <div className="loan-monto-total-box">
                      <div className="loan-monto-total-left">
                        <span>Monto Total</span>
                      </div>
                      <span className="loan-monto-total-value">{loan.montoTotal}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedLoan && !showGarantias && (
        <div className="modal-overlay" onClick={() => setSelectedLoan(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Préstamo #{selectedLoan.id}</h3>
                <p className="modal-subtitle">{selectedLoan.date}</p>
              </div>
              <button className="modal-close" onClick={() => setSelectedLoan(null)} type="button">
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="loan-detail-grid">
                <div className="loan-detail-item">
                  <span className="modal-data-label">Monto</span>
                  <span className="modal-data-value text-gold">{selectedLoan.amount}</span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Interés</span>
                  <span className="modal-data-value">{selectedLoan.interes}</span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Destino</span>
                  <span className="modal-data-value">{selectedLoan.destino}</span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Periodicidad</span>
                  <span className="modal-data-value">{selectedLoan.periodicidad}</span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Cuotas</span>
                  <span className="modal-data-value">{selectedLoan.cuotas}</span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Mora</span>
                  <span className="modal-data-value">{selectedLoan.mora}</span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Estado</span>
                  <span className="modal-data-value">{selectedLoan.status}</span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Fecha</span>
                  <span className="modal-data-value">{selectedLoan.date}</span>
                </div>
              </div>

              <div className="loan-monto-total-box">
                <div className="loan-monto-total-left">
                  <span>Monto Total</span>
                </div>
                <span className="loan-monto-total-value">{selectedLoan.montoTotal}</span>
              </div>

              <div className="loan-document-section mt-4">
                <h4 className="text-gold small mb-3" style={{ opacity: 0.8, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Documentos Legales
                </h4>
                <div className="d-flex flex-wrap gap-2">
                  <button 
                    className="btn-modern-dark py-2 px-3 d-flex align-items-center gap-2"
                    onClick={() => void handleDownloadDocument(selectedLoan.id, 'pagare', 'docx')}
                    disabled={downloading !== null}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Pagaré (Word)
                  </button>
                  <button 
                    className="btn-modern-dark py-2 px-3 d-flex align-items-center gap-2"
                    onClick={() => void handleDownloadDocument(selectedLoan.id, 'pagare', 'pdf')}
                    disabled={downloading !== null}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Pagaré (PDF)
                  </button>
                  <button 
                    className="btn-modern-dark py-2 px-3 d-flex align-items-center gap-2"
                    onClick={() => void handleDownloadDocument(selectedLoan.id, 'contrato', 'docx')}
                    disabled={downloading !== null}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Contrato (Word)
                  </button>
                  <button 
                    className="btn-modern-dark py-2 px-3 d-flex align-items-center gap-2"
                    onClick={() => void handleDownloadDocument(selectedLoan.id, 'contrato', 'pdf')}
                    disabled={downloading !== null}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Contrato (PDF)
                  </button>
                </div>
              </div>

              <div className="loan-garantia-section">
                <div className="loan-garantia-header">
                  <span className="loan-garantia-count">
                    {selectedLoan.garantias.length} garantía(s)
                  </span>
                </div>

                <button className="loan-garantia-btn" onClick={() => setShowGarantias(true)} type="button">
                  Ver Garantías
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedLoan && showGarantias && (
        <div className="modal-overlay" onClick={() => setShowGarantias(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Garantías del Préstamo #{selectedLoan.id}</h3>
                <p className="modal-subtitle">{selectedLoan.garantias.length} garantía(s) registradas</p>
              </div>
              <button className="modal-close" onClick={() => setShowGarantias(false)} type="button">
                ✕
              </button>
            </div>

            <div className="modal-body">
              {selectedLoan.garantias.map((garantia, index) => (
                <div key={garantia.id} className="garantia-detail-card">
                  <div className="garantia-detail-header">
                    <span className="garantia-detail-number">Garantía {index + 1}</span>
                  </div>

                  <div className="loan-detail-grid">
                    <div className="loan-detail-item">
                      <span className="modal-data-label">Descripción</span>
                      <span className="modal-data-value">{garantia.descripcion}</span>
                    </div>
                    <div className="loan-detail-item">
                      <span className="modal-data-label">Categoría</span>
                      <span className="modal-data-value">{garantia.categoria}</span>
                    </div>
                    <div className="loan-detail-item">
                      <span className="modal-data-label">Valor Estimado</span>
                      <span className="modal-data-value text-gold">{garantia.valorEstimado}</span>
                    </div>
                    <div className="loan-detail-item">
                      <span className="modal-data-label">Estado General</span>
                      <span className="modal-data-value">{garantia.estado}</span>
                    </div>
                    <div className="loan-detail-item">
                      <span className="modal-data-label">Fotografías</span>
                      <span className="modal-data-value">
                        {garantia.fotosCount} imagen(es) registrada(s)
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    {garantia.fotos.length === 0 ? (
                      <div className="loan-detail-item">
                        <span className="modal-data-value">Sin fotografías</span>
                      </div>
                    ) : (
                      <div className="row g-3">
                        {garantia.fotos.map((foto) => {
                          const imageKey = `${garantia.id}-${foto.id}`
                          const isBroken = brokenImages[imageKey]

                          return (
                            <div key={foto.id} className="col-md-4">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!foto.rutaArchivo || isBroken) return
                                  openImageModal(
                                    foto.rutaArchivo,
                                    `${foto.descripcion || 'Imagen'}${foto.esPrincipal ? ' • Principal' : ''}`,
                                  )
                                }}
                                className="reference-box p-2 text-center w-100"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: isBroken ? 'default' : 'pointer',
                                }}
                              >
                                {!isBroken && foto.rutaArchivo ? (
                                  <img
                                    src={foto.rutaArchivo}
                                    alt={foto.descripcion || 'Foto de garantía'}
                                    style={{
                                      width: '100%',
                                      height: '140px',
                                      objectFit: 'cover',
                                      borderRadius: '10px',
                                      marginBottom: '8px',
                                    }}
                                    onError={() => handleImageError(imageKey)}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: '100%',
                                      height: '140px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '10px',
                                      marginBottom: '8px',
                                      background: 'rgba(255,255,255,0.04)',
                                      color: '#9ca3af',
                                      fontSize: '0.9rem',
                                      textAlign: 'center',
                                      padding: '12px',
                                    }}
                                  >
                                    Imagen no disponible
                                  </div>
                                )}

                                <small className="text-gold d-block">
                                  {foto.descripcion || 'Ver imagen'}
                                  {foto.esPrincipal ? ' • Principal' : ''}
                                </small>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="modal-btn-close" onClick={() => setShowGarantias(false)} type="button">
                ← Volver al Préstamo
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px' }}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Fotografía de garantía</h3>
                <p className="modal-subtitle">{selectedImageLabel}</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedImage(null)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="modal-body text-center">
              <img
                src={selectedImage}
                alt="Fotografía ampliada"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                }}
                onError={() => {
                  setSelectedImage(null)
                  setError('La imagen no existe físicamente en el servidor.')
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PortafolioPage