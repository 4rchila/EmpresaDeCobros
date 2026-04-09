import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './dashboard.css'
import { hasPermission, storage, type SessionUser } from '../../lib'
import CreditorsPage from '../creditors/CreditorsPage'

type SectionKey =
  | 'inicio'
  | 'acreedores'
  | 'prestamos'
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

function DashboardHome({
  displayName,
  displayRole,
  can,
}: {
  displayName: string
  displayRole: string
  can: CanAccess
}) {
  const canSeePayments = can([
    'registrar_pago_cartera_propia',
    'registrar_pago_cualquier_acreedor',
    'ver_cobros_dia_propio',
  ])
  const canSeeRoute = can('ruta_cobro_propia')
  const canSeeCaja = can([
    'ingresar_recaudo_caja',
    'aprobar_recaudo_caja',
    'registrar_egresos_caja_fuerte',
    'ver_historial_caja_fuerte',
  ])
  const canSeeLoanWorkflow = can([
    'aprobar_acreedor_precalificacion',
    'aprobar_acreedor_final',
    'autorizar_desembolso',
    'ver_solicitudes_globales',
    'crear_planes_cobro',
  ])
  const canSeeReports = can([
    'reportes_cartera_global',
    'reportes_rendimiento_todos_asesores',
    'ver_cobros_globales',
  ])

  const hasWidgets =
    canSeePayments || canSeeRoute || canSeeCaja || canSeeLoanWorkflow || canSeeReports

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
            Tu usuario inició sesión correctamente, pero no tiene widgets visibles en el dashboard.
          </p>
        </div>
      )}

      {(canSeePayments || canSeeRoute) && (
        <div className="row g-4 mb-4">
          {canSeePayments && (
            <div className="col-md-5 d-flex flex-column gap-4">
              <div className="extruded-card d-flex flex-column align-items-center justify-content-center p-4 h-100">
                <button className="btn-gold-action mb-4 w-75" type="button">
                  Monto Recaudado
                </button>

                <div className="amount-display d-flex align-items-center justify-content-center gap-3">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2">
                    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                    <circle cx="12" cy="12" r="2"></circle>
                    <path d="M16 6v12M8 6v12" strokeOpacity="0.3"></path>
                  </svg>
                  <span className="fw-bold" style={{ fontSize: '2.2rem', color: '#fff', letterSpacing: '1px' }}>
                    Q 12,589.00
                  </span>
                </div>
              </div>
            </div>
          )}

          {canSeeRoute && (
            <div className={canSeePayments ? 'col-md-7' : 'col-12'}>
              <div className="extruded-card h-100 d-flex flex-column p-4">
                <div className="w-100 d-flex justify-content-center position-relative mb-3">
                  <div className="glass-badge mx-auto text-center">Ruta del Día</div>
                  <span
                    className="position-absolute end-0 top-50 translate-middle-y link-hover"
                    style={{ fontSize: '0.85rem', color: '#cca641', cursor: 'pointer' }}
                  >
                    Ver mapa completo
                  </span>
                </div>
                <div className="w-100 rounded flex-fill inner-dark-box mt-2"></div>
              </div>
            </div>
          )}
        </div>
      )}

      {canSeePayments && (
        <>
          <div className="extruded-card p-4 mb-4 d-flex flex-column align-items-center" style={{ minHeight: '160px' }}>
            <div className="glass-badge mb-3 text-center mx-auto">Clientes Atrasados</div>
            <div className="w-100 rounded flex-fill inner-dark-box"></div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="extruded-card gold-solid-card h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center">
                <h6 className="fw-bold mb-2 text-dark">Capital Recaudado</h6>
                <h4 className="fw-bold mb-0 text-dark">Q 1200.00</h4>
              </div>
            </div>

            <div className="col-md-4">
              <div className="extruded-card h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center">
                <h6 className="fw-bold mb-2 text-white-50">Mora Recaudada</h6>
                <h4 className="fw-bold mb-0 text-white">Q 250.00</h4>
              </div>
            </div>

            <div className="col-md-4">
              <div className="extruded-card h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center">
                <h6 className="fw-bold mb-2 text-white-50">Ganancia Recaudada</h6>
                <h4 className="fw-bold mb-0 text-white">Q 600.00</h4>
              </div>
            </div>
          </div>
        </>
      )}

      {canSeeLoanWorkflow && (
        <div className="extruded-card p-4 mb-4">
          <div className="row g-4 h-100">
            {can('aprobar_acreedor_precalificacion') && (
              <div className="col-md-4">
                <div className="inner-dark-box h-100 d-flex flex-column align-items-center justify-content-start p-4 text-center" style={{ minHeight: '200px' }}>
                  <button className="btn-modern-dark mb-3 w-100" type="button">
                    Pendiente Precalificación
                  </button>
                </div>
              </div>
            )}

            {can('aprobar_acreedor_final') && (
              <div className="col-md-4">
                <div className="inner-dark-box h-100 d-flex flex-column align-items-center justify-content-start p-4 text-center" style={{ minHeight: '200px' }}>
                  <button className="btn-modern-dark mb-3 w-100" type="button">
                    Pendiente Aprobación
                  </button>
                </div>
              </div>
            )}

            {can('autorizar_desembolso') && (
              <div className="col-md-4">
                <div className="inner-dark-box border-gold-subtle h-100 d-flex flex-column align-items-center justify-content-start p-4 text-center" style={{ minHeight: '200px' }}>
                  <button className="btn-modern-dark mb-3 w-100" type="button">
                    Pendiente Desembolso
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(canSeeReports || canSeeCaja) && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="extruded-card gold-solid-card d-flex align-items-center justify-content-center text-dark fw-bold" style={{ height: '300px' }}>
                {canSeeReports ? 'Gráfica de Rendimiento' : 'Resumen de Caja'}
              </div>
            </div>

            <div className="col-md-6">
              <div className="extruded-card d-flex align-items-center justify-content-center text-white-50" style={{ height: '300px' }}>
                {canSeeReports ? 'Gráfica de Cartera' : 'Historial de Caja'}
              </div>
            </div>
          </div>

          <div className="extruded-card d-flex align-items-center justify-content-center text-white-50 w-100 mb-5" style={{ height: '250px' }}>
            {canSeeReports ? 'Reporte consolidado' : 'Movimientos recientes'}
          </div>
        </>
      )}
    </>
  )
}

function PlaceholderModule({ title }: { title: string }) {
  return (
    <div className="extruded-card p-4">
      <h3 className="text-white mb-3">{title}</h3>
      <p className="text-white-50 mb-0">Este módulo está en construcción.</p>
    </div>
  )
}

function DashboardPage() {
  const navigate = useNavigate()
  const [user] = useState<SessionUser | null>(() => storage.getUser())
  const [activeSection, setActiveSection] = useState<SectionKey>('inicio')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const token = storage.getToken()

    if (!token || !user) {
      storage.clearSession()
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  const displayName =
    user?.full_name ||
    `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() ||
    user?.username ||
    'Usuario'

  const displayRole = user?.role || 'Sin rol'

  const can: CanAccess = (required) => hasPermission(user, required)

  const sections: SectionItem[] = [
    {
      key: 'inicio',
      label: 'INICIO',
      visible: true,
    },
    {
      key: 'acreedores',
      label: 'ACREEDORES',
      visible: can([
        'crear_acreedor',
        'buscar_acreedor',
        'validar_lista_negra',
        'ver_lista_negra',
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
      ]),
    },
    {
      key: 'pagos',
      label: 'PAGOS',
      visible: can([
        'registrar_pago_cartera_propia',
        'registrar_pago_cualquier_acreedor',
        'ver_cobros_dia_propio',
      ]),
    },
    {
      key: 'caja',
      label: 'CAJA FUERTE',
      visible: can([
        'ingresar_recaudo_caja',
        'aprobar_recaudo_caja',
        'ver_historial_caja_fuerte',
        'registrar_egresos_caja_fuerte',
      ]),
    },
    {
      key: 'reportes',
      label: 'REPORTES',
      visible: can([
        'reportes_cartera_global',
        'reportes_rendimiento_todos_asesores',
        'ver_cobros_globales',
      ]),
    },
    {
      key: 'bitacora',
      label: 'BITÁCORA SISTEMA',
      visible: can('bitacora_sistema_lectura'),
    },
  ]

  const visibleSections = sections.filter((section) => section.visible)

  const safeActiveSection: SectionKey =
    visibleSections.some((section) => section.key === activeSection)
      ? activeSection
      : visibleSections[0]?.key ?? 'inicio'

  const handleLogout = () => {
    storage.clearSession()
    navigate('/login', { replace: true })
  }

  const handleSectionChange = (section: SectionKey) => {
    const found = sections.find((s) => s.key === section)
    if (!found?.visible) return

    setActiveSection(section)
    setMobileMenuOpen(false)
  }

  const renderContent = () => {
    switch (safeActiveSection) {
      case 'acreedores':
        return <CreditorsPage user={user} />

      case 'prestamos':
        return <PlaceholderModule title="Préstamos" />

      case 'pagos':
        return <PlaceholderModule title="Pagos" />

      case 'caja':
        return <PlaceholderModule title="Caja Fuerte" />

      case 'reportes':
        return <PlaceholderModule title="Reportes" />

      case 'bitacora':
        return <PlaceholderModule title="Bitácora del Sistema" />

      case 'inicio':
      default:
        return <DashboardHome displayName={displayName} displayRole={displayRole} can={can} />
    }
  }

  if (!user) return null

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
        className={`sidebar d-flex flex-column flex-shrink-0 p-3 h-100 ${
          mobileMenuOpen ? 'mobile-sidebar-open' : ''
        }`}
      >
        <div
          className="profile-link d-flex align-items-center mb-5 mt-2 p-2 rounded-3 transition-all"
          role="button"
          title="Ver perfil"
        >
          <div className="user-avatar d-flex align-items-center justify-content-center rounded-circle me-3 shadow-sm">
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
          </div>
          <div className="d-flex flex-column">
            <h5 className="text-white mb-0 fw-bold" style={{ fontSize: '1.1rem' }}>
              {displayName}
            </h5>
            <span style={{ fontSize: '0.75rem', color: '#cca641' }}>{displayRole}</span>
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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      <div className="main-panel d-flex flex-column flex-fill w-100 position-relative z-1">
        <div className="top-navbar d-flex align-items-center px-4">
          <div className="flex-fill d-flex justify-content-center">
            <div className="input-custom mx-auto shadow-sm" style={{ width: '100%', maxWidth: '400px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="me-2 text-white-50">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
              </svg>
              <input type="text" placeholder="Buscar cliente por DPI o Nombre..." />
            </div>
          </div>

          <div className="dropdown ms-3">
            <button
              className="btn btn-link p-0 text-white text-decoration-none notification-btn position-relative"
              type="button"
              id="dropdownNotificaciones"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div className="notification-icon-container d-flex align-items-center justify-content-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span className="position-absolute top-0 start-100 translate-middle p-1 border border-dark rounded-circle alert-dot"></span>
              </div>
            </button>

            <ul className="dropdown-menu dropdown-menu-end glass-dropdown shadow-lg mt-2" aria-labelledby="dropdownNotificaciones">
              <li className="dropdown-header text-white border-bottom border-secondary pb-2 mb-2 fw-bold">
                Notificaciones Recientes
              </li>
              <li><a className="dropdown-item py-2" href="#">Cliente Juan Pérez atrasado</a></li>
              <li><a className="dropdown-item py-2" href="#">Préstamo aprobado a María López</a></li>
              <li><hr className="dropdown-divider border-secondary my-2" /></li>
              <li><a className="dropdown-item py-2 text-center text-gold fw-bold" href="#">Ver todas</a></li>
            </ul>
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
