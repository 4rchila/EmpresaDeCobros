// Force reload: 2026-05-13 01:59
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { useNavigate } from 'react-router-dom'
import './dashboard.css'
import { API_BASE_URL, authHeaders, hasPermission, storage, buildApiFileUrl, type SessionUser } from '../../lib'
import UserProfile from '../user/userProfile'
import CreditorsPage from '../creditors/CreditorsPage'
import LoansPage from '../loans/LoansPage'
import AdvisorPage from '../advisor/advisorPage'
import PortafolioPage from '../portafolio/portafolioPage'
import PaymentsPage from '../payment/payments'
import VaultPage from '../vault/vault'
import ReportsPage from '../report/reports'
import LogsPage from '../log/logs'

const CHART_COLORS = {
  gold: '#cca641',
  goldLight: '#f6e073',
  green: '#10b981',
  red: '#ef4444',
  purple: '#8b5cf6',
  blue: '#3b82f6'
}

type SectionKey =
  | 'inicio'
  | 'perfil'
  | 'clientes'
  | 'prestamos'
  | 'portafolio'
  | 'asesores'
  | 'pagos'
  | 'caja'
  | 'reportes'
  | 'bitacora'

type SectionItem = {
  key: SectionKey
  label: string
  visible: boolean
}

type CanAccess = (required: string | string[]) => boolean

type NotificationItem = {
  id: string
  kind: 'precalificacion' | 'prestamo' | 'desembolso' | 'alerta'
  title: string
  subtitle: string
}

type PendingPrequalificationItem = {
  id: number
  cliente_id: number
  usuario_creador_id: number | null
  fecha_generacion: string
  observaciones: string | null
  estado_revision: string
  cliente_nombre: string | null
  cliente_dpi: string | null
  usuario_creador_nombre: string | null
}

type PendingLoanItem = {
  id: number
  cliente_nombre: string
  cliente_dpi: string | null
  monto_solicitado: string
  fecha_solicitud: string
}

const DASHBOARD_SECTION_KEY = 'dashboard_active_section'
const LOANS_TAB_KEY = 'dashboard_loans_tab'
const LOANS_PENDING_SECTION_KEY = 'dashboard_loans_pending_section'

type DashboardStats = {
  monto_recaudado: number
  capital_recaudado: number
  mora_recaudada: number
  ganancia_recaudada: number
  monto_por_recaudar_hoy?: number
  clientes_ruta?: number
  clientes_atrasados?: number
}

type RouteItem = {
  id_cuota: number
  prestamo_id: number
  cliente: string
  direccion: string
  monto: number
  numero_cuota: number
  estado: string
}

type OverdueItem = {
  id_cuota: number
  prestamo_id: number
  cliente: string
  direccion: string
  monto: number
  mora: number
  numero_cuota: number
  fecha_vencimiento: string
}

type DBNotification = {
  id: number
  tipo: string
  titulo: string
  mensaje: string
  referencia_id?: string
}

function formatMoney(value: string | number | null | undefined) {
  return Number(value ?? 0).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
const DashboardHome = ({
  displayName,
  displayRole,
  can,
  pendingPrequalificationItems,
  pendingApprovalItems,
  pendingDisbursementItems,
  onOpenPendingPrequalification,
  onOpenPendingApproval,
  onOpenPendingDisbursement,
  dashboardStats,
  reportsData,
  dailyRoute,
  overdueClients,
}: {
  displayName: string
  displayRole: string
  can: CanAccess
  pendingPrequalificationItems: PendingPrequalificationItem[]
  pendingApprovalItems: PendingLoanItem[]
  pendingDisbursementItems: PendingLoanItem[]
  onOpenPendingPrequalification: () => void
  onOpenPendingApproval: () => void
  onOpenPendingDisbursement: () => void
  dashboardStats: DashboardStats
  reportsData?: any
  dailyRoute?: RouteItem[]
  overdueClients?: OverdueItem[]
}) => {
  const canSeePayments = can([
    'registrar_pago_cartera_propia',
    'registrar_pago_cualquier_acreedor',
    'ver_cobros_dia_propio',
    'registrar_pago',
    'ver_pago',
  ])

  const canSeeRoute = can('ruta_cobro_propia')

  const roleLower = displayRole.trim().toLowerCase()
  const route = dailyRoute || []
  const overdue = overdueClients || []

  const isAdminRole =
    roleLower === 'administrador' ||
    roleLower === 'admin' ||
    roleLower === 'gerente'

  const canSeeLoanWorkflow =
    isAdminRole &&
    can([
      'aprobar_acreedor_precalificacion',
      'aprobar_acreedor_final',
      'ver_solicitudes_globales',
      'aprobar_prestamo',
    ])

  const canSeeCaja =
    isAdminRole &&
    can([
      'ingresar_recaudo_caja',
      'aprobar_recaudo_caja',
      'registrar_egresos_caja_fuerte',
      'ver_historial_caja_fuerte',
      'gestionar_caja',
      'ver_caja',
    ])

  const canSeeReports =
    isAdminRole &&
    can([
      'reportes_cartera_global',
      'reportes_rendimiento_todos_asesores',
      'ver_cobros_globales',
      'ver_reportes',
    ])

  const canSeeDisbursementCard =
    isAdminRole && can(['autorizar_desembolso', 'registrar_desembolso'])

  const hasWidgets =
    canSeePayments ||
    canSeeRoute ||
    canSeeCaja ||
    canSeeLoanWorkflow ||
    canSeeReports ||
    canSeeDisbursementCard

  return (
    <>
      <div className="mb-4">
        <h2 className="text-white fw-bold mb-1">Bienvenido, {displayName}</h2>
        <p className="text-white-50 mb-0">Rol actual: {displayRole}</p>
      </div>

      {!hasWidgets && (
        <div className="extruded-card p-4 mb-4">
          <h3 className="text-white mb-2">Sin módulos asignados</h3>
          <p className="text-white-50 mb-0">
            Tu usuario inició sesión correctamente, pero no tiene widgets visibles
            en el dashboard.
          </p>
        </div>
      )}

      {(canSeePayments || canSeeRoute) && (
        <div className="row g-4 mb-4">
          {canSeePayments && (
            <div className="col-md-5 d-flex flex-column gap-4">
              <div className="extruded-card d-flex flex-column align-items-center justify-content-center p-4" style={{ height: '50%' }}>
                <button className="btn-gold-action mb-3 w-100" type="button">
                  Monto Recaudado Hoy
                </button>

                <div className="amount-display d-flex align-items-center justify-content-center gap-2">
                  <span className="fw-bold" style={{ fontSize: '1.8rem', color: '#fff' }}>
                    Q {formatMoney(dashboardStats.monto_recaudado)}
                  </span>
                </div>
              </div>

              <div className="extruded-card d-flex flex-column align-items-center justify-content-center p-4" style={{ height: '50%' }}>
                <div className="text-white-50 small text-uppercase mb-2 fw-bold">Por Recaudar Hoy</div>
                <div className="amount-display d-flex align-items-center justify-content-center gap-2">
                  <span className="fw-bold text-gold" style={{ fontSize: '1.8rem' }}>
                    Q {formatMoney(dashboardStats.monto_por_recaudar_hoy)}
                  </span>
                </div>
                <div className="mt-2 small text-white-50">
                   {dashboardStats.clientes_ruta} clientes pendientes
                </div>
              </div>
            </div>
          )}

          {canSeeRoute && (
            <div className={canSeePayments ? 'col-md-7' : 'col-12'}>
              <div className="extruded-card h-100 d-flex flex-column p-4">
                <div className="w-100 d-flex justify-content-center position-relative mb-3">
                  <div className="glass-badge mx-auto text-center">
                    Ruta del Día
                  </div>
                  <span
                    className="position-absolute end-0 top-50 translate-middle-y link-hover"
                    style={{
                      fontSize: '0.85rem',
                      color: '#cca641',
                      cursor: 'pointer',
                    }}
                  >
                    Ver mapa completo
                  </span>
                </div>
                <div className="w-100 rounded flex-fill inner-dark-box mt-2 p-2 overflow-auto" style={{ maxHeight: '250px' }}>
                  {route.length === 0 ? (
                    <div className="h-100 d-flex align-items-center justify-content-center text-white-50 small">
                      No hay clientes en ruta para hoy
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {route.map((item) => (
                        <div key={item.id_cuota} className="reference-box p-3 border-gold-subtle">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <strong className="text-white">{item.cliente}</strong>
                            <span className="text-gold fw-bold">Q {formatMoney(item.monto)}</span>
                          </div>
                          <div className="text-white-50 small mb-1">
                            <i className="bi bi-geo-alt-fill me-1"></i> {item.direccion || 'Sin dirección registrada'}
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="badge bg-dark text-white-50 border border-secondary">Cuota #{item.numero_cuota}</span>
                            <span className={`badge ${item.estado === 'parcial' ? 'bg-warning text-dark' : 'bg-primary'}`}>{item.estado.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {canSeePayments && (
        <>
          <div
            className="extruded-card p-4 mb-4 d-flex flex-column align-items-center"
            style={{ minHeight: '160px' }}
          >
            <div className="glass-badge mb-3 text-center mx-auto d-flex align-items-center gap-2">
              Clientes Atrasados 
              {dashboardStats.clientes_atrasados ? (
                <span className="badge bg-danger rounded-pill">{dashboardStats.clientes_atrasados}</span>
              ) : null}
            </div>
            <div className="w-100 rounded flex-fill inner-dark-box p-2 overflow-auto" style={{ maxHeight: '300px' }}>
              {overdue.length === 0 ? (
                <div className="h-100 d-flex align-items-center justify-content-center text-white-50 small">
                  No hay clientes con atrasos detectados
                </div>
              ) : (
                <div className="row g-2">
                  {overdue.map((item) => (
                    <div key={item.id_cuota} className="col-md-6">
                      <div className="reference-box p-3 border-danger-subtle bg-danger-subtle-20">
                        <div className="d-flex justify-content-between align-items-start">
                          <strong className="text-white">{item.cliente}</strong>
                          <div className="text-end">
                            <div className="text-danger fw-bold">Q {formatMoney(item.monto)}</div>
                            {item.mora > 0 && <small className="text-warning">Mora: Q {formatMoney(item.mora)}</small>}
                          </div>
                        </div>
                        <div className="text-white-50 small mt-1">Venció: {item.fecha_vencimiento}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="extruded-card gold-solid-card h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center">
                <h6 className="fw-bold mb-2 text-dark">Capital Recaudado</h6>
                <h4 className="fw-bold mb-0 text-dark">Q {formatMoney(dashboardStats.capital_recaudado)}</h4>
              </div>
            </div>

            <div className="col-md-4">
              <div className="extruded-card h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center">
                <h6 className="fw-bold mb-2 text-white-50">Mora Recaudada</h6>
                <h4 className="fw-bold mb-0 text-white">Q {formatMoney(dashboardStats.mora_recaudada)}</h4>
              </div>
            </div>

            <div className="col-md-4">
              <div className="extruded-card h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center">
                <h6 className="fw-bold mb-2 text-white-50">
                  Ganancia Recaudada
                </h6>
                <h4 className="fw-bold mb-0 text-white">Q {formatMoney(dashboardStats.ganancia_recaudada)}</h4>
              </div>
            </div>
          </div>
        </>
      )}

      {canSeeLoanWorkflow && (
        <div className="extruded-card p-4 mb-4">
          <div className="row g-4 h-100">
            <div className="col-md-4">
              <div
                className="inner-dark-box h-100 d-flex flex-column align-items-center justify-content-start p-4 text-center"
                style={{ minHeight: '200px' }}
              >
                <button
                  className="btn-modern-dark mb-3 w-100"
                  type="button"
                  onClick={onOpenPendingPrequalification}
                >
                  Pendiente Precalificación
                </button>

                <div className="d-flex flex-column gap-2 w-100">
                  {pendingPrequalificationItems.length === 0 ? (
                    <span className="text-white-50 small">0 pendiente(s)</span>
                  ) : (
                    pendingPrequalificationItems.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="reference-box p-2 text-start w-100"
                        style={{ border: 'none' }}
                        onClick={onOpenPendingPrequalification}
                      >
                        <strong className="text-white d-block">
                          {item.cliente_nombre || 'Sin nombre'}
                        </strong>
                        <small className="text-white-50">
                          DPI: {item.cliente_dpi || '—'}
                        </small>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                className="inner-dark-box h-100 d-flex flex-column align-items-center justify-content-start p-4 text-center"
                style={{ minHeight: '200px' }}
              >
                <button
                  className="btn-modern-dark mb-3 w-100"
                  type="button"
                  onClick={onOpenPendingApproval}
                >
                  Pendiente Aprobación
                </button>

                <div className="d-flex flex-column gap-2 w-100">
                  {pendingApprovalItems.length === 0 ? (
                    <span className="text-white-50 small">0 pendiente(s)</span>
                  ) : (
                    pendingApprovalItems.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="reference-box p-2 text-start w-100"
                        style={{ border: 'none' }}
                        onClick={onOpenPendingApproval}
                      >
                        <strong className="text-white d-block">
                          {item.cliente_nombre || 'Sin nombre'}
                        </strong>
                        <small className="text-gold">
                          Q {formatMoney(item.monto_solicitado)}
                        </small>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {canSeeDisbursementCard && (
              <div className="col-md-4">
                <div
                  className="inner-dark-box border-gold-subtle h-100 d-flex flex-column align-items-center justify-content-start p-4 text-center"
                  style={{ minHeight: '200px' }}
                >
                  <button
                    className="btn-modern-dark mb-3 w-100"
                    type="button"
                    onClick={onOpenPendingDisbursement}
                  >
                    Pendiente Desembolso
                  </button>

                  <div className="d-flex flex-column gap-2 w-100">
                    {pendingDisbursementItems.length === 0 ? (
                      <span className="text-white-50 small">0 pendiente(s)</span>
                    ) : (
                      pendingDisbursementItems.slice(0, 3).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="reference-box p-2 text-start w-100"
                          style={{ border: 'none' }}
                          onClick={onOpenPendingDisbursement}
                        >
                          <strong className="text-white d-block">
                            {item.cliente_nombre || 'Sin nombre'}
                          </strong>
                          <small className="text-gold">
                            Q {formatMoney(item.monto_solicitado)}
                          </small>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(canSeeReports || canSeeCaja) && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-7">
              <div
                className="extruded-card gold-solid-card d-flex flex-column p-4"
                style={{ height: '350px' }}
              >
                <h6 className="fw-bold mb-3 text-dark">Rendimiento Mensual</h6>
                {canSeeReports ? (
                  <div className="flex-fill w-100" style={{ minHeight: 0 }}>
                    {reportsData && reportsData.rendimiento ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={reportsData.rendimiento} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" vertical={false} />
                          <XAxis dataKey="mes" stroke="rgba(0,0,0,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="rgba(0,0,0,0.5)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Q${val/1000}k`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => [`Q ${formatMoney(value)}`, '']}
                          />
                          <Bar dataKey="recaudado" name="Recaudado" fill="rgba(0,0,0,0.7)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          <Line type="monotone" dataKey="ganancia" name="Ganancia" stroke="#fff" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100 text-dark opacity-50">Cargando...</div>
                    )}
                  </div>
                ) : 'Resumen de Caja'}
              </div>
            </div>

            <div className="col-md-5">
              <div
                className="extruded-card d-flex flex-column p-4"
                style={{ height: '350px' }}
              >
                <h6 className="fw-bold mb-3 text-white">Distribución de Cartera</h6>
                {canSeeReports ? (
                  <div className="flex-fill w-100 d-flex align-items-center justify-content-center" style={{ minHeight: 0 }}>
                    {reportsData && reportsData.kpis ? (() => {
                      const pieData = [
                        { name: 'Capital Recuperado', value: reportsData.kpis.total_recaudado, color: CHART_COLORS.green },
                        { name: 'En Riesgo (Mora)', value: reportsData.kpis.total_mora || 0, color: CHART_COLORS.red },
                        { name: 'Capital Pendiente', value: Math.max(0, reportsData.kpis.total_desembolsado - reportsData.kpis.total_recaudado), color: CHART_COLORS.blue },
                      ];
                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `Q ${formatMoney(value)}`} contentStyle={{ backgroundColor: '#1a2234', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} itemStyle={{ color: '#fff' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })() : (
                      <div className="text-white-50">Cargando...</div>
                    )}
                  </div>
                ) : 'Historial de Caja'}
              </div>
            </div>
          </div>

          <div className="extruded-card p-4 w-100 mb-5">
            {canSeeReports ? (
              <div className="row g-4 text-center">
                <div className="col-md-3">
                  <p className="text-white-50 mb-1 small text-uppercase fw-bold tracking-wider">Créditos Activos</p>
                  <h3 className="text-white fw-bold mb-0">{reportsData?.kpis?.creditos_activos || 0}</h3>
                </div>
                <div className="col-md-3" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-white-50 mb-1 small text-uppercase fw-bold tracking-wider">Total Desembolsado</p>
                  <h3 className="text-white fw-bold mb-0">Q {formatMoney(reportsData?.kpis?.total_desembolsado || 0)}</h3>
                </div>
                <div className="col-md-3" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-gold mb-1 small text-uppercase fw-bold tracking-wider">Total Recaudado</p>
                  <h3 className="text-gold fw-bold mb-0">Q {formatMoney(reportsData?.kpis?.total_recaudado || 0)}</h3>
                </div>
                <div className="col-md-3" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-danger mb-1 small text-uppercase fw-bold tracking-wider">Total Mora</p>
                  <h3 className="text-danger fw-bold mb-0">Q {formatMoney(reportsData?.kpis?.total_mora || 0)}</h3>
                </div>
              </div>
            ) : (
              <div className="text-center text-white-50" style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Movimientos recientes</div>
            )}
          </div>
        </>
      )}
    </>
  )
}


function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<SessionUser | null>(() => storage.getUser())
  const [activeSection, setActiveSection] = useState<SectionKey>(() => {
    const saved = sessionStorage.getItem(DASHBOARD_SECTION_KEY) as SectionKey | null
    return saved ?? 'inicio'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationsRef = useRef<HTMLDivElement | null>(null)

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [pendingPrequalificationItems, setPendingPrequalificationItems] =
    useState<PendingPrequalificationItem[]>([])
  const [pendingApprovalItems, setPendingApprovalItems] =
    useState<PendingLoanItem[]>([])
  const [pendingDisbursementItems, setPendingDisbursementItems] =
    useState<PendingLoanItem[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    monto_recaudado: 0,
    capital_recaudado: 0,
    mora_recaudada: 0,
    ganancia_recaudada: 0,
    monto_por_recaudar_hoy: 0,
    clientes_ruta: 0,
    clientes_atrasados: 0,
  })
  const [reportsData, setReportsData] = useState<any>(null)
  const [dailyRoute, setDailyRoute] = useState<RouteItem[]>([])
  const [overdueClients, setOverdueClients] = useState<OverdueItem[]>([])

  useEffect(() => {
    const token = storage.getToken()

    if (!token || !user) {
      storage.clearSession()
      sessionStorage.removeItem(DASHBOARD_SECTION_KEY)
      sessionStorage.removeItem(LOANS_TAB_KEY)
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    sessionStorage.setItem(DASHBOARD_SECTION_KEY, activeSection)
  }, [activeSection])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!user) return

      const preqRequest = axios.get<PendingPrequalificationItem[]>(
        `${API_BASE_URL}/creditors/pending-prequalification/`,
        { headers: authHeaders() },
      )

      const loanRequest = axios.get<PendingLoanItem[]>(`${API_BASE_URL}/loans/pending/`, {
        headers: authHeaders(),
      })

      const disbursementRequest = axios.get<PendingLoanItem[]>(
        `${API_BASE_URL}/loans/pending-disbursement/`,
        { headers: authHeaders() },
      )

      const statsRequest = axios.get<DashboardStats>(
        `${API_BASE_URL}/loans/dashboard-stats/`,
        { headers: authHeaders() },
      ).catch(() => null)

      const dbNotificationsRequest = axios.get<DBNotification[]>(
        `${API_BASE_URL}/notifications/`,
        { headers: authHeaders() }
      ).catch(() => null)

      const reportsRequest = axios.get(
        `${API_BASE_URL}/reports/general/`,
        { headers: authHeaders() }
      ).catch(() => null)

      const dailyRouteRequest = axios.get<RouteItem[]>(
        `${API_BASE_URL}/loans/daily-route/`,
        { headers: authHeaders() }
      ).catch(() => null)

      const overdueRequest = axios.get<OverdueItem[]>(
        `${API_BASE_URL}/loans/overdue/`,
        { headers: authHeaders() }
      ).catch(() => null)

      const [preqResult, loanResult, disbursementResult, statsResult, dbNotifResult, reportsResult, routeResult, overdueResult] = await Promise.allSettled([
        preqRequest,
        loanRequest,
        disbursementRequest,
        statsRequest,
        dbNotificationsRequest,
        reportsRequest,
        dailyRouteRequest,
        overdueRequest
      ])

      if (cancelled) return

      const preqItems = (preqResult.status === 'fulfilled' && preqResult.value && 'data' in preqResult.value) ? preqResult.value.data || [] : []
      const loanItems = (loanResult.status === 'fulfilled' && loanResult.value && 'data' in loanResult.value) ? loanResult.value.data || [] : []
      const disbItems = (disbursementResult.status === 'fulfilled' && disbursementResult.value && 'data' in disbursementResult.value) ? disbursementResult.value.data || [] : []

      if (statsResult.status === 'fulfilled' && statsResult.value && 'data' in statsResult.value) {
        setDashboardStats(statsResult.value.data)
      }

      if (reportsResult.status === 'fulfilled' && reportsResult.value && 'data' in reportsResult.value) {
        setReportsData(reportsResult.value.data)
      }

      const dbNotifItems = (dbNotifResult.status === 'fulfilled' && dbNotifResult.value && 'data' in dbNotifResult.value)
        ? dbNotifResult.value.data
        : []

      setPendingPrequalificationItems(preqItems)
      setPendingApprovalItems(loanItems)
      setPendingDisbursementItems(disbItems)

      if (routeResult.status === 'fulfilled' && routeResult.value && 'data' in routeResult.value) {
        setDailyRoute(routeResult.value.data || [])
      }

      if (overdueResult.status === 'fulfilled' && overdueResult.value && 'data' in overdueResult.value) {
        setOverdueClients(overdueResult.value.data || [])
      }

      const combinedNotifications: NotificationItem[] = [
        ...dbNotifItems.map((n: DBNotification) => ({
          id: `db-${n.id}`,
          kind: (['precalificacion', 'prestamo', 'desembolso'].includes(n.tipo) ? n.tipo : 'alerta') as NotificationItem['kind'],
          title: n.titulo,
          subtitle: n.mensaje
        })),
        ...preqItems.slice(0, 5).map((item) => ({
          id: `pre-${item.id}`,
          kind: 'precalificacion' as const,
          title: `Nuevo cliente: ${item.cliente_nombre || 'Sin nombre'}`,
          subtitle: `Pendiente de precalificación • DPI: ${item.cliente_dpi || '—'
            }`,
        })),
        ...loanItems.slice(0, 5).map((item) => ({
          id: `loan-${item.id}`,
          kind: 'prestamo' as const,
          title: `Préstamo #${item.id}`,
          subtitle: `${item.cliente_nombre} • Q ${formatMoney(item.monto_solicitado)}`,
        })),
        ...disbItems.slice(0, 5).map((item) => ({
          id: `disb-${item.id}`,
          kind: 'desembolso' as const,
          title: `Desembolso #${item.id}`,
          subtitle: `${item.cliente_nombre} • Q ${formatMoney(item.monto_solicitado)}`,
        })),
      ]

      setNotifications(combinedNotifications)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) return null

  const displayName =
    user.full_name ||
    `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() ||
    user.username ||
    'Usuario'

  const displayRole = user.role || 'Sin rol'

  const can: CanAccess = (required) => hasPermission(user, required)
  const roleLower = displayRole.trim().toLowerCase()
  const isSecretaryRole = roleLower === 'secretaria'
  const isAdminRole = ['administrador', 'admin', 'gerente'].includes(roleLower)

  const openLoansSection = (
    tab: 'nueva' | 'solicitudes' | 'desembolsos' | 'simulador' | 'planes',
    pendingSection?: 'clientes' | 'prestamos',
  ) => {
    sessionStorage.setItem(LOANS_TAB_KEY, tab)
    if (pendingSection) {
      sessionStorage.setItem(LOANS_PENDING_SECTION_KEY, pendingSection)
    }
    setActiveSection('prestamos')
    setMobileMenuOpen(false)
    setShowNotifications(false)
  }

  const sections: SectionItem[] = [
    {
      key: 'inicio',
      label: 'INICIO',
      visible: true,
    },
    {
      key: 'clientes',
      label: 'CLIENTES',
      visible: can([
        'crear_cliente',
        'buscar_cliente',
        'ver_cliente',
        'validar_lista_negra',
        'ver_lista_negra',
        'crear_acreedor',
        'buscar_acreedor',
      ]),
    },
    {
      key: 'portafolio',
      label: 'PORTAFOLIO',
      visible: can([
        'crear_cartera',
        'editar_cartera',
        'ver_cartera',
        'asignar_cliente_cartera',
        'asignar_acreedor_cartera',
      ]),
    },
    {
      key: 'prestamos',
      label: 'PRÉSTAMOS',
      visible: can([
        'crear_prestamo',
        'aprobar_acreedor_precalificacion',
        'aprobar_acreedor_final',
        'autorizar_desembolso',
        'ver_solicitudes_globales',
        'crear_planes_cobro',
        'crear_plan_pago',
        'ver_prestamo',
        'simulador_pagos',
      ]),
    },
    {
      key: 'asesores',
      label: 'ASESORES',
      visible:
        !isSecretaryRole &&
        can([
          'transferir_cartera_entre_asesores',
          'crear_cuentas_asesores',
          'ver_usuario',
        ]),
    },
    {
      key: 'pagos',
      label: 'PAGOS',
      visible: can([
        'registrar_pago_cartera_propia',
        'registrar_pago_cualquier_acreedor',
        'ver_cobros_dia_propio',
        'registrar_pago',
        'ver_pago',
      ]),
    },
    {
      key: 'caja',
      label: 'CAJA',
      visible:
        !isSecretaryRole &&
        can([
          'ingresar_recaudo_caja',
          'aprobar_recaudo_caja',
          'ver_historial_caja_fuerte',
          'registrar_egresos_caja_fuerte',
          'gestionar_caja',
          'ver_caja',
        ]),
    },
    {
      key: 'reportes',
      label: 'REPORTES',
      visible: isAdminRole && can([
        'reportes_cartera_global',
        'reportes_rendimiento_todos_asesores',
        'ver_cobros_globales',
        'ver_reportes',
      ]),
    },
    {
      key: 'bitacora',
      label: 'BITÁCORA SISTEMA',
      visible: isAdminRole && can(['bitacora_sistema_lectura', 'ver_bitacora']),
    },
  ]

  const visibleSections = sections.filter((section) => section.visible)

  const safeActiveSection: SectionKey =
    activeSection === 'perfil'
      ? 'perfil'
      : visibleSections.some((section) => section.key === activeSection)
        ? activeSection
        : visibleSections[0]?.key ?? 'inicio'

  const handleLogout = () => {
    storage.clearSession()
    sessionStorage.removeItem(DASHBOARD_SECTION_KEY)
    sessionStorage.removeItem(LOANS_TAB_KEY)
    setShowNotifications(false)
    navigate('/login', { replace: true })
  }

  const handleSectionChange = (section: SectionKey) => {
    if (section === 'perfil') {
      setActiveSection('perfil')
      setMobileMenuOpen(false)
      setShowNotifications(false)
      return
    }

    const found = sections.find((s) => s.key === section)
    if (!found?.visible) return

    setActiveSection(section)
    setMobileMenuOpen(false)
    setShowNotifications(false)
  }

  const handleNotificationClick = (item: NotificationItem) => {
    if (item.kind === 'precalificacion') {
      openLoansSection('solicitudes', 'clientes')
      return
    }

    if (item.kind === 'desembolso') {
      openLoansSection('desembolsos')
      return
    }

    openLoansSection('solicitudes', 'prestamos')
  }

  const renderContent = () => {
    switch (safeActiveSection) {
      case 'perfil':
        return (
          <UserProfile
            user={user}
            onUserChange={setUser}
            onOpenPortfolio={() => setActiveSection('portafolio')}
            onOpenRoute={() => setActiveSection('inicio')}
          />
        )

      case 'clientes':
        return <CreditorsPage user={user} />

      case 'prestamos':
        return <LoansPage user={user} />

      case 'portafolio':
        return <PortafolioPage user={user} />

      case 'asesores':
        return <AdvisorPage user={user} />

      case 'pagos':
        return <PaymentsPage />

      case 'caja':
        return <VaultPage />

      case 'reportes':
        return <ReportsPage />

      case 'bitacora':
        return <LogsPage />

      case 'inicio':
      default:
        return (
          <DashboardHome
            displayName={displayName}
            displayRole={displayRole}
            can={can}
            pendingPrequalificationItems={pendingPrequalificationItems}
            pendingApprovalItems={pendingApprovalItems}
            pendingDisbursementItems={pendingDisbursementItems}
            onOpenPendingPrequalification={() =>
              openLoansSection('solicitudes', 'clientes')
            }
            onOpenPendingApproval={() =>
              openLoansSection('solicitudes', 'prestamos')
            }
            onOpenPendingDisbursement={() => openLoansSection('desembolsos')}
            dashboardStats={dashboardStats}
            reportsData={reportsData}
            dailyRoute={dailyRoute}
            overdueClients={overdueClients}
          />
        )
    }
  }

  return (
    <div className="vh-100 d-flex overflow-hidden dashboard-container">
      <button
        className="d-md-none position-fixed mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        type="button"
      >
        ☰
      </button>

      {mobileMenuOpen && (
        <div
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`sidebar d-flex flex-column flex-shrink-0 p-3 h-100 ${mobileMenuOpen ? 'mobile-sidebar-open' : ''
          }`}
      >
        <div
          className="profile-link d-flex align-items-center mb-5 mt-2 p-2 rounded-3 transition-all"
          role="button"
          title="Ver perfil"
          onClick={() => handleSectionChange('perfil')}
        >
          <div className="user-avatar d-flex align-items-center justify-content-center rounded-circle me-3 shadow-sm overflow-hidden">
            {user.ruta_foto_perfil ? (
              <img
                src={buildApiFileUrl(user.ruta_foto_perfil) || ''}
                alt="Foto de perfil"
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#ffffff" />
                <path
                  d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                  stroke="#ffffff"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </div>
          <div className="d-flex flex-column">
            <h5 className="text-white mb-0 fw-bold" style={{ fontSize: '1.1rem' }}>
              {displayName}
            </h5>
            <span style={{ fontSize: '0.75rem', color: '#cca641' }}>
              {displayRole}
            </span>
          </div>
        </div>

        <div className="nav flex-column gap-2 px-2 flex-fill">
          {visibleSections.map((section) => (
            <button
              key={section.key}
              className={`nav-btn ${safeActiveSection === section.key ? 'active' : ''}`}
              onClick={() => handleSectionChange(section.key)}
              type="button"
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="px-2 mt-auto pb-3">
          <button
            className="nav-btn btn-logout d-flex align-items-center gap-2"
            type="button"
            onClick={handleLogout}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      <div className="main-panel d-flex flex-column flex-fill w-100 position-relative" style={{ zIndex: 20 }}>
        <div className="top-navbar d-flex align-items-center px-4">
          <div className="flex-fill d-flex justify-content-center">
            <div
              className="input-custom mx-auto shadow-sm"
              style={{ width: '100%', maxWidth: '400px' }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="me-2 text-white-50"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="21"
                  y1="21"
                  x2="16.65"
                  y2="16.65"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <input type="text" placeholder="Buscar cliente por DPI o Nombre..." />
            </div>
          </div>

          <div className="ms-3 position-relative" ref={notificationsRef}>
            <button
              className="btn btn-link p-0 text-white text-decoration-none notification-btn position-relative"
              type="button"
              id="dropdownNotificaciones"
              aria-expanded={showNotifications}
              aria-haspopup="true"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <div className="notification-icon-container d-flex align-items-center justify-content-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {notifications.length > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle p-1 border border-dark rounded-circle alert-dot"></span>
                )}
              </div>
            </button>

            {showNotifications && (
              <ul
                className="dropdown-menu dropdown-menu-end glass-dropdown shadow-lg mt-2 show"
                aria-labelledby="dropdownNotificaciones"
                style={{
                  display: 'block',
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  zIndex: 9999,
                  minWidth: '320px',
                }}
              >
                <li className="dropdown-header text-white border-bottom border-secondary pb-2 mb-2 fw-bold">
                  Notificaciones Recientes
                </li>

                {notifications.length === 0 ? (
                  <li>
                    <span className="dropdown-item py-2 text-white-50">
                      Sin notificaciones nuevas.
                    </span>
                  </li>
                ) : (
                  notifications.map((item) => (
                    <li key={item.id}>
                      <button
                        className="dropdown-item py-2"
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                      >
                        <div className="fw-bold">{item.title}</div>
                        <div className="small text-white-50">{item.subtitle}</div>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="content-area flex-fill overflow-auto p-4 p-lg-5">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
