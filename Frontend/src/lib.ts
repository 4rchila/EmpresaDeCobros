import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export type SessionUser = {
  id: number
  username: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  role: string
  permissions: string[]
}

export type LoginResponse = {
  access: string
  refresh: string
  user: Partial<SessionUser> & {
    id: number
    email: string
    role: string
    permissions?: string[]
    full_name?: string
    first_name?: string
    last_name?: string
  }
}

type MeResponse =
  | SessionUser
  | (Partial<SessionUser> & {
      id: number
      email: string
      role: string
      permissions?: string[]
      full_name?: string
      first_name?: string
      last_name?: string
    })

const normalizeUser = (raw: Partial<SessionUser> | null | undefined): SessionUser | null => {
  if (!raw || typeof raw.id !== 'number' || !raw.role) {
    return null
  }

  const email = raw.email ?? ''
  const username = raw.username?.trim() || email || `user-${raw.id}`

  return {
    id: raw.id,
    username,
    first_name: raw.first_name ?? '',
    last_name: raw.last_name ?? '',
    full_name:
      raw.full_name?.trim() ||
      `${raw.first_name ?? ''} ${raw.last_name ?? ''}`.trim() ||
      username,
    email,
    role: raw.role,
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
  }
}

export const storage = {
  getToken: () => sessionStorage.getItem('token'),
  getRefreshToken: () => sessionStorage.getItem('refreshToken'),
  getUser: (): SessionUser | null => {
    const raw = sessionStorage.getItem('user')
    if (!raw) return null

    try {
      return normalizeUser(JSON.parse(raw) as SessionUser)
    } catch {
      return null
    }
  },
  saveUser: (user: SessionUser) => {
    sessionStorage.setItem('role', user.role)
    sessionStorage.setItem('user', JSON.stringify(user))
  },
  saveSession: (payload: LoginResponse) => {
    const normalizedUser = normalizeUser(payload.user)
    if (!normalizedUser) {
      throw new Error('La respuesta del login no contiene un usuario válido.')
    }

    sessionStorage.setItem('token', payload.access)
    sessionStorage.setItem('refreshToken', payload.refresh)
    storage.saveUser(normalizedUser)
  },
  clearSession: () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('refreshToken')
    sessionStorage.removeItem('role')
    sessionStorage.removeItem('user')
  },
}

export const authHeaders = () => {
  const token = storage.getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function ensureSessionUser(): Promise<SessionUser | null> {
  const token = storage.getToken()
  if (!token) {
    storage.clearSession()
    return null
  }

  try {
    const { data } = await axios.get<MeResponse>(`${API_BASE_URL}/users/me/`, {
      headers: authHeaders(),
    })

    const normalizedUser = normalizeUser(data)

    if (!normalizedUser) {
      storage.clearSession()
      return null
    }

    storage.saveUser(normalizedUser)
    return normalizedUser
  } catch {
    storage.clearSession()
    return null
  }
}

const ADMIN_ROLES = new Set(['administrador', 'admin', 'gerente'])

const PERMISSION_ALIASES: Record<string, string[]> = {
  // acreedores
  ver_acreedores_globales: ['ver_acreedor'],
  crear_cuentas_asesores: ['crear_usuario'],

  // lista negra
  asignar_lista_negra: ['agregar_lista_negra'],

  // préstamos / aprobación
  aprobar_acreedor_precalificacion: ['aprobar_prestamo'],
  aprobar_acreedor_final: ['aprobar_prestamo'],
  autorizar_desembolso: ['aprobar_prestamo'],
  ver_solicitudes_globales: ['ver_prestamo'],
  crear_planes_cobro: ['crear_plan_pago', 'generar_cuotas'],

  // pagos
  registrar_pago_cartera_propia: ['registrar_pago'],
  registrar_pago_cualquier_acreedor: ['registrar_pago'],
  ver_cobros_dia_propio: ['ver_pago'],
  ver_cobros_globales: ['ver_reportes', 'ver_pago'],

  // caja
  ingresar_recaudo_caja: ['registrar_pago'],
  aprobar_recaudo_caja: ['aprobar_prestamo'],
  registrar_egresos_caja_fuerte: ['ver_reportes'],
  ver_historial_caja_fuerte: ['ver_reportes'],

  // reportes
  reportes_cartera_global: ['ver_reportes'],
  reportes_rendimiento_todos_asesores: ['ver_reportes'],

  // ruta / apoyo visual
  ruta_cobro_propia: ['ver_plan_pago', 'ver_prestamo'],
  ver_cumpleanios_y_prestamos: ['ver_prestamo'],

  // bitácora
  bitacora_sistema_lectura: ['ver_registro_creacion_usuario'],
}

function resolvePermissions(user: SessionUser | null | undefined): Set<string> {
  const resolved = new Set<string>(user?.permissions ?? [])

  for (const [expected, aliases] of Object.entries(PERMISSION_ALIASES)) {
    if (resolved.has(expected)) continue
    if (aliases.some((alias) => resolved.has(alias))) {
      resolved.add(expected)
    }
  }

  return resolved
}
function isDeniedByRole(role: string, permission: string): boolean {
  const deniedForSecretaria = new Set([
    'ver_lista_negra',
    'validar_lista_negra',
    'asignar_lista_negra',
    'ver_historial_caja_fuerte',
    'registrar_egresos_caja_fuerte',
    'bitacora_sistema_lectura',
    'reportes_cartera_global',
    'reportes_rendimiento_todos_asesores',
    'ver_cobros_globales',
  ])

  const deniedForAsesor = new Set([
    'ver_lista_negra',
    'validar_lista_negra',
    'asignar_lista_negra',
    'ver_historial_caja_fuerte',
    'registrar_egresos_caja_fuerte',
    'aprobar_recaudo_caja',
    'bitacora_sistema_lectura',
    'reportes_cartera_global',
    'reportes_rendimiento_todos_asesores',
    'ver_cobros_globales',
  ])

  if (role === 'secretaria') {
    return deniedForSecretaria.has(permission)
  }

  if (role === 'asesor') {
    return deniedForAsesor.has(permission)
  }

  return false
}

export function hasPermission(
  user: SessionUser | null | undefined,
  required: string | string[],
): boolean {
  if (!user) return false

  const role = user.role?.trim().toLowerCase() ?? ''

  if (ADMIN_ROLES.has(role)) {
    return true
  }

  const permissions = resolvePermissions(user)

  if (Array.isArray(required)) {
    return required.some((permission) => {
      if (isDeniedByRole(role, permission)) return false
      return permissions.has(permission)
    })
  }

  if (isDeniedByRole(role, required)) {
    return false
  }

  return permissions.has(required)
}

export function hasAllPermissions(
  user: SessionUser | null | undefined,
  required: string[],
): boolean {
  if (!user) return false

  const role = user.role?.trim().toLowerCase() ?? ''
  if (ADMIN_ROLES.has(role)) {
    return true
  }

  const permissions = resolvePermissions(user)
  return required.every((permission) => permissions.has(permission))
}