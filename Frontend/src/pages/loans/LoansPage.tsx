import './loan.css'
import '../dashboard/dashboard.css'
import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import {
  API_BASE_URL,
  authHeaders,
  hasPermission,
  type SessionUser,
} from '../../lib'

interface Garantia {
  descripcion: string
  categoria: string
  categoriaOtro: string
  valorEstimado: string
  estadoGeneral: string
  estadoEspecifico: string
  observaciones: string
  fotos: { tipo: string; archivo: File | null }[]
}

const crearGarantiaVacia = (): Garantia => ({
  descripcion: '',
  categoria: '',
  categoriaOtro: '',
  valorEstimado: '',
  estadoGeneral: '',
  estadoEspecifico: '',
  observaciones: '',
  fotos: [{ tipo: 'frontal', archivo: null }],
})

type LoansTabKey =
  | 'nueva'
  | 'solicitudes'
  | 'desembolsos'
  | 'simulador'
  | 'planes'

type LoansPageProps = {
  user: SessionUser | null
}

type ClienteBusqueda = {
  id: number
  nombre_completo: string
  nombres: string
  apellidos: string
  dpi: string | null
  nit: string | null
  direccion: string | null
  municipio: string | null
  distrito: string | null
  departamento: string | null
  estado_cliente: string
  fecha_registro: string
  telefonos: Array<{
    id: number
    numero: string
    orden: number
    tipo: string | null
  }>
  en_lista_negra: boolean
  asesor_nombre: string | null
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

type PendingPrequalificationDetail = {
  id: number
  fecha_generacion: string
  observaciones: string | null
  estado_revision: string
  usuario_creador_id: number | null
  usuario_creador_nombre: string | null
  cliente: {
    id: number
    nombre_completo: string
    nombres: string
    apellidos: string
    dpi: string | null
    nit: string | null
    fecha_nacimiento: string | null
    direccion: string | null
    departamento: string | null
    municipio: string | null
    distrito: string | null
    ingresos_mensuales: string | null
    egreso_aproximado_mensual: string | null
    estado_cliente: string
    fecha_registro: string
    asesor_id: number | null
    asesor_nombre: string | null
    cartera_id: number | null
    cartera_nombre: string | null
  }
  telefonos: Array<{
    id: number
    numero: string
    orden: number
    tipo: string | null
  }>
  informacion_laboral: {
    lugar_trabajo: string | null
    direccion_trabajo: string | null
    puesto: string | null
    tiempo_laborando: string | null
    ingreso_mensual: string | null
    egreso_mensual: string | null
    otras_fuentes_ingreso: string | null
    foto_recibo_luz: string | null
  } | null
  referencias: Array<{
    id: number
    nombres: string
    telefono: string | null
    parentesco: string | null
    direccion: string | null
  }>
  fotos: Array<{
    id: number
    ruta_archivo: string
    descripcion: string | null
  }>
}

type PrestamoItem = {
  id: number
  cliente_nombre: string
  cliente_dpi: string | null
  plan_nombre: string | null
  periodicidad: string | null
  numero_cuotas: number | null
  monto_solicitado: string
  interes: string
  destino_uso: string | null
  fecha_solicitud: string
  fecha_aprobacion: string | null
  fecha_desembolso: string | null
  estado_flujo: string
}


type PrestamoGarantiaFoto = {
  id?: number
  ruta_archivo?: string | null
  descripcion?: string | null
  es_principal?: boolean | null
}

type PrestamoGarantiaDetalle = {
  id?: number
  descripcion?: string | null
  tipo_garantia?: string | null
  valor_estimado?: string | number | null
  estado_garantia?: string | null
  fotos?: PrestamoGarantiaFoto[]
}

type PrestamoDetalle = PrestamoItem & {
  cliente_telefono?: string | null
  monto_total?: string | number | null
  total_pagar?: string | number | null
  mora?: string | number | null
  garantias?: PrestamoGarantiaDetalle[]
  cliente_informacion_laboral?: {
    foto_recibo_luz: string | null
  } | null
  cliente_fotos?: Array<{
    id: number
    ruta_archivo: string
    descripcion: string | null
  }>
}

function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed-top w-100 h-100 d-flex align-items-center justify-content-center animate-fade-in"
      style={{
        zIndex: 2147483647,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="position-relative"
        style={{ maxWidth: '90%', maxHeight: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn-modern-dark position-absolute"
          style={{
            top: '-40px',
            right: '-10px',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={onClose}
        >
          ×
        </button>
        <img
          src={src}
          alt="Preview"
          className="img-fluid rounded shadow-lg"
          style={{
            maxHeight: '85vh',
            objectFit: 'contain',
            border: '2px solid rgba(204, 166, 65, 0.3)',
          }}
        />
      </div>
    </div>
  )
}

type PlanItem = {
  id: number
  nombre_plan: string
  periodicidad: string | null
  numero_cuotas: number
  interes: string
  mora: string
  monto_base: string
  estado: string
}

type SimulacionResponse = {
  monto: string
  interes: string
  mora: string
  numero_cuotas: number
  total_interes: string
  total_sin_mora: string
  mora_estimada: string
  total_con_mora: string
  cuota_estimada: string
}

type UploadedGarantiaPhoto = {
  ruta_archivo: string
  descripcion?: string | null
  es_principal?: boolean
}

type TabItem = {
  key: LoansTabKey
  label: string
  visible: boolean
}

const LOANS_TAB_KEY = 'dashboard_loans_tab'
const LOANS_PENDING_SECTION_KEY = 'dashboard_loans_pending_section'

function formatMoney(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0)
  return amount.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parsePositiveNumber(value: string | number): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function isPositiveNumber(value: string | number): boolean {
  return parsePositiveNumber(value) > 0
}

function isPositiveInteger(value: string | number): boolean {
  const amount = parsePositiveNumber(value)
  return Number.isInteger(amount) && amount > 0
}

function getErrorDetail(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }
  }
  return fallback
}

async function uploadGarantiaPhoto(
  file: File,
  tipo: string,
  esPrincipal: boolean,
): Promise<UploadedGarantiaPhoto> {
  const formData = new FormData()
  formData.append('archivo', file)
  formData.append('descripcion', tipo)
  formData.append('es_principal', String(esPrincipal))

  const { data } = await axios.post<UploadedGarantiaPhoto>(
    `${API_BASE_URL}/loans/upload-garantia-photo/`,
    formData,
    {
      headers: {
        ...authHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return data
}

function LoansPage({ user }: LoansPageProps) {
  const roleLower = user?.role?.trim().toLowerCase() ?? ''
  const isSecretary = roleLower === 'secretaria'
  const isAdvisor = roleLower === 'asesor'
  const isAdmin =
    roleLower === 'administrador' ||
    roleLower === 'admin' ||
    roleLower === 'gerente'

  const canCreateLoan =
    isSecretary || isAdvisor || hasPermission(user, ['crear_prestamo'])

  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const tabs: TabItem[] = [
    {
      key: 'nueva',
      label: 'Nueva Solicitud',
      visible: canCreateLoan,
    },
    {
      key: 'solicitudes',
      label: 'Solicitudes Pendientes',
      visible:
        isAdmin &&
        hasPermission(user, [
          'aprobar_acreedor_precalificacion',
          'aprobar_acreedor_final',
          'ver_solicitudes_globales',
          'aprobar_prestamo',
        ]),
    },
    {
      key: 'desembolsos',
      label: 'Desembolsos Pendientes',
      visible:
        isAdmin &&
        hasPermission(user, ['autorizar_desembolso', 'registrar_desembolso']),
    },
    {
      key: 'simulador',
      label: 'Simulador de Pagos',
      visible: isAdmin && hasPermission(user, ['simulador_pagos']),
    },
    {
      key: 'planes',
      label: 'Planes Personalizados',
      visible:
        isAdmin &&
        hasPermission(user, [
          'crear_planes_cobro',
          'crear_plan_pago',
          'editar_plan_pago',
        ]),
    },
  ]

  const visibleTabs = tabs.filter((tab) => tab.visible)

  const [activeTab, setActiveTab] = useState<LoansTabKey>(() => {
    const saved = sessionStorage.getItem(LOANS_TAB_KEY) as LoansTabKey | null
    return saved && visibleTabs.some((tab) => tab.key === saved)
      ? saved
      : visibleTabs[0]?.key ?? 'nueva'
  })

  useEffect(() => {
    sessionStorage.setItem(LOANS_TAB_KEY, activeTab)
  }, [activeTab])

  const safeActiveTab = visibleTabs.some((tab) => tab.key === activeTab)
    ? activeTab
    : visibleTabs[0]?.key ?? 'nueva'

  const renderView = () => {
    switch (safeActiveTab) {
      case 'nueva':
        return <VistaNuevaSolicitud />
      case 'solicitudes':
        return <VistaSolicitudPendiente setPreviewImage={setPreviewImage} />
      case 'desembolsos':
        return <VistaDesembolsoPendiente />
      case 'simulador':
        return <VistaSimuladorPagos />
      case 'planes':
        return <VistaPlanPersonalizado />
      default:
        return <VistaNuevaSolicitud />
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
              <h4 className="text-white fw-bold mb-1">Préstamos</h4>
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

      {previewImage && (
        <ImageModal src={previewImage} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  )
}

function VistaNuevaSolicitud() {
  const [clientQuery, setClientQuery] = useState('')
  const [searchingClients, setSearchingClients] = useState(false)
  const [clientSearchError, setClientSearchError] = useState('')
  const [clientResults, setClientResults] = useState<ClienteBusqueda[]>([])
  const [selectedClient, setSelectedClient] = useState<ClienteBusqueda | null>(
    null,
  )

  const [usePlanPersonalizado, setUsePlanPersonalizado] = useState(false)
  const [planes, setPlanes] = useState<PlanItem[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState('')

  const [monto, setMonto] = useState<number>(0)
  const [interes, setInteres] = useState<number>(0)
  const [destinoUso, setDestinoUso] = useState('')
  const [destinoUsoOtro, setDestinoUsoOtro] = useState('')
  const [periodicidad, setPeriodicidad] = useState('')
  const [numeroCuotas, setNumeroCuotas] = useState<number>(0)
  const [mora, setMora] = useState<number>(0)

  const [garantias, setGarantias] = useState<Garantia[]>([crearGarantiaVacia()])

  const [loadingPlanes, setLoadingPlanes] = useState(false)
  const [savingLoan, setSavingLoan] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [saveLoanError, setSaveLoanError] = useState('')
  const [saveLoanMessage, setSaveLoanMessage] = useState('')

  const montoAPagar =
    monto > 0 && interes > 0 ? monto + (monto * interes) / 100 : 0

  const selectedPlan = useMemo(
    () => planes.find((plan) => String(plan.id) === selectedPlanId) ?? null,
    [planes, selectedPlanId],
  )

  const loadPlanes = async () => {
    setLoadingPlanes(true)
    try {
      const { data } = await axios.get<PlanItem>(`${API_BASE_URL}/loans/plans/`, {
        headers: authHeaders(),
      })
      setPlanes(Array.isArray(data) ? data : [])
    } catch {
      setPlanes([])
    } finally {
      setLoadingPlanes(false)
    }
  }

  useEffect(() => {
    if (usePlanPersonalizado) {
      void loadPlanes()
    }
  }, [usePlanPersonalizado])

  const buscarClientes = async () => {
    setClientSearchError('')
    setSearchingClients(true)

    try {
      const { data } = await axios.get<ClienteBusqueda[]>(
        `${API_BASE_URL}/creditors/search/`,
        {
          params: { q: clientQuery.trim() },
          headers: authHeaders(),
        },
      )
      setClientResults(data)
    } catch (error) {
      setClientResults([])
      setClientSearchError(
        getErrorDetail(error, 'No se pudo buscar el cliente.'),
      )
    } finally {
      setSearchingClients(false)
    }
  }

  const agregarGarantia = () => {
    setGarantias([...garantias, crearGarantiaVacia()])
  }

  const eliminarGarantia = (index: number) => {
    if (index === 0) return
    setGarantias(garantias.filter((_, i) => i !== index))
  }

  const actualizarGarantia = (
    index: number,
    field: keyof Omit<Garantia, 'fotos'>,
    value: string,
  ) => {
    setGarantias((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    )
  }

  const agregarFoto = (garantiaIndex: number) => {
    const nuevas = [...garantias]
    nuevas[garantiaIndex].fotos.push({ tipo: 'frontal', archivo: null })
    setGarantias(nuevas)
  }

  const eliminarFoto = (garantiaIndex: number, fotoIndex: number) => {
    const nuevas = [...garantias]
    nuevas[garantiaIndex].fotos = nuevas[garantiaIndex].fotos.filter(
      (_, i) => i !== fotoIndex,
    )
    setGarantias(nuevas)
  }

  const actualizarTipoFoto = (
    garantiaIndex: number,
    fotoIndex: number,
    value: string,
  ) => {
    const nuevas = [...garantias]
    nuevas[garantiaIndex].fotos[fotoIndex].tipo = value
    setGarantias(nuevas)
  }

  const actualizarArchivoFoto = (
    garantiaIndex: number,
    fotoIndex: number,
    archivo: File | null,
  ) => {
    const nuevas = [...garantias]
    nuevas[garantiaIndex].fotos[fotoIndex].archivo = archivo
    setGarantias(nuevas)
  }

  const resetForm = () => {
    setSelectedClient(null)
    setClientQuery('')
    setClientResults([])
    setUsePlanPersonalizado(false)
    setSelectedPlanId('')
    setMonto(0)
    setInteres(0)
    setDestinoUso('')
    setDestinoUsoOtro('')
    setPeriodicidad('')
    setNumeroCuotas(0)
    setMora(0)
    setGarantias([crearGarantiaVacia()])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveLoanError('')
    setSaveLoanMessage('')

    if (!selectedClient) {
      setSaveLoanError('Debes seleccionar un cliente.')
      return
    }

    if (!isPositiveNumber(monto)) {
      setSaveLoanError('El monto solicitado debe ser mayor que 0.')
      return
    }

    if (!isPositiveNumber(interes)) {
      setSaveLoanError('El interés debe ser mayor que 0.')
      return
    }

    if (!destinoUso) {
      setSaveLoanError('Debes seleccionar el destino del préstamo.')
      return
    }

    if (destinoUso === 'otro' && !destinoUsoOtro.trim()) {
      setSaveLoanError('Debes especificar el destino cuando seleccionas Otro.')
      return
    }

    if (usePlanPersonalizado && !selectedPlanId) {
      setSaveLoanError('Debes seleccionar un plan personalizado.')
      return
    }

    if (!usePlanPersonalizado && (!periodicidad || !numeroCuotas)) {
      setSaveLoanError('Debes completar periodicidad y número de cuotas.')
      return
    }

    if (!usePlanPersonalizado && !isPositiveInteger(numeroCuotas)) {
      setSaveLoanError('El número de cuotas debe ser un entero mayor que 0.')
      return
    }

    if (!usePlanPersonalizado && !isPositiveNumber(mora)) {
      setSaveLoanError('La mora debe ser mayor que 0.')
      return
    }

    for (const [index, garantia] of garantias.entries()) {
      const tieneDatos =
        index === 0 ||
        garantia.descripcion.trim() ||
        garantia.categoria.trim() ||
        garantia.valorEstimado.trim()

      if (!tieneDatos) continue

      if (!isPositiveNumber(garantia.valorEstimado)) {
        setSaveLoanError(`El valor estimado de la garantía ${index + 1} debe ser mayor que 0.`)
        return
      }

      if (garantia.categoria === 'otro' && !garantia.categoriaOtro.trim()) {
        setSaveLoanError(`Debes especificar la categoría "Otro" en la garantía ${index + 1}.`)
        return
      }
    }

    const garantiasBase = garantias.filter(
      (g, index) =>
        index === 0 ||
        g.descripcion.trim() ||
        g.categoria.trim() ||
        g.valorEstimado.trim(),
    )

    if (garantiasBase.length === 0) {
      setSaveLoanError('Debes agregar al menos una garantía.')
      return
    }

    setSavingLoan(true)

    try {
      setUploadingPhotos(true)

      const garantiasPayload = await Promise.all(
        garantiasBase.map(async (g) => {
          const fotosSubidas = await Promise.all(
            g.fotos
              .filter((f) => f.archivo)
              .map(async (f, index) => {
                const uploaded = await uploadGarantiaPhoto(
                  f.archivo as File,
                  f.tipo,
                  index === 0,
                )

                return {
                  ruta_archivo: uploaded.ruta_archivo,
                  descripcion: uploaded.descripcion || f.tipo,
                  es_principal: Boolean(uploaded.es_principal),
                }
              }),
          )

          return {
            tipo_garantia:
              g.categoria === 'otro'
                ? g.categoriaOtro.trim()
                : g.categoria.trim(),
            descripcion: g.descripcion.trim() || 'Garantía sin descripción',
            valor_estimado: g.valorEstimado.trim(),
            estado_garantia: g.estadoGeneral.trim() || 'bueno',
            observaciones: g.observaciones.trim() || g.estadoEspecifico.trim(),
            fotos: fotosSubidas,
          }
        }),
      )

      setUploadingPhotos(false)

      const payload = {
        cliente_id: selectedClient.id,
        plan_id: usePlanPersonalizado ? Number(selectedPlanId) : null,
        periodicidad: usePlanPersonalizado ? undefined : periodicidad,
        numero_cuotas: usePlanPersonalizado ? undefined : numeroCuotas,
        mora: usePlanPersonalizado ? undefined : mora,
        monto_solicitado: monto,
        interes,
        destino_uso: destinoUso === 'otro' ? destinoUsoOtro.trim() : destinoUso,
        garantias: garantiasPayload,
      }

      const { data } = await axios.post<{ id: number }>(
        `${API_BASE_URL}/loans/create/`,
        payload,
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      setSaveLoanMessage(`Solicitud registrada correctamente. Préstamo #${data.id}.`)
      resetForm()
    } catch (error) {
      setUploadingPhotos(false)
      setSaveLoanError(
        getErrorDetail(error, 'No se pudo registrar la solicitud de préstamo.'),
      )
    } finally {
      setSavingLoan(false)
    }
  }

  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div className="form-icon-box me-3">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
            Registro de Nuevo Préstamo
          </h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
            Los campos marcados con (*) son obligatorios.
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">01.</span> Asignación de Cliente
        </h6>

        <div className="row g-4 mb-4">
          <div className="col-md-8">
            <label className="form-label text-white-50 small mb-2">
              Buscar Cliente (DPI o Nombre) *
            </label>
            <div className="inset-input-box">
              <input
                type="search"
                aria-label="Buscar cliente por DPI o nombre"
                placeholder="Ingrese DPI o nombre del acreedor..."
                value={clientQuery}
                onChange={(e) => setClientQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void buscarClientes())}
              />
            </div>
          </div>

          <div className="col-md-4 d-flex align-items-end">
            <button
              type="button"
              className="btn-gold-action px-4 py-3 d-flex align-items-center gap-2 w-100 justify-content-center"
              style={{ fontSize: '13px', borderRadius: '10px' }}
              onClick={() => {
                void buscarClientes()
              }}
              disabled={searchingClients}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              {searchingClients ? 'BUSCANDO...' : 'BUSCAR CLIENTE'}
            </button>
          </div>

          {clientSearchError ? (
            <div className="col-12">
              <div className="text-warning small">{clientSearchError}</div>
            </div>
          ) : null}

          {clientResults.length > 0 && (
            <div className="col-12">
              <div className="reference-box p-3">
                <p className="text-gold fw-bold small mb-3">Resultados</p>
                <div className="d-flex flex-column gap-2">
                  {clientResults.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className="btn-modern-dark d-flex justify-content-between align-items-center text-start"
                      onClick={() => setSelectedClient(client)}
                    >
                      <span>
                        {client.nombre_completo} • DPI: {client.dpi || '—'}
                      </span>
                      <span>{client.estado_cliente}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="col-12">
            <div className="reference-box p-3 d-flex align-items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              <span className="text-white-50 small">
                {selectedClient
                  ? `Cliente seleccionado: ${selectedClient.nombre_completo} • DPI: ${selectedClient.dpi || '—'}`
                  : 'Ningún acreedor seleccionado. Use el buscador de arriba para asignar un acreedor a este préstamo.'}
              </span>
            </div>
          </div>
        </div>

        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">02.</span> Información del Préstamo
        </h6>

        <div className="row g-4 mb-3">
          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Monto Solicitado *</label>
            <div className="inset-input-box d-flex align-items-center">
              <span className="text-gold me-2 fw-bold">Q</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="flex-fill"
                placeholder="0.00"
                required
                value={monto || ''}
                onChange={(e) => setMonto(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Interés (%) *</label>
            <div className="inset-input-box d-flex align-items-center">
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="flex-fill"
                placeholder="Ej. 5"
                required
                value={interes || ''}
                onChange={(e) => setInteres(Number(e.target.value))}
              />
              <span className="text-white-50 ms-2 fw-bold">%</span>
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Destino / Uso *</label>
            <div className="inset-input-box pe-2">
              <select
                className="w-100 bg-transparent border-0 outline-none select-custom"
                required
                value={destinoUso}
                onChange={(e) => setDestinoUso(e.target.value)}
              >
                <option value="">Seleccione...</option>
                <option value="consumo">Consumo Personal</option>
                <option value="negocio">Negocio / Inversión</option>
                <option value="vivienda">Vivienda</option>
                <option value="educacion">Educación</option>
                <option value="salud">Salud</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          {destinoUso === 'otro' && (
            <div className="col-md-4">
              <label className="form-label text-white-50 small mb-2">
                Especifique el destino *
              </label>
              <div className="inset-input-box">
                <input
                  type="text"
                  placeholder="Ej. Compra de mercadería..."
                  value={destinoUsoOtro}
                  onChange={(e) => setDestinoUsoOtro(e.target.value)}
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div className="row g-4 mb-5">
          <div className="col-12">
            <div className="monto-resultado-box p-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span className="text-white-50 small fw-bold">
                  Monto Total a Pagar (Capital + Interés):
                </span>
              </div>
              <span className="text-gold fw-bold" style={{ fontSize: '18px' }}>
                Q {montoAPagar > 0 ? formatMoney(montoAPagar) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">03.</span> Plan de Pago
        </h6>

        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="reference-box p-3 d-flex align-items-center gap-3">
              <label className="d-flex align-items-center gap-2 mb-0" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={usePlanPersonalizado}
                  onChange={(e) => setUsePlanPersonalizado(e.target.checked)}
                  className="form-check-input plan-checkbox"
                />
                <span className="text-gold small fw-bold">
                  ¿Usar un plan personalizado creado por el administrador?
                </span>
              </label>
            </div>
          </div>
        </div>

        {usePlanPersonalizado && (
          <div className="row g-4 mb-5">
            <div className="col-md-12">
              <label className="form-label text-white-50 small mb-2">
                Seleccionar Plan Personalizado *
              </label>
              <div className="inset-input-box pe-2">
                <select
                  className="w-100 bg-transparent border-0 outline-none select-custom"
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  <option value="">
                    {loadingPlanes ? 'Cargando planes...' : 'Seleccione un plan personalizado...'}
                  </option>
                  {planes.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre_plan} ({plan.periodicidad}, {plan.numero_cuotas} cuotas)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedPlan && (
              <div className="col-12">
                <div className="reference-box p-3">
                  <p className="text-white-50 small mb-1">
                    Periodicidad: {selectedPlan.periodicidad || '—'}
                  </p>
                  <p className="text-white-50 small mb-1">
                    Cuotas: {selectedPlan.numero_cuotas}
                  </p>
                  <p className="text-white-50 small mb-1">
                    Interés: {selectedPlan.interes}%
                  </p>
                  <p className="text-white-50 small mb-0">
                    Mora: {selectedPlan.mora}%
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!usePlanPersonalizado && (
          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <label className="form-label text-white-50 small mb-2">Periodicidad *</label>
              <div className="inset-input-box pe-2">
                <select
                  className="w-100 bg-transparent border-0 outline-none select-custom"
                  required
                  value={periodicidad}
                  onChange={(e) => setPeriodicidad(e.target.value)}
                >
                  <option value="">Seleccione...</option>
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            </div>

            <div className="col-md-4">
              <label className="form-label text-white-50 small mb-2">Número de Cuotas *</label>
              <div className="inset-input-box">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ej. 12"
                  required
                  value={numeroCuotas || ''}
                  onChange={(e) => setNumeroCuotas(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="col-md-4">
              <label className="form-label text-white-50 small mb-2">Mora (%) *</label>
              <div className="inset-input-box d-flex align-items-center">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="flex-fill"
                  placeholder="Ej. 2"
                  required
                  value={mora || ''}
                  onChange={(e) => setMora(Number(e.target.value))}
                />
                <span className="text-white-50 ms-2 fw-bold">%</span>
              </div>
            </div>
          </div>
        )}

        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">04.</span> Garantías del Préstamo
        </h6>

        {garantias.map((garantia, gIndex) => (
          <div key={gIndex} className="reference-box p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p
                className={`${gIndex === 0 ? 'text-gold' : 'text-white-50'} fw-bold mb-0`}
                style={{ fontSize: '13px', color: gIndex === 0 ? '#cca641' : undefined }}
              >
                Garantía {gIndex + 1} {gIndex === 0 ? '(Obligatoria)' : '(Opcional)'}
              </p>

              {gIndex > 0 && (
                <button
                  type="button"
                  className="btn-remove-garantia"
                  onClick={() => eliminarGarantia(gIndex)}
                >
                  Eliminar
                </button>
              )}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">
                  Descripción {gIndex === 0 ? '*' : ''}
                </label>
                <div className="inset-input-box">
                  <input
                    type="text"
                    placeholder="Ej. Televisor Samsung 55 pulgadas"
                    value={garantia.descripcion}
                    onChange={(e) =>
                      actualizarGarantia(gIndex, 'descripcion', e.target.value)
                    }
                    required={gIndex === 0}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">
                  Categoría {gIndex === 0 ? '*' : ''}
                </label>
                <div className="inset-input-box pe-2">
                  <select
                    className="w-100 bg-transparent border-0 outline-none select-custom"
                    required={gIndex === 0}
                    value={garantia.categoria}
                    onChange={(e) =>
                      actualizarGarantia(gIndex, 'categoria', e.target.value)
                    }
                  >
                    <option value="">Seleccione...</option>
                    <option value="electronica">Electrónica</option>
                    <option value="vehiculo">Vehículo</option>
                    <option value="joyeria">Joyería</option>
                    <option value="electrodomestico">Electrodoméstico</option>
                    <option value="maquinaria">Maquinaria</option>
                    <option value="bienesRaices">Bienes Raíces</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              {garantia.categoria === 'otro' && (
                <div className="col-md-6">
                  <label className="form-label text-white-50 small mb-2">
                    Especifique la categoría {gIndex === 0 ? '*' : ''}
                  </label>
                  <div className="inset-input-box">
                    <input
                      type="text"
                      placeholder="Ej. Herramienta, mueble, instrumento..."
                      value={garantia.categoriaOtro}
                      onChange={(e) =>
                        actualizarGarantia(gIndex, 'categoriaOtro', e.target.value)
                      }
                      required={garantia.categoria === 'otro'}
                    />
                  </div>
                </div>
              )}

              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">
                  Valor Estimado {gIndex === 0 ? '*' : ''}
                </label>
                <div className="inset-input-box d-flex align-items-center">
                  <span className="text-gold me-2 fw-bold">Q</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="flex-fill"
                    placeholder="0.00"
                    value={garantia.valorEstimado}
                    onChange={(e) =>
                      actualizarGarantia(gIndex, 'valorEstimado', e.target.value)
                    }
                    required={gIndex === 0}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">
                  Estado General {gIndex === 0 ? '*' : ''}
                </label>
                <div className="inset-input-box pe-2">
                  <select
                    className="w-100 bg-transparent border-0 outline-none select-custom"
                    required={gIndex === 0}
                    value={garantia.estadoGeneral}
                    onChange={(e) =>
                      actualizarGarantia(gIndex, 'estadoGeneral', e.target.value)
                    }
                  >
                    <option value="">Seleccione...</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="bueno">Bueno</option>
                    <option value="regular">Regular</option>
                    <option value="deteriorado">Deteriorado</option>
                  </select>
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">
                  Estado específico
                </label>
                <div className="inset-input-box">
                  <input
                    type="text"
                    placeholder="Ej. Tiene un rayón en la pantalla"
                    value={garantia.estadoEspecifico}
                    onChange={(e) =>
                      actualizarGarantia(gIndex, 'estadoEspecifico', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">
                  Observaciones
                </label>
                <div className="inset-input-box">
                  <input
                    type="text"
                    placeholder="Ej. No funciona el botón de encendido"
                    value={garantia.observaciones}
                    onChange={(e) =>
                      actualizarGarantia(gIndex, 'observaciones', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="col-12 mt-3">
                <p className="text-white-50 small fw-bold mb-2">
                  Fotografías de esta garantía
                </p>

                <div className="row g-3">
                  {garantia.fotos.map((foto, fIndex) => (
                    <div className="col-md-4" key={fIndex}>
                      <div className="inset-upload-box p-3 d-flex flex-column align-items-center justify-content-center text-center position-relative">
                        {garantia.fotos.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-foto"
                            onClick={() => eliminarFoto(gIndex, fIndex)}
                          >
                            ×
                          </button>
                        )}

                        <div className="inset-input-box pe-2 mb-2 w-100" style={{ padding: '8px 12px' }}>
                          <select
                            className="w-100 bg-transparent border-0 outline-none select-custom"
                            style={{ fontSize: '12px' }}
                            value={foto.tipo}
                            onChange={(e) =>
                              actualizarTipoFoto(gIndex, fIndex, e.target.value)
                            }
                          >
                            <option value="frontal">Frontal</option>
                            <option value="lateral">Lateral</option>
                            <option value="trasera">Trasera</option>
                            <option value="detallada">Detallada</option>
                          </select>
                        </div>

                        <label
                          className="btn-modern-dark d-flex align-items-center gap-2"
                          style={{ fontSize: '11px', padding: '8px 14px', cursor: 'pointer' }}
                        >
                          Subir Imagen
                          <input
                            type="file"
                            className="d-none"
                            onChange={(e) =>
                              actualizarArchivoFoto(
                                gIndex,
                                fIndex,
                                e.target.files?.[0] ?? null,
                              )
                            }
                          />
                        </label>

                        {foto.archivo ? (
                          <small className="text-white-50 mt-2">{foto.archivo.name}</small>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  <div className="col-md-4">
                    <button
                      type="button"
                      className="btn-add-foto w-100"
                      onClick={() => agregarFoto(gIndex)}
                    >
                      <span>Agregar Foto</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="mb-5">
          <button
            type="button"
            className="btn-add-garantia w-100"
            onClick={agregarGarantia}
          >
            Agregar otra garantía
          </button>
        </div>

        {(saveLoanError || saveLoanMessage) && (
          <div className="mb-4">
            {saveLoanError ? <div className="text-warning small">{saveLoanError}</div> : null}
            {saveLoanMessage ? <div className="text-success small">{saveLoanMessage}</div> : null}
          </div>
        )}

        {(savingLoan || uploadingPhotos) && (
          <div className="mb-4">
            <div className="text-white-50 small">
              {uploadingPhotos
                ? 'Subiendo fotografías de garantías...'
                : 'Registrando préstamo...'}
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end mt-5 pt-4 form-header-border">
          <button
            type="submit"
            className="btn-gold-action px-5 py-3 d-flex align-items-center gap-2"
            style={{ fontSize: '14px', borderRadius: '12px' }}
            disabled={savingLoan || uploadingPhotos}
          >
            {uploadingPhotos
              ? 'SUBIENDO FOTOS...'
              : savingLoan
                ? 'REGISTRANDO...'
                : 'REGISTRAR PRÉSTAMO'}
          </button>
        </div>
      </form>
    </>
  )
}

function VistaSolicitudPendiente({ setPreviewImage }: { setPreviewImage: (src: string | null) => void }) {
  const [query, setQuery] = useState('')
  const [section, setSection] = useState<'clientes' | 'prestamos'>(() => {
    const saved = sessionStorage.getItem(LOANS_PENDING_SECTION_KEY)
    return saved === 'clientes' || saved === 'prestamos'
      ? saved
      : 'prestamos'
  })

  const [loading, setLoading] = useState(false)
  const [clientItems, setClientItems] = useState<PendingPrequalificationItem[]>([])
  const [loanItems, setLoanItems] = useState<PrestamoItem[]>([])
  const [selectedClientDetail, setSelectedClientDetail] =
    useState<PendingPrequalificationDetail | null>(null)
  const [selectedLoanDetail, setSelectedLoanDetail] =
    useState<PrestamoDetalle | null>(null)
  const [loadingClientDetail, setLoadingClientDetail] = useState(false)
  const [loadingLoanDetail, setLoadingLoanDetail] = useState(false)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [approvingId, setApprovingId] = useState<number | null>(null)
  const [approvingPrequalificationId, setApprovingPrequalificationId] =
    useState<number | null>(null)

  const loadClientItems = async (search = query.trim()) => {
    const { data } = await axios.get<PendingPrequalificationItem[]>(
      `${API_BASE_URL}/creditors/pending-prequalification/`,
      {
        params: search ? { q: search } : {},
        headers: authHeaders(),
      },
    )
    setClientItems(data)
  }

  const loadLoanItems = async (search = query.trim()) => {
    const { data } = await axios.get<PrestamoItem[]>(
      `${API_BASE_URL}/loans/pending/`,
      {
        params: search ? { q: search } : {},
        headers: authHeaders(),
      },
    )
    setLoanItems(data)
  }

  const loadData = async (search = query.trim()) => {
    setError('')
    setLoading(true)

    try {
      if (section === 'clientes') {
        await loadClientItems(search)
      } else {
        await loadLoanItems(search)
      }
    } catch (error) {
      if (section === 'clientes') {
        setClientItems([])
      } else {
        setLoanItems([])
      }
      setError(
        getErrorDetail(error, 'No se pudieron cargar las solicitudes pendientes.'),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    sessionStorage.setItem(LOANS_PENDING_SECTION_KEY, section)
    setSelectedClientDetail(null)
    setSelectedLoanDetail(null)
    void loadData('')
  }, [section])

  const verDetalleCliente = async (informeId: number) => {
    setLoadingClientDetail(true)
    setError('')

    try {
      const { data } = await axios.get<PendingPrequalificationDetail>(
        `${API_BASE_URL}/creditors/pending-prequalification/${informeId}/`,
        {
          headers: authHeaders(),
        },
      )
      setSelectedClientDetail(data)
    } catch (error) {
      setSelectedClientDetail(null)
      setError(getErrorDetail(error, 'No se pudo cargar el detalle del cliente.'))
    } finally {
      setLoadingClientDetail(false)
    }
  }

  const verDetallePrestamo = async (loanId: number) => {
    setLoadingLoanDetail(true)
    setError('')

    try {
      const { data } = await axios.get(`${API_BASE_URL}/loans/${loanId}/`, {
        headers: authHeaders(),
      })

      setSelectedLoanDetail(data)
    } catch (error) {
      setSelectedLoanDetail(null)
      setError(getErrorDetail(error, 'No se pudo cargar el detalle del préstamo.'))
    } finally {
      setLoadingLoanDetail(false)
    }
  }

  const aprobarPrecalificacion = async (
    informeId: number,
    clienteNombre?: string | null,
  ) => {
    setActionMessage('')
    setApprovingPrequalificationId(informeId)

    try {
      await axios.post(
        `${API_BASE_URL}/creditors/pending-prequalification/${informeId}/approve/`,
        {},
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      setActionMessage(
        `Cliente ${clienteNombre || ''} aprobado correctamente en precalificación.`,
      )
      await loadClientItems()
      setSelectedClientDetail(null)
    } catch (error) {
      setActionMessage(
        getErrorDetail(error, 'No se pudo aprobar la precalificación.'),
      )
    } finally {
      setApprovingPrequalificationId(null)
    }
  }

  const aprobarPrestamo = async (loanId: number) => {
    setActionMessage('')
    setApprovingId(loanId)

    try {
      await axios.post(
        `${API_BASE_URL}/loans/${loanId}/approve/`,
        {},
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )
      setActionMessage(`Préstamo #${loanId} aprobado correctamente.`)
      await loadLoanItems()
    } catch (error) {
      setActionMessage(getErrorDetail(error, 'No se pudo aprobar el préstamo.'))
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div className="form-icon-box me-3">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
            Solicitudes Pendientes
          </h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
            Separación entre nuevos clientes por precalificación y préstamos por aprobación.
          </span>
        </div>
      </div>

      <div className="d-flex gap-3 mb-4 flex-wrap">
        <button
          type="button"
          className={`tab-btn ${section === 'clientes' ? 'active' : ''}`}
          onClick={() => setSection('clientes')}
        >
          Nuevos clientes
        </button>
        <button
          type="button"
          className={`tab-btn ${section === 'prestamos' ? 'active' : ''}`}
          onClick={() => setSection('prestamos')}
        >
          Préstamos
        </button>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="inset-input-box">
            <input
              type="text"
              placeholder={
                section === 'clientes'
                  ? 'Buscar por nombre o DPI del nuevo cliente...'
                  : 'Buscar por nombre del acreedor, DPI o No. de préstamo...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void loadData())}
            />
            <button
              className="btn-gold-action ms-2 px-4 py-2"
              style={{ borderRadius: '8px' }}
              type="button"
              onClick={() => {
                void loadData()
              }}
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="text-warning small mb-3">{error}</div> : null}
      {actionMessage ? <div className="text-success small mb-3">{actionMessage}</div> : null}

      {section === 'clientes' ? (
        <div className="d-flex flex-column gap-3">
          {clientItems.length === 0 ? (
            <div className="reference-box p-4 text-center">
              <p className="text-white-50 small mb-0">
                No hay clientes pendientes de precalificación.
              </p>
            </div>
          ) : (
            clientItems.map((item) => (
              <div key={item.id} className="reference-box p-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <h5 className="text-white mb-1">
                      {item.cliente_nombre || 'Sin nombre'}
                    </h5>
                    <p className="text-white-50 small mb-1">
                      DPI: {item.cliente_dpi || '—'}
                    </p>
                    <p className="text-white-50 small mb-1">
                      Creado por: {item.usuario_creador_nombre || '—'}
                    </p>
                    <p className="text-white-50 small mb-0">
                      Estado: {item.estado_revision}
                    </p>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn-gold-action px-4 py-2"
                      style={{ borderRadius: '8px' }}
                      onClick={() => {
                        void verDetalleCliente(item.id)
                      }}
                      disabled={loadingClientDetail}
                    >
                      {loadingClientDetail && selectedClientDetail?.id === item.id
                        ? 'Cargando...'
                        : 'Ver detalle'}
                    </button>

                    <button
                      type="button"
                      className="btn-modern-dark px-4 py-2"
                      style={{ borderRadius: '8px' }}
                      onClick={() => {
                        void aprobarPrecalificacion(item.id, item.cliente_nombre)
                      }}
                      disabled={approvingPrequalificationId === item.id}
                    >
                      {approvingPrequalificationId === item.id
                        ? 'Aprobando...'
                        : 'Aprobar'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {selectedClientDetail && (
            <div className="reference-box p-4 mt-3">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                <h5 className="text-white mb-0">
                  {selectedClientDetail.cliente.nombre_completo}
                </h5>

                <button
                  type="button"
                  className="btn-modern-dark px-4 py-2"
                  style={{ borderRadius: '8px' }}
                  onClick={() => {
                    void aprobarPrecalificacion(
                      selectedClientDetail.id,
                      selectedClientDetail.cliente.nombre_completo,
                    )
                  }}
                  disabled={approvingPrequalificationId === selectedClientDetail.id}
                >
                  {approvingPrequalificationId === selectedClientDetail.id
                    ? 'Aprobando...'
                    : 'Aprobar precalificación'}
                </button>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">DPI</small>
                    <strong className="text-white">
                      {selectedClientDetail.cliente.dpi || '—'}
                    </strong>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">NIT</small>
                    <strong className="text-white">
                      {selectedClientDetail.cliente.nit || '—'}
                    </strong>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Asesor creador</small>
                    <strong className="text-white">
                      {selectedClientDetail.cliente.asesor_nombre || '—'}
                    </strong>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Dirección</small>
                    <strong className="text-white">
                      {selectedClientDetail.cliente.direccion || '—'}
                    </strong>
                  </div>
                </div>

                <div className="col-md-2">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Depto.</small>
                    <strong className="text-white">
                      {selectedClientDetail.cliente.departamento || '—'}
                    </strong>
                  </div>
                </div>

                <div className="col-md-2">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Municipio</small>
                    <strong className="text-white">
                      {selectedClientDetail.cliente.municipio || '—'}
                    </strong>
                  </div>
                </div>

                <div className="col-md-2">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Distrito</small>
                    <strong className="text-white">
                      {selectedClientDetail.cliente.distrito || '—'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h6 className="text-gold mb-3">Teléfonos</h6>
                <div className="row g-3">
                  {selectedClientDetail.telefonos.map((tel) => (
                    <div key={tel.id} className="col-md-4">
                      <div className="inner-dark-box p-3">
                        <small className="text-white-50 d-block">
                          {tel.tipo || 'teléfono'}
                        </small>
                        <strong className="text-white">{tel.numero}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <h6 className="text-gold mb-3">Información laboral</h6>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="inner-dark-box p-3">
                      <small className="text-white-50 d-block">Lugar de trabajo</small>
                      <strong className="text-white">
                        {selectedClientDetail.informacion_laboral?.lugar_trabajo || '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="inner-dark-box p-3">
                      <small className="text-white-50 d-block">Puesto</small>
                      <strong className="text-white">
                        {selectedClientDetail.informacion_laboral?.puesto || '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="inner-dark-box p-3">
                      <small className="text-white-50 d-block">Tiempo laborando</small>
                      <strong className="text-white">
                        {selectedClientDetail.informacion_laboral?.tiempo_laborando || '—'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h6 className="text-gold mb-3">Referencias</h6>
                <div className="row g-3">
                  {selectedClientDetail.referencias.map((ref) => (
                    <div key={ref.id} className="col-md-6">
                      <div className="inner-dark-box p-3">
                        <strong className="text-white d-block">{ref.nombres}</strong>
                        <small className="text-white-50 d-block">
                          {ref.parentesco || '—'}
                        </small>
                        <small className="text-white-50 d-block">
                          {ref.telefono || '—'}
                        </small>
                        <small className="text-white-50 d-block">
                          {ref.direccion || '—'}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <h6 className="text-gold mb-3">Fotografías</h6>
                <div className="row g-3">
                  {/* Foto de Recibo de Luz (desde Información Laboral) */}
                  {selectedClientDetail.informacion_laboral?.foto_recibo_luz && (
                    <div className="col-md-4">
                      <div className="inner-dark-box p-2">
                        <small className="text-white-50 d-block mb-2 px-2 pt-1">
                          Recibo de Luz
                        </small>
                        <div
                          className="rounded overflow-hidden mb-2"
                          style={{ height: '140px', background: '#000' }}
                        >
                          <img
                            src={
                              selectedClientDetail.informacion_laboral
                                .foto_recibo_luz
                            }
                            alt="Recibo de Luz"
                            className="w-100 h-100"
                            style={{ objectFit: 'contain' }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn-link text-gold small px-2 pb-1 d-block border-0 bg-transparent p-0"
                          style={{ textDecoration: 'none', fontSize: '11px' }}
                          onClick={() =>
                            setPreviewImage(
                              selectedClientDetail.informacion_laboral!
                                .foto_recibo_luz,
                            )
                          }
                        >
                          Ampliar imagen
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedClientDetail.fotos.length === 0 &&
                    !selectedClientDetail.informacion_laboral?.foto_recibo_luz ? (
                    <div className="col-12">
                      <div className="inner-dark-box p-3 text-white-50">
                        No hay fotografías registradas.
                      </div>
                    </div>
                  ) : (
                    selectedClientDetail.fotos.map((foto) => (
                      <div key={foto.id} className="col-md-4">
                        <div className="inner-dark-box p-2">
                          <small className="text-white-50 d-block mb-2 px-2 pt-1">
                            {foto.descripcion === 'foto_vivienda'
                              ? 'Foto de Vivienda'
                              : foto.descripcion || 'Fotografía'}
                          </small>
                          <div
                            className="rounded overflow-hidden mb-2"
                            style={{ height: '140px', background: '#000' }}
                          >
                            <img
                              src={foto.ruta_archivo}
                              alt={foto.descripcion || 'Foto'}
                              className="w-100 h-100"
                              style={{
                                objectFit: 'contain',
                                cursor: 'pointer',
                              }}
                              onClick={() => setPreviewImage(foto.ruta_archivo)}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn-link text-gold small px-2 pb-1 d-block border-0 bg-transparent p-0"
                            style={{ textDecoration: 'none', fontSize: '11px' }}
                            onClick={() => setPreviewImage(foto.ruta_archivo)}
                          >
                            Ampliar imagen
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {loanItems.length === 0 ? (
            <div className="reference-box p-4 text-center">
              <p className="text-white-50 small mb-0">
                No hay solicitudes pendientes para mostrar.
              </p>
            </div>
          ) : (
            loanItems.map((item) => (
              <div key={item.id} className="reference-box p-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                  <div>
                    <h5 className="text-white mb-1">
                      #{item.id} • {item.cliente_nombre}
                    </h5>
                    <p className="text-white-50 small mb-1">
                      DPI: {item.cliente_dpi || '—'} • Plan: {item.plan_nombre || '—'}
                    </p>
                    <p className="text-white-50 small mb-1">
                      Periodicidad: {item.periodicidad || '—'} • Cuotas: {item.numero_cuotas || '—'}
                    </p>
                    <p className="text-white-50 small mb-1">
                      Monto: Q {formatMoney(item.monto_solicitado)} • Interés: {item.interes}%
                    </p>
                    <p className="text-white-50 small mb-0">
                      Destino: {item.destino_uso || '—'}
                    </p>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn-modern-dark px-4 py-2"
                      style={{ borderRadius: '8px' }}
                      onClick={() => {
                        void verDetallePrestamo(item.id)
                      }}
                      disabled={loadingLoanDetail}
                    >
                      {loadingLoanDetail && selectedLoanDetail?.id === item.id
                        ? 'Cargando...'
                        : 'Ver detalle'}
                    </button>

                    <button
                      type="button"
                      className="btn-gold-action px-4 py-2"
                      style={{ borderRadius: '8px' }}
                      onClick={() => {
                        void aprobarPrestamo(item.id)
                      }}
                      disabled={approvingId === item.id}
                    >
                      {approvingId === item.id ? 'Aprobando...' : 'Aprobar'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {selectedLoanDetail && (
            <div className="reference-box p-4 mt-3">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="text-white mb-1">
                    {selectedLoanDetail.cliente_nombre || 'Cliente sin nombre'}
                  </h5>
                  <p className="text-white-50 small mb-0">
                    DPI: {selectedLoanDetail.cliente_dpi || '—'} • Tel:{' '}
                    {selectedLoanDetail.cliente_telefono || '—'}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-modern-dark px-3 py-2"
                  style={{ borderRadius: '8px' }}
                  onClick={() => setSelectedLoanDetail(null)}
                >
                  Cerrar
                </button>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Préstamo</small>
                    <strong className="text-white">#{selectedLoanDetail.id}</strong>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Monto</small>
                    <strong className="text-gold">
                      Q {formatMoney(selectedLoanDetail.monto_solicitado)}
                    </strong>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Interés</small>
                    <strong className="text-white">
                      {selectedLoanDetail.interes}%
                    </strong>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Destino</small>
                    <strong className="text-white">
                      {selectedLoanDetail.destino_uso || '—'}
                    </strong>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Periodicidad</small>
                    <strong className="text-white">
                      {selectedLoanDetail.periodicidad || '—'}
                    </strong>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Cuotas</small>
                    <strong className="text-white">
                      {selectedLoanDetail.numero_cuotas || '—'}
                    </strong>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Mora</small>
                    <strong className="text-white">
                      {selectedLoanDetail.mora || '—'}%
                    </strong>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="inner-dark-box p-3">
                    <small className="text-white-50 d-block">Estado</small>
                    <strong className="text-white">
                      {selectedLoanDetail.estado_flujo || '—'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="monto-resultado-box p-3 mt-4 d-flex align-items-center justify-content-between">
                <strong className="text-white-50">Monto Total</strong>
                <strong className="text-gold" style={{ fontSize: '20px' }}>
                  Q {formatMoney(selectedLoanDetail.monto_total || selectedLoanDetail.total_pagar)}
                </strong>
              </div>

              <div className="mt-4">
                <h6 className="text-gold mb-3">Expediente del Cliente</h6>
                <div className="row g-3">
                  {/* Foto de Recibo de Luz del Cliente */}
                  {selectedLoanDetail.cliente_informacion_laboral
                    ?.foto_recibo_luz && (
                      <div className="col-md-4">
                        <div className="inner-dark-box p-2">
                          <small className="text-white-50 d-block mb-2 px-2 pt-1">
                            Recibo de Luz
                          </small>
                          <div
                            className="rounded overflow-hidden mb-2"
                            style={{ height: '140px', background: '#000' }}
                          >
                            <img
                              src={
                                selectedLoanDetail.cliente_informacion_laboral
                                  .foto_recibo_luz
                              }
                              alt="Recibo de Luz"
                              className="w-100 h-100"
                              style={{ objectFit: 'contain', cursor: 'pointer' }}
                              onClick={() =>
                                setPreviewImage(
                                  selectedLoanDetail.cliente_informacion_laboral!
                                    .foto_recibo_luz,
                                )
                              }
                            />
                          </div>
                          <button
                            type="button"
                            className="btn-link text-gold small px-2 pb-1 d-block border-0 bg-transparent p-0"
                            style={{ textDecoration: 'none', fontSize: '11px' }}
                            onClick={() =>
                              setPreviewImage(
                                selectedLoanDetail.cliente_informacion_laboral!
                                  .foto_recibo_luz,
                              )
                            }
                          >
                            Ampliar imagen
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Fotos del Cliente */}
                  {selectedLoanDetail.cliente_fotos?.map((foto) => (
                    <div key={foto.id} className="col-md-4">
                      <div className="inner-dark-box p-2">
                        <small className="text-white-50 d-block mb-2 px-2 pt-1">
                          {foto.descripcion === 'foto_vivienda'
                            ? 'Foto de Vivienda'
                            : foto.descripcion || 'Foto Cliente'}
                        </small>
                        <div
                          className="rounded overflow-hidden mb-2"
                          style={{ height: '140px', background: '#000' }}
                        >
                          <img
                            src={foto.ruta_archivo}
                            alt={foto.descripcion || 'Foto'}
                            className="w-100 h-100"
                            style={{ objectFit: 'contain', cursor: 'pointer' }}
                            onClick={() => setPreviewImage(foto.ruta_archivo)}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn-link text-gold small px-2 pb-1 d-block border-0 bg-transparent p-0"
                          style={{ textDecoration: 'none', fontSize: '11px' }}
                          onClick={() => setPreviewImage(foto.ruta_archivo)}
                        >
                          Ampliar imagen
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!selectedLoanDetail.cliente_fotos ||
                    selectedLoanDetail.cliente_fotos.length === 0) &&
                    !selectedLoanDetail.cliente_informacion_laboral
                      ?.foto_recibo_luz && (
                      <div className="col-12">
                        <div className="inner-dark-box p-3 text-white-50">
                          No hay fotos del cliente disponibles.
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="mt-4">
                <h6 className="text-gold mb-3">Garantías</h6>

                {selectedLoanDetail.garantias?.length ? (
                  selectedLoanDetail.garantias.map((garantia, index) => (
                    <div
                      key={garantia.id || index}
                      className="inner-dark-box p-4 mb-3"
                    >
                      <h6 className="text-gold mb-3">GARANTÍA {index + 1}</h6>

                      <div className="row g-3">
                        <div className="col-md-4">
                          <small className="text-white-50 d-block">
                            Descripción
                          </small>
                          <strong className="text-white">
                            {garantia.descripcion || '—'}
                          </strong>
                        </div>

                        <div className="col-md-4">
                          <small className="text-white-50 d-block">
                            Categoría
                          </small>
                          <strong className="text-white">
                            {garantia.tipo_garantia || '—'}
                          </strong>
                        </div>

                        <div className="col-md-4">
                          <small className="text-white-50 d-block">
                            Valor estimado
                          </small>
                          <strong className="text-gold">
                            Q {formatMoney(garantia.valor_estimado)}
                          </strong>
                        </div>

                        <div className="col-md-4">
                          <small className="text-white-50 d-block">
                            Estado general
                          </small>
                          <strong className="text-white">
                            {garantia.estado_garantia || '—'}
                          </strong>
                        </div>
                      </div>

                      {garantia.fotos && garantia.fotos.length > 0 && (
                        <div className="mt-4">
                          <small className="text-white-50 d-block mb-3">
                            Fotografías de la Garantía
                          </small>
                          <div className="row g-2">
                            {garantia.fotos.map((foto, fIdx) => (
                              <div key={fIdx} className="col-md-3">
                                <div
                                  className="rounded overflow-hidden border border-secondary"
                                  style={{
                                    height: '100px',
                                    background: '#000',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() =>
                                    setPreviewImage(foto.ruta_archivo || null)
                                  }
                                >
                                  <img
                                    src={foto.ruta_archivo || ''}
                                    alt={foto.descripcion || 'Garantía'}
                                    className="w-100 h-100"
                                    style={{ objectFit: 'contain' }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="inner-dark-box p-3 text-white-50">
                    No hay garantías registradas.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </>
  )
}

function VistaDesembolsoPendiente() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<PrestamoItem[]>([])
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [disbursingId, setDisbursingId] = useState<number | null>(null)

  const loadData = async (search = query.trim()) => {
    setError('')
    setLoading(true)

    try {
      const { data } = await axios.get<PrestamoItem[]>(
        `${API_BASE_URL}/loans/pending-disbursement/`,
        {
          params: search ? { q: search } : {},
          headers: authHeaders(),
        },
      )
      setItems(data)
    } catch (error) {
      setItems([])
      setError(getErrorDetail(error, 'No se pudieron cargar los desembolsos pendientes.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData('')
  }, [])

  const desembolsarPrestamo = async (loanId: number) => {
    setActionMessage('')
    setDisbursingId(loanId)

    try {
      await axios.post(
        `${API_BASE_URL}/loans/${loanId}/disburse/`,
        {},
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )
      setActionMessage(`Préstamo #${loanId} desembolsado correctamente.`)
      await loadData()
    } catch (error) {
      setActionMessage(getErrorDetail(error, 'No se pudo registrar el desembolso.'))
    } finally {
      setDisbursingId(null)
    }
  }

  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div className="form-icon-box me-3" style={{ borderColor: '#4ecdc4', background: 'rgba(78, 205, 196, 0.1)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
            Desembolsos Pendientes
          </h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
            Préstamos aprobados en espera de desembolso al acreedor.
          </span>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="inset-input-box">
            <input
              type="text"
              placeholder="Buscar por nombre del acreedor o No. de préstamo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void loadData())}
            />
            <button
              className="btn-gold-action ms-2 px-4 py-2"
              style={{ borderRadius: '8px' }}
              type="button"
              onClick={() => {
                void loadData()
              }}
              disabled={loading}
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      {error ? <div className="text-warning small mb-3">{error}</div> : null}
      {actionMessage ? <div className="text-success small mb-3">{actionMessage}</div> : null}

      <div className="d-flex flex-column gap-3">
        {items.length === 0 ? (
          <div className="reference-box p-4 text-center">
            <p className="text-white-50 small mb-0">
              No hay desembolsos pendientes para mostrar.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="reference-box p-4">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                <div>
                  <h5 className="text-white mb-1">
                    #{item.id} • {item.cliente_nombre}
                  </h5>
                  <p className="text-white-50 small mb-1">
                    DPI: {item.cliente_dpi || '—'} • Plan: {item.plan_nombre || '—'}
                  </p>
                  <p className="text-white-50 small mb-1">
                    Monto: Q {formatMoney(item.monto_solicitado)} • Fecha aprobación: {item.fecha_aprobacion || '—'}
                  </p>
                  <p className="text-white-50 small mb-0">
                    Estado: {item.estado_flujo}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-gold-action px-4 py-2"
                  style={{ borderRadius: '8px' }}
                  onClick={() => {
                    void desembolsarPrestamo(item.id)
                  }}
                  disabled={disbursingId === item.id}
                >
                  {disbursingId === item.id ? 'Desembolsando...' : 'Desembolsar'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

function VistaSimuladorPagos() {
  const [monto, setMonto] = useState<string>('')
  const [interes, setInteres] = useState<string>('')
  const [mora, setMora] = useState<string>('')
  const [numeroCuotas, setNumeroCuotas] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<SimulacionResponse | null>(null)

  const handleSimular = async () => {
    setError('')
    setResultado(null)

    const montoValue = Number(monto)
    const interesValue = Number(interes)
    const moraValue = Number(mora)
    const numeroCuotasValue = Number(numeroCuotas)

    if (
      monto.trim() === '' ||
      interes.trim() === '' ||
      mora.trim() === '' ||
      numeroCuotas.trim() === ''
    ) {
      setError('Todos los campos son obligatorios.')
      return
    }

    if (
      Number.isNaN(montoValue) ||
      Number.isNaN(interesValue) ||
      Number.isNaN(moraValue) ||
      Number.isNaN(numeroCuotasValue)
    ) {
      setError('Todos los campos deben contener valores numéricos válidos.')
      return
    }

    if (montoValue <= 0) {
      setError('El monto del préstamo debe ser mayor que 0.')
      return
    }

    if (interesValue <= 0) {
      setError('El interés no puede ser negativo o cero.')
      return
    }

    if (moraValue <= 0) {
      setError('La mora no puede ser negativa o cero.')
      return
    }

    if (numeroCuotasValue <= 0 || !Number.isInteger(numeroCuotasValue)) {
      setError('El número de cuotas debe ser un entero mayor que 0.')
      return
    }

    setLoading(true)

    try {
      const { data } = await axios.post<SimulacionResponse>(
        `${API_BASE_URL}/loans/simulate/`,
        {
          monto: montoValue,
          interes: interesValue,
          mora: moraValue,
          numero_cuotas: numeroCuotasValue,
        },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      setResultado(data)
    } catch (error) {
      setResultado(null)
      setError(getErrorDetail(error, 'No se pudo ejecutar la simulación.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div
          className="form-icon-box me-3"
          style={{
            borderColor: '#a78bfa',
            background: 'rgba(167, 139, 250, 0.1)',
          }}
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
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="8" y1="6" x2="16" y2="6"></line>
            <line x1="8" y1="10" x2="16" y2="10"></line>
            <line x1="8" y1="14" x2="12" y2="14"></line>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
            Simulador de Pagos
          </h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
            Calcula cuotas, intereses y mora antes de registrar un préstamo.
          </span>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <label className="form-label text-white-50 small mb-2">
            Monto del Préstamo
          </label>
          <div className="inset-input-box d-flex align-items-center">
            <span className="text-gold me-2 fw-bold">Q</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="flex-fill"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="col-md-3">
          <label className="form-label text-white-50 small mb-2">
            Interés (%)
          </label>
          <div className="inset-input-box d-flex align-items-center">
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="flex-fill"
              placeholder="Ej. 5"
              value={interes}
              onChange={(e) => setInteres(e.target.value)}
              required
            />
            <span className="text-white-50 ms-2 fw-bold">%</span>
          </div>
        </div>

        <div className="col-md-3">
          <label className="form-label text-white-50 small mb-2">
            Mora (%)
          </label>
          <div className="inset-input-box d-flex align-items-center">
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="flex-fill"
              placeholder="Ej. 5"
              value={mora}
              onChange={(e) => setMora(e.target.value)}
              required
            />
            <span className="text-white-50 ms-2 fw-bold">%</span>
          </div>
        </div>

        <div className="col-md-3">
          <label className="form-label text-white-50 small mb-2">
            Número de Cuotas
          </label>
          <div className="inset-input-box">
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Ej. 12"
              value={numeroCuotas}
              onChange={(e) => setNumeroCuotas(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <button
          type="button"
          className="btn-gold-action px-4 py-3"
          style={{ borderRadius: '10px' }}
          onClick={() => {
            void handleSimular()
          }}
          disabled={loading}
        >
          {loading ? 'SIMULANDO...' : 'SIMULAR'}
        </button>
      </div>

      {error ? <div className="text-warning small mb-3">{error}</div> : null}

      {resultado && (
        <div className="monto-resultado-box p-4">
          <p className="text-gold fw-bold mb-3" style={{ fontSize: '13px' }}>
            📊 Resultado de la Simulación
          </p>

          <div className="row g-3">
            <div className="col-md-3">
              <p className="text-white-50 small mb-1">Interés Calculado</p>
              <p className="text-white fw-bold mb-0">
                Q {formatMoney(resultado.total_interes)}
              </p>
            </div>

            <div className="col-md-3">
              <p className="text-white-50 small mb-1">Total sin Mora</p>
              <p className="text-gold fw-bold mb-0">
                Q {formatMoney(resultado.total_sin_mora)}
              </p>
            </div>

            <div className="col-md-3">
              <p className="text-white-50 small mb-1">Mora Estimada</p>
              <p className="text-white fw-bold mb-0">
                Q {formatMoney(resultado.mora_estimada)}
              </p>
            </div>

            <div className="col-md-3">
              <p className="text-white-50 small mb-1">Cuota Estimada</p>
              <p className="text-white fw-bold mb-0">
                Q {formatMoney(resultado.cuota_estimada)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function VistaPlanPersonalizado() {
  const [periodicidad, setPeriodicidad] = useState('')
  const [numeroCuotas, setNumeroCuotas] = useState<number>(0)
  const [interesPlan, setInteresPlan] = useState<number>(0)
  const [moraPlan, setMoraPlan] = useState<number>(0)
  const [montoPlan, setMontoPlan] = useState<number>(0)
  const [nombrePlan, setNombrePlan] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [planes, setPlanes] = useState<PlanItem[]>([])

  const montoTotalPlan =
    montoPlan > 0 && interesPlan >= 0 ? montoPlan + (montoPlan * interesPlan) / 100 : 0
  const cuotaEstimada =
    montoTotalPlan > 0 && numeroCuotas > 0 ? montoTotalPlan / numeroCuotas : 0

  const loadPlans = async () => {
    setLoadingPlans(true)

    try {
      const { data } = await axios.get<PlanItem[]>(`${API_BASE_URL}/loans/plans/`, {
        headers: authHeaders(),
      })
      setPlanes(data)
    } catch {
      setPlanes([])
    } finally {
      setLoadingPlans(false)
    }
  }

  useEffect(() => {
    void loadPlans()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!nombrePlan.trim()) {
      setError('El nombre del plan es obligatorio.')
      return
    }

    if (!periodicidad) {
      setError('Debes seleccionar la periodicidad.')
      return
    }

    if (!isPositiveInteger(numeroCuotas)) {
      setError('El número de cuotas debe ser un entero mayor que 0.')
      return
    }

    if (!isPositiveNumber(interesPlan)) {
      setError('El interés debe ser mayor que 0.')
      return
    }

    if (!isPositiveNumber(moraPlan)) {
      setError('La mora debe ser mayor que 0.')
      return
    }

    if (!isPositiveNumber(montoPlan)) {
      setError('El monto del préstamo debe ser mayor que 0.')
      return
    }

    setLoading(true)

    try {
      await axios.post(
        `${API_BASE_URL}/loans/plans/`,
        {
          nombre_plan: nombrePlan,
          periodicidad,
          numero_cuotas: numeroCuotas,
          interes: interesPlan,
          mora: moraPlan,
          monto_base: montoPlan,
          estado: 'vigente',
        },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      setMessage('Plan personalizado creado correctamente.')
      setNombrePlan('')
      setPeriodicidad('')
      setNumeroCuotas(0)
      setInteresPlan(0)
      setMoraPlan(0)
      setMontoPlan(0)
      await loadPlans()
    } catch (error) {
      setError(getErrorDetail(error, 'No se pudo crear el plan personalizado.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div className="form-icon-box me-3" style={{ borderColor: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>
            Planes Personalizados
          </h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
            Cree planes de pago especiales para clientes específicos.
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">01.</span> Nuevo Plan Personalizado
        </h6>

        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">Nombre del Plan *</label>
            <div className="inset-input-box">
              <input
                type="text"
                placeholder="Ej. Plan Especial - Cliente Preferente"
                required
                value={nombrePlan}
                onChange={(e) => setNombrePlan(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">Periodicidad *</label>
            <div className="inset-input-box pe-2">
              <select
                className="w-100 bg-transparent border-0 outline-none select-custom"
                required
                value={periodicidad}
                onChange={(e) => setPeriodicidad(e.target.value)}
              >
                <option value="">Seleccione...</option>
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Número de Cuotas *</label>
            <div className="inset-input-box">
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Ej. 12"
                required
                value={numeroCuotas || ''}
                onChange={(e) => setNumeroCuotas(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Interés (%) *</label>
            <div className="inset-input-box d-flex align-items-center">
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="flex-fill"
                placeholder="Ej. 3"
                required
                value={interesPlan || ''}
                onChange={(e) => setInteresPlan(Number(e.target.value))}
              />
              <span className="text-white-50 ms-2 fw-bold">%</span>
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Mora (%) *</label>
            <div className="inset-input-box d-flex align-items-center">
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="flex-fill"
                placeholder="Ej. 1"
                required
                value={moraPlan || ''}
                onChange={(e) => setMoraPlan(Number(e.target.value))}
              />
              <span className="text-white-50 ms-2 fw-bold">%</span>
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Monto del Préstamo *</label>
            <div className="inset-input-box d-flex align-items-center">
              <span className="text-gold me-2 fw-bold">Q</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="flex-fill"
                placeholder="0.00"
                required
                value={montoPlan || ''}
                onChange={(e) => setMontoPlan(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {montoPlan > 0 && interesPlan >= 0 && numeroCuotas > 0 && (
          <div className="row g-4 mb-5">
            <div className="col-12">
              <div className="monto-resultado-box p-4">
                <p className="text-gold fw-bold mb-3" style={{ fontSize: '13px' }}>
                  📊 Resumen del Plan
                </p>
                <div className="row g-3">
                  <div className="col-md-4">
                    <p className="text-white-50 small mb-1">Monto Total a Pagar</p>
                    <p className="text-gold fw-bold mb-0" style={{ fontSize: '16px' }}>
                      Q {formatMoney(montoTotalPlan)}
                    </p>
                  </div>
                  <div className="col-md-4">
                    <p className="text-white-50 small mb-1">Cuota Estimada</p>
                    <p className="text-white fw-bold mb-0" style={{ fontSize: '16px' }}>
                      Q {formatMoney(cuotaEstimada)}
                    </p>
                  </div>
                  <div className="col-md-4">
                    <p className="text-white-50 small mb-1">Duración</p>
                    <p className="text-white fw-bold mb-0" style={{ fontSize: '16px' }}>
                      {numeroCuotas} cuotas {periodicidad ? `(${periodicidad})` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {(error || message) && (
          <div className="mb-4">
            {error ? <div className="text-warning small">{error}</div> : null}
            {message ? <div className="text-success small">{message}</div> : null}
          </div>
        )}

        <div className="d-flex justify-content-end mt-4 pt-4 form-header-border">
          <button
            type="submit"
            className="btn-gold-action px-5 py-3 d-flex align-items-center gap-2"
            style={{ fontSize: '14px', borderRadius: '12px' }}
            disabled={loading}
          >
            {loading ? 'CREANDO...' : 'CREAR PLAN PERSONALIZADO'}
          </button>
        </div>
      </form>

      <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">02.</span> Planes Existentes
        </h6>

        {loadingPlans ? (
          <div className="reference-box p-4 text-center">
            <p className="text-white-50 small mb-0">Cargando planes...</p>
          </div>
        ) : planes.length === 0 ? (
          <div className="reference-box p-4 text-center">
            <p className="text-white-50 small mb-0">No hay planes disponibles.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {planes.map((plan) => (
              <div key={plan.id} className="reference-box p-4">
                <h6 className="text-white mb-2">{plan.nombre_plan}</h6>
                <p className="text-white-50 small mb-1">
                  Periodicidad: {plan.periodicidad || '—'} • Cuotas: {plan.numero_cuotas}
                </p>
                <p className="text-white-50 small mb-1">
                  Interés: {plan.interes}% • Mora: {plan.mora}%
                </p>
                <p className="text-white-50 small mb-0">
                  Monto base: Q {formatMoney(plan.monto_base)} • Estado: {plan.estado}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default LoansPage