import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import axios, { type AxiosError } from 'axios'
import '../dashboard/dashboard.css'
import './creditors.css'
import {
  API_BASE_URL,
  authHeaders,
  hasPermission,
  type SessionUser,
} from '../../lib'

type CreditorsTabKey = 'nuevo' | 'buscar' | 'lista_negra'

type CreditorsPageProps = {
  user: SessionUser | null
}

type TabConfig = {
  key: CreditorsTabKey
  label: string
  visible: boolean
}

type SearchResult = {
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

type ClienteDetail = SearchResult & {
  ingresos_mensuales: string
  egreso_aproximado_mensual: string
  fecha_nacimiento: string | null
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

type BlacklistItem = {
  id: number
  fecha_ingreso: string
  acreedor: SearchResult
}

type ReferenceForm = {
  nombres: string
  apellidos: string
  telefono: string
  parentesco: string
  direccion: string
}

type FormState = {
  nombres: string
  apellidos: string
  dpi: string
  nit: string
  fecha_nacimiento: string

  telefono_principal: string
  telefono_secundario: string
  telefono_trabajo: string

  direccion: string
  departamento: string
  municipio: string
  distrito: string

  lugar_trabajo: string
  direccion_trabajo: string
  puesto: string
  tiempo_laborando: string
  ingresos_mensuales: string
  egreso_aproximado_mensual: string
  otras_fuentes_ingreso: string

  foto_vivienda: string
  foto_recibo_luz: string

  observaciones: string
}

type ErrorResponseData = {
  detail?: string
  dpi?: string[]
  referencias?: string[]
}

const INITIAL_FORM: FormState = {
  nombres: '',
  apellidos: '',
  dpi: '',
  nit: '',
  fecha_nacimiento: '',

  telefono_principal: '',
  telefono_secundario: '',
  telefono_trabajo: '',

  direccion: '',
  departamento: '',
  municipio: '',
  distrito: '',

  lugar_trabajo: '',
  direccion_trabajo: '',
  puesto: '',
  tiempo_laborando: '',
  ingresos_mensuales: '',
  egreso_aproximado_mensual: '',
  otras_fuentes_ingreso: '',

  foto_vivienda: '',
  foto_recibo_luz: '',

  observaciones: '',
}

const INITIAL_REFERENCES: ReferenceForm[] = [
  { nombres: '', apellidos: '', telefono: '', parentesco: '', direccion: '' },
  { nombres: '', apellidos: '', telefono: '', parentesco: '', direccion: '' },
  { nombres: '', apellidos: '', telefono: '', parentesco: '', direccion: '' },
]

// Mapa de departamentos a municipios
const MUNICIPALITIES_MAP: Record<string, string[]> = {
  Totonicapan: [
    'Totonicapán (Cabecera)',
    'San Cristóbal Totonicapán',
    'San Francisco El Alto',
    'Santa María Chiquimula',
    'San Bartolo',
    'San Andrés Xecul',
    'Momostenango',
    'Santa Lucía la Reforma',

  ],
  Quetzaltenango: [
    'Quetzaltenango (Cabecera)',
    'Salcajá',
    'Olintepeque',
    'San Carlos Sija',
    'Sibilia',
    'Cabricán',
    'Cajolá',
    'San Miguel Sigüilá',
    'Ostuncalco',
    'San Mateo',
    'Concepción Chiquirichapa',
    'San Martín Sacatepéquez',
    'Almolonga',
    'Cantel',
    'Zunil',
    'Colomba Costa Cuca',
    'El Palmar',
    'Coatepeque',
    'Génova',
    'Flores Costa Cuca',
    'La Esperanza',
    'Palestina de los Altos',
    'Huitán',
    'San Francisco La Unión',
  ],
  Guatemala: [
    'Guatemala (Cabecera)',
    'Santa Catarina Pinula',
    'San José Pinula',
    'San José del Golfo',
    'Palencia',
    'Chinautla',
    'San Pedro Ayampuc',
    'Mixco',
    'San Pedro Sacatepéquez',
    'San Juan Sacatepéquez',
    'San Raymundo',
    'Chuarrancho',
    'Fraijanes',
    'Amatitlán',
    'Villa Nueva',
    'Villa Canales',
    'Petapa'

  ],
}

function getErrorDetail(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponseData>
    const data = axiosError.response?.data

    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail
    }

    if (Array.isArray(data?.dpi) && typeof data.dpi[0] === 'string') {
      return data.dpi[0]
    }

    if (
      Array.isArray(data?.referencias) &&
      typeof data.referencias[0] === 'string'
    ) {
      return data.referencias[0]
    }
  }

  return fallback
}

function CreditorsPage({ user }: CreditorsPageProps) {
  const [activeTab, setActiveTab] = useState<CreditorsTabKey>('nuevo')

  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [references, setReferences] =
    useState<ReferenceForm[]>(INITIAL_REFERENCES)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [uploadingVivienda, setUploadingVivienda] = useState(false)
  const [uploadingRecibo, setUploadingRecibo] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])

  const [blacklistLoading, setBlacklistLoading] = useState(false)
  const [blacklistError, setBlacklistError] = useState('')
  const [blacklistItems, setBlacklistItems] = useState<BlacklistItem[]>([])
  const [blacklistQuery, setBlacklistQuery] = useState('')

  const [blacklistCandidateQuery, setBlacklistCandidateQuery] = useState('')
  const [blacklistCandidates, setBlacklistCandidates] = useState<SearchResult[]>(
    [],
  )
  const [blacklistCandidateLoading, setBlacklistCandidateLoading] =
    useState(false)
  const [blacklistActionLoading, setBlacklistActionLoading] = useState<
    number | null
  >(null)
  const [blacklistActionMessage, setBlacklistActionMessage] = useState('')
  const [selectedDetail, setSelectedDetail] = useState<ClienteDetail | null>(
    null,
  )
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const canCreate = hasPermission(user, 'crear_cliente')
  const canSearch = hasPermission(user, [
    'buscar_cliente',
    'crear_cliente',
    'ver_cliente',
  ])
  const canValidateBlacklist = hasPermission(user, 'validar_lista_negra')
  const canViewBlacklist = hasPermission(user, 'ver_lista_negra')
  const canAssignBlacklist = hasPermission(user, 'agregar_lista_negra')

  const roleName = user?.role?.trim().toLowerCase() ?? ''
  const hideBlacklistForRole =
    roleName === 'asesor' || roleName === 'secretaria'

  const tabs = useMemo<TabConfig[]>(
    () => [
      {
        key: 'nuevo',
        label: 'Nuevo Cliente',
        visible: canCreate,
      },
      {
        key: 'buscar',
        label: 'Buscar Cliente',
        visible: canSearch,
      },
      {
        key: 'lista_negra',
        label: canViewBlacklist ? 'Lista Negra' : 'Validar Lista Negra',
        visible:
          !hideBlacklistForRole && (canViewBlacklist || canValidateBlacklist),
      },
    ],
    [
      canCreate,
      canSearch,
      canValidateBlacklist,
      canViewBlacklist,
      hideBlacklistForRole,
    ],
  )

  const visibleTabs = tabs.filter((tab) => tab.visible)

  const safeActiveTab: CreditorsTabKey = visibleTabs.some(
    (tab) => tab.key === activeTab,
  )
    ? activeTab
    : visibleTabs[0]?.key ?? 'buscar'

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Lista de municipios según el departamento seleccionado
  const municipalities = useMemo(
    () => MUNICIPALITIES_MAP[form.departamento] ?? [],
    [form.departamento],
  )

  // Si se cambia el departamento y el municipio actual no está en la nueva lista, limpiarlo
  useEffect(() => {
    if (form.municipio && !municipalities.includes(form.municipio)) {
      updateForm('municipio', '')
    }
  }, [form.departamento, municipalities]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateReference = (
    index: number,
    field: keyof ReferenceForm,
    value: string,
  ) => {
    setReferences((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  const handlePhotoSelection = async (
    field: 'foto_vivienda' | 'foto_recibo_luz',
    file: File | null,
  ) => {
    if (!file) return

    const formData = new FormData()
    formData.append('archivo', file)
    formData.append('descripcion', field)

    if (field === 'foto_vivienda') setUploadingVivienda(true)
    else setUploadingRecibo(true)

    try {
      const { data } = await axios.post(`${API_BASE_URL}/creditors/upload-photo/`, formData, {
        headers: {
          ...authHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      })
      updateForm(field, data.ruta_archivo)
      setSaveMessage('Imagen subida correctamente.')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err) {
      console.error('Error uploading photo', err)
      setSaveError('No se pudo subir la imagen al servidor. Verifica tu conexión.')
    } finally {
      if (field === 'foto_vivienda') setUploadingVivienda(false)
      else setUploadingRecibo(false)
    }
  }

  const resetCreateForm = () => {
    setForm(INITIAL_FORM)
    setReferences(INITIAL_REFERENCES)
  }

  const buildCreatePayload = () => {
    const cleanedReferences = references
      .map((ref) => ({
        nombres: ref.nombres.trim(),
        apellidos: ref.apellidos.trim(),
        telefono: ref.telefono.trim(),
        parentesco: ref.parentesco.trim(),
        direccion: ref.direccion.trim(),
      }))
      .filter(
        (ref, index) =>
          index === 0 || ref.nombres || ref.apellidos || ref.telefono,
      )

    return {
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      dpi: form.dpi.trim(),
      nit: form.nit.trim(),
      fecha_nacimiento: form.fecha_nacimiento || null,

      telefono_principal: form.telefono_principal.trim(),
      telefono_secundario: form.telefono_secundario.trim(),
      telefono_trabajo: form.telefono_trabajo.trim(),

      direccion: form.direccion.trim(),
      departamento: form.departamento.trim(),
      municipio: form.municipio.trim(),
      distrito: form.distrito.trim(),

      lugar_trabajo: form.lugar_trabajo.trim(),
      direccion_trabajo: form.direccion_trabajo.trim(),
      puesto: form.puesto.trim(),
      tiempo_laborando: form.tiempo_laborando.trim(),
      ingresos_mensuales: form.ingresos_mensuales || '0',
      egreso_aproximado_mensual: form.egreso_aproximado_mensual || '0',
      otras_fuentes_ingreso: form.otras_fuentes_ingreso.trim(),

      foto_vivienda: form.foto_vivienda.trim(),
      foto_recibo_luz: form.foto_recibo_luz.trim(),

      observaciones: form.observaciones.trim(),
      referencias: cleanedReferences,
    }
  }

  const handleCreateSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault()
    setSaveError('')
    setSaveMessage('')

    const hasDigit = (s: string) => /\d/.test(s)
    // validaciones cliente-lado
    if (!form.nombres.trim() || hasDigit(form.nombres)) {
      setSaveError('El nombre no puede contener números y es obligatorio.')
      return
    }
    if (!form.apellidos.trim() || hasDigit(form.apellidos)) {
      setSaveError('Los apellidos no pueden contener números y son obligatorios.')
      return
    }
    const dpiDigits = (form.dpi || '').replace(/\D/g, '')
    if (dpiDigits.length !== 13) {
      setSaveError('El DPI debe contener exactamente 13 dígitos.')
      return
    }

    // Validación NIT: opcional, pero si se proporciona debe ser 13 caracteres alfanuméricos
    const nitClean = (form.nit || '').replace(/\s/g, '')
    if (nitClean && !/^[A-Za-z0-9]{13}$/.test(nitClean)) {
      setSaveError('El NIT debe contener exactamente 13 caracteres alfanuméricos si se proporciona.')
      return
    }

    const cleanPhone = (p: string) => (p || '').replace(/\D/g, '')
    if (cleanPhone(form.telefono_principal).length !== 8) {
      setSaveError('El teléfono principal debe contener exactamente 8 dígitos.')
      return
    }
    if (form.telefono_secundario && cleanPhone(form.telefono_secundario).length !== 8) {
      setSaveError('El teléfono secundario debe contener exactamente 8 dígitos si se proporciona.')
      return
    }
    if (form.telefono_trabajo && cleanPhone(form.telefono_trabajo).length !== 8) {
      setSaveError('El teléfono de trabajo debe contener exactamente 8 dígitos si se proporciona.')
      return
    }
    if (form.lugar_trabajo && hasDigit(form.lugar_trabajo)) {
      setSaveError('El lugar de trabajo no puede contener números.')
      return
    }
    if (form.puesto && hasDigit(form.puesto)) {
      setSaveError('El puesto no puede contener números.')
      return
    }

    // Validar ingresos y egresos: deben ser números y no negativos
    const ingresosNum = Number(form.ingresos_mensuales)
    const egresosNum = Number(form.egreso_aproximado_mensual)
    if (Number.isNaN(ingresosNum) || ingresosNum < 0) {
      setSaveError('Los ingresos mensuales deben ser un número mayor o igual a 0.')
      return
    }
    if (Number.isNaN(egresosNum) || egresosNum < 0) {
      setSaveError('Los egresos mensuales deben ser un número mayor o igual a 0.')
      return
    }

    // validar referencias
    for (let i = 0; i < references.length; i++) {
      const r = references[i]
      if (!r.nombres.trim()) {
        if (i === 0) {
          setSaveError('La referencia 1 es obligatoria.')
          return
        }
        continue
      }
      if (hasDigit(r.nombres) || (r.apellidos && hasDigit(r.apellidos)) || (r.parentesco && hasDigit(r.parentesco))) {
        setSaveError('Los nombres/apellidos/parentesco de las referencias no pueden contener números.')
        return
      }
      if (r.telefono && r.telefono.replace(/\D/g, '').length !== 8) {
        setSaveError('El teléfono de referencia debe contener exactamente 8 dígitos si se proporciona.')
        return
      }
    }
    // normal flow
    if (!references[0].nombres.trim()) {
      setSaveError('La referencia 1 es obligatoria.')
      return
    }

    setSaving(true)

    try {
      const payload = buildCreatePayload()

      await axios.post(`${API_BASE_URL}/creditors/`, payload, {
        headers: {
          ...authHeaders(),
          'Content-Type': 'application/json',
        },
      })

      setSaveMessage('Cliente registrado correctamente.')
      resetCreateForm()
    } catch (error: unknown) {
      setSaveError(getErrorDetail(error, 'No se pudo registrar el cliente.'))
    } finally {
      setSaving(false)
    }
  }

  const handleSearch = async (): Promise<void> => {
    setSearchError('')
    setSearching(true)

    try {
      const { data } = await axios.get<SearchResult[]>(
        `${API_BASE_URL}/creditors/search/`,
        {
          params: { q: searchQuery.trim() },
          headers: authHeaders(),
        },
      )

      setSearchResults(data)
    } catch (error: unknown) {
      setSearchError(
        getErrorDetail(error, 'No se pudo realizar la búsqueda.'),
      )
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const verDetalleCliente = async (clienteId: number): Promise<void> => {
    setLoadingDetail(true)
    setSearchError('')

    try {
      const { data } = await axios.get<ClienteDetail>(
        `${API_BASE_URL}/creditors/${clienteId}/`,
        {
          headers: authHeaders(),
        },
      )
      setSelectedDetail(data)
    } catch (error: unknown) {
      setSelectedDetail(null)
      setSearchError(
        getErrorDetail(error, 'No se pudo cargar el detalle del cliente.'),
      )
    } finally {
      setLoadingDetail(false)
    }
  }

  const loadBlacklist = useCallback(
    async (query: string = blacklistQuery.trim()): Promise<void> => {
      setBlacklistError('')
      setBlacklistLoading(true)

      try {
        const { data } = await axios.get<BlacklistItem[]>(
          `${API_BASE_URL}/creditors/blacklist/`,
          {
            params: query ? { q: query } : {},
            headers: authHeaders(),
          },
        )

        setBlacklistItems(data)
      } catch (error: unknown) {
        setBlacklistError(
          getErrorDetail(error, 'No se pudo cargar la lista negra.'),
        )
        setBlacklistItems([])
      } finally {
        setBlacklistLoading(false)
      }
    },
    [blacklistQuery],
  )

  const handleBlacklistCandidateSearch = async (): Promise<void> => {
    setBlacklistActionMessage('')
    setBlacklistCandidateLoading(true)

    try {
      const { data } = await axios.get<SearchResult[]>(
        `${API_BASE_URL}/creditors/search/`,
        {
          params: { q: blacklistCandidateQuery.trim() },
          headers: authHeaders(),
        },
      )

      setBlacklistCandidates(data)
    } catch {
      setBlacklistCandidates([])
    } finally {
      setBlacklistCandidateLoading(false)
    }
  }

  const handleAddToBlacklist = async (clienteId: number): Promise<void> => {
    setBlacklistActionMessage('')
    setBlacklistActionLoading(clienteId)

    try {
      await axios.post(
        `${API_BASE_URL}/creditors/blacklist/`,
        { cliente_id: clienteId },
        {
          headers: {
            ...authHeaders(),
            'Content-Type': 'application/json',
          },
        },
      )

      setBlacklistActionMessage('Cliente agregado a lista negra.')
      await loadBlacklist()
      await handleBlacklistCandidateSearch()
    } catch (error: unknown) {
      setBlacklistActionMessage(
        getErrorDetail(error, 'No se pudo agregar a lista negra.'),
      )
    } finally {
      setBlacklistActionLoading(null)
    }
  }

  useEffect(() => {
    if (
      safeActiveTab === 'lista_negra' &&
      !hideBlacklistForRole &&
      canViewBlacklist
    ) {
      void loadBlacklist()
    }
  }, [safeActiveTab, hideBlacklistForRole, canViewBlacklist, loadBlacklist])

  const renderView = () => {
    switch (safeActiveTab) {
      case 'nuevo':
        return canCreate ? (
          <VistaNuevoCliente
            form={form}
            references={references}
            saving={saving}
            saveMessage={saveMessage}
            saveError={saveError}
            onChange={updateForm}
            onReferenceChange={updateReference}
            onPhotoSelection={handlePhotoSelection}
            onSubmit={handleCreateSubmit}
            municipalities={municipalities} // <-- pasar municipios dinámicos
          />
        ) : (
          <VistaSinPermiso mensaje="No tienes permiso para registrar clientes." />
        )

      case 'buscar':
        return canSearch ? (
          <VistaBuscarCliente
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSearch={handleSearch}
            searching={searching}
            error={searchError}
            results={searchResults}
            onViewDetail={verDetalleCliente}
            loadingDetail={loadingDetail}
            selectedDetail={selectedDetail}
            onCloseDetail={() => setSelectedDetail(null)}
            previewImage={previewImage}
            setPreviewImage={setPreviewImage}
          />
        ) : (
          <VistaSinPermiso mensaje="No tienes permiso para consultar clientes." />
        )

      case 'lista_negra':
        return !hideBlacklistForRole &&
          (canViewBlacklist || canValidateBlacklist) ? (
          <VistaListaNegra
            canViewFullList={canViewBlacklist}
            canValidateOnly={canValidateBlacklist && !canViewBlacklist}
            canAssign={canAssignBlacklist}
            blacklistQuery={blacklistQuery}
            setBlacklistQuery={setBlacklistQuery}
            onLoadBlacklist={() => {
              void loadBlacklist()
            }}
            blacklistLoading={blacklistLoading}
            blacklistError={blacklistError}
            blacklistItems={blacklistItems}
            candidateQuery={blacklistCandidateQuery}
            setCandidateQuery={setBlacklistCandidateQuery}
            onSearchCandidates={() => {
              void handleBlacklistCandidateSearch()
            }}
            candidateLoading={blacklistCandidateLoading}
            candidates={blacklistCandidates}
            onAddToBlacklist={(id) => {
              void handleAddToBlacklist(id)
            }}
            actionLoading={blacklistActionLoading}
            actionMessage={blacklistActionMessage}
          />
        ) : (
          <VistaSinPermiso mensaje="No tienes permiso para consultar la lista negra." />
        )

      default:
        return (
          <VistaBuscarCliente
            query=""
            onQueryChange={() => {}}
            onSearch={() => {}}
            searching={false}
            error=""
            results={[]}
            onViewDetail={() => {}}
            loadingDetail={false}
            selectedDetail={null}
            onCloseDetail={() => {}}
            previewImage={previewImage}
            setPreviewImage={setPreviewImage}
          />
        )
    }
  }

  if (visibleTabs.length === 0) {
    return (
      <VistaSinPermiso mensaje="Tu rol no tiene acceso al módulo de clientes." />
    )
  }

  return (
    <div className="w-100 d-flex flex-column">
      <div className="mb-4">
        <div className="d-flex gap-3 tabs-container flex-wrap">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`tab-btn ${safeActiveTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="extruded-form-card p-4 p-lg-5 flex-fill overflow-auto overflow-x-hidden custom-scrollbar">
        {renderView()}
      </div>
    </div>
  )
}

function VistaSinPermiso({ mensaje }: { mensaje: string }) {
  return (
    <div
      className="w-100 d-flex flex-column align-items-center justify-content-center text-center"
      style={{ minHeight: '280px' }}
    >
      <div className="form-icon-box mb-3">
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
          <path d="M12 8v4"></path>
          <path d="M12 16h.01"></path>
        </svg>
      </div>
      <h4 className="text-white fw-bold mb-2">Acceso restringido</h4>
      <p className="text-white-50 mb-0">{mensaje}</p>
    </div>
  )
}

function VistaNuevoCliente({
  form,
  references,
  saving,
  saveMessage,
  saveError,
  onChange,
  onReferenceChange,
  onPhotoSelection,
  onSubmit,
  municipalities, // nuevo prop
}: {
  form: FormState
  references: ReferenceForm[]
  saving: boolean
  saveMessage: string
  saveError: string
  onChange: (field: keyof FormState, value: string) => void
  onReferenceChange: (
    index: number,
    field: keyof ReferenceForm,
    value: string,
  ) => void
  onPhotoSelection: (
    field: 'foto_vivienda' | 'foto_recibo_luz',
    file: File | null,
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  municipalities: string[] // tipo
}) {
  return (
    <div className="w-100 d-flex flex-column">
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
          <h4
            className="text-white fw-bold mb-1"
            style={{ letterSpacing: '0.5px' }}
          >
            Registro de Nuevo Cliente
          </h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
            Los campos marcados con (*) son obligatorios.
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">01.</span> Información Personal
        </h6>

        <div className="row g-4 mb-5">
          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              Nombres *
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                value={form.nombres}
                onChange={(e) => onChange('nombres', e.target.value)}
                placeholder="Ej. Juan Carlos"
                required
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              Apellidos *
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                value={form.apellidos}
                onChange={(e) => onChange('apellidos', e.target.value)}
                placeholder="Ej. Pérez López"
                required
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">DPI *</label>
            <div className="inset-input-box">
              <input
                type="text"
                value={form.dpi}
                onChange={(e) => onChange('dpi', e.target.value)}
                placeholder="13 dígitos sin espacios"
                required
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">NIT</label>
            <div className="inset-input-box">
              <input
                type="text"
                value={form.nit}
                onChange={(e) => onChange('nit', e.target.value)}
                placeholder="Ej. 1234567-8"
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              Fecha de Nacimiento
            </label>
            <div className="inset-input-box">
              <input
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) => onChange('fecha_nacimiento', e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              Teléfono Principal *
            </label>
            <div className="inset-input-box">
              <input
                type="tel"
                value={form.telefono_principal}
                onChange={(e) => onChange('telefono_principal', e.target.value)}
                placeholder="Ej. 5555-5555"
                required
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              Teléfono Secundario
            </label>
            <div className="inset-input-box">
              <input
                type="tel"
                value={form.telefono_secundario}
                onChange={(e) => onChange('telefono_secundario', e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">02.</span> Ubicación Domiciliar
        </h6>

        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">
              Departamento *
            </label>
            <div className="inset-input-box pe-2">
              <select
                className="w-100 bg-transparent border-0 outline-none select-custom"
                value={form.departamento}
                onChange={(e) => onChange('departamento', e.target.value)}
                required
              >
                <option value="">Seleccione...</option>
                <option value="Totonicapan">Totonicapán</option>
                <option value="Quetzaltenango">Quetzaltenango</option>
                <option value="Guatemala">Guatemala</option>
              </select>
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">
              Municipio *
            </label>
            <div className="inset-input-box pe-2">
              <select
                className="w-100 bg-transparent border-0 outline-none select-custom"
                value={form.municipio}
                onChange={(e) => onChange('municipio', e.target.value)}
                required
              >
                <option value="">Seleccione...</option>
                {municipalities.length > 0 ? (
                  municipalities.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Totonicapán (Cabecera)">Totonicapán (Cabecera)</option>
                    <option value="San Cristóbal Totonicapán">San Cristóbal Totonicapán</option>
                    <option value="San Francisco El Alto">San Francisco El Alto</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">
              Distrito / Cantón *
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                value={form.distrito}
                onChange={(e) => onChange('distrito', e.target.value)}
                placeholder="Ej. Cantón Xesacmalja"
                required
              />
            </div>
          </div>

          <div className="col-12">
            <label className="form-label text-white-50 small mb-2">
              Dirección Exacta *
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => onChange('direccion', e.target.value)}
                placeholder="Avenida, Calle, Lote, Referencias..."
                required
              />
            </div>
          </div>
        </div>

        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">03.</span> Laboral y Financiera
        </h6>

        <div className="row g-4 mb-5">
          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              ¿En qué trabaja?
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                value={form.lugar_trabajo}
                onChange={(e) => onChange('lugar_trabajo', e.target.value)}
                placeholder="Profesión u Oficio"
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              Puesto
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                value={form.puesto}
                onChange={(e) => onChange('puesto', e.target.value)}
                placeholder="Puesto o función"
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              Tiempo Laborando
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                value={form.tiempo_laborando}
                onChange={(e) => onChange('tiempo_laborando', e.target.value)}
                placeholder="Ej. 2 años"
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              Teléfono Trabajo
            </label>
            <div className="inset-input-box">
              <input
                type="tel"
                value={form.telefono_trabajo}
                onChange={(e) => onChange('telefono_trabajo', e.target.value)}
                placeholder="Ej. 5555-5555"
              />
            </div>
          </div>
        </div>

          <div className="col-12">
            <label className="form-label text-white-50 small mb-2">
              Dirección del Lugar de Trabajo
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                value={form.direccion_trabajo}
                onChange={(e) => onChange('direccion_trabajo', e.target.value)}
                placeholder="Dirección completa"
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              Ingresos Mensuales *
            </label>
            <div className="inset-input-box d-flex align-items-center">
              <span className="text-gold me-2 fw-bold">Q</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="flex-fill"
                value={form.ingresos_mensuales}
                onChange={(e) => onChange('ingresos_mensuales', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">
              Egresos Mensuales *
            </label>
            <div className="inset-input-box d-flex align-items-center">
              <span className="text-gold me-2 fw-bold">Q</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="flex-fill"
                value={form.egreso_aproximado_mensual}
                onChange={(e) =>
                  onChange('egreso_aproximado_mensual', e.target.value)
                }
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="col-12">
            <label className="form-label text-white-50 small mb-2">
              Otras Fuentes de Ingreso
            </label>
            <div className="inset-input-box">
              <input
                type="text"
                value={form.otras_fuentes_ingreso}
                onChange={(e) =>
                  onChange('otras_fuentes_ingreso', e.target.value)
                }
                placeholder="Opcional"
              />
            </div>
          </div>
        </div>

        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">04.</span> Respaldo Documental
        </h6>

        <div className="row g-4 mb-5">
          <div className="col-md-6">
            <div className="inset-upload-box p-4 d-flex flex-column align-items-center justify-content-center text-center">
              <p className="text-white mb-3 small">Foto de la Vivienda</p>
              <input
                id="foto_vivienda"
                type="file"
                className="d-none"
                onChange={(e) =>
                  onPhotoSelection(
                    'foto_vivienda',
                    e.target.files?.[0] ?? null,
                  )
                }
              />
              <label
                htmlFor="foto_vivienda"
                className="btn-modern-dark d-flex align-items-center gap-2"
                style={{ cursor: 'pointer' }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Seleccionar Imagen
              </label>
              {uploadingVivienda && (
                <div className="mt-2 text-gold small animate-pulse">
                  Subiendo imagen...
                </div>
              )}
              {form.foto_vivienda ? (
                <div className="mt-3 d-flex flex-column align-items-center">
                  <div className="rounded overflow-hidden mb-2" style={{ width: '80px', height: '60px', border: '1px solid #cca641' }}>
                    <img src={form.foto_vivienda} alt="Vivienda" className="w-100 h-100 object-fit-cover" />
                  </div>
                  <small
                    className="text-white-50 file-name"
                    title={form.foto_vivienda}
                  >
                    Imagen seleccionada
                  </small>
                </div>
              ) : null}
            </div>
          </div>

          <div className="col-md-6">
            <div className="inset-upload-box p-4 d-flex flex-column align-items-center justify-content-center text-center">
              <p className="text-white mb-3 small">Foto Recibo de Luz</p>
              <input
                id="foto_recibo_luz"
                type="file"
                className="d-none"
                onChange={(e) =>
                  onPhotoSelection(
                    'foto_recibo_luz',
                    e.target.files?.[0] ?? null,
                  )
                }
              />
              <label
                htmlFor="foto_recibo_luz"
                className="btn-modern-dark d-flex align-items-center gap-2"
                style={{ cursor: 'pointer' }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Seleccionar Imagen
              </label>
              {uploadingRecibo && (
                <div className="mt-2 text-gold small animate-pulse">
                  Subiendo imagen...
                </div>
              )}
              {form.foto_recibo_luz ? (
                <div className="mt-3 d-flex flex-column align-items-center">
                  <div className="rounded overflow-hidden mb-2" style={{ width: '80px', height: '60px', border: '1px solid #cca641' }}>
                    <img src={form.foto_recibo_luz} alt="Recibo" className="w-100 h-100 object-fit-cover" />
                  </div>
                  <small
                    className="text-white-50 file-name"
                    title={form.foto_recibo_luz}
                  >
                    Imagen seleccionada
                  </small>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">05.</span> Referencias Personales
        </h6>

        {[0, 1, 2].map((index) => (
          <div key={index} className="reference-box p-4 mb-3">
            <p
              className={`${index === 0 ? 'text-gold' : 'text-white-50'} fw-bold mb-3`}
              style={{
                fontSize: '13px',
                color: index === 0 ? '#cca641' : undefined,
              }}
            >
              Referencia {index + 1} {index === 0 ? '(Obligatoria)' : '(Opcional)'}
            </p>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="inset-input-box">
                  <input
                    type="text"
                    placeholder="Nombres"
                    value={references[index].nombres}
                    onChange={(e) =>
                      onReferenceChange(index, 'nombres', e.target.value)
                    }
                    required={index === 0}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="inset-input-box">
                  <input
                    type="text"
                    placeholder="Apellidos"
                    value={references[index].apellidos}
                    onChange={(e) =>
                      onReferenceChange(index, 'apellidos', e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="inset-input-box">
                  <input
                    type="tel"
                    placeholder="No. Teléfono"
                    value={references[index].telefono}
                    onChange={(e) =>
                      onReferenceChange(index, 'telefono', e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="inset-input-box">
                  <input
                    type="text"
                    placeholder="Parentesco"
                    value={references[index].parentesco}
                    onChange={(e) =>
                      onReferenceChange(index, 'parentesco', e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="inset-input-box">
                  <input
                    type="text"
                    placeholder="Dirección"
                    value={references[index].direccion}
                    onChange={(e) =>
                      onReferenceChange(index, 'direccion', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">06.</span> Observaciones
        </h6>

        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="inset-input-box">
              <input
                type="text"
                placeholder="Observaciones adicionales"
                value={form.observaciones}
                onChange={(e) => onChange('observaciones', e.target.value)}
              />
            </div>
          </div>
        </div>

        {(saveMessage || saveError) && (
          <div className="mb-4">
            {saveMessage ? <div className="text-success small">{saveMessage}</div> : null}
            {saveError ? <div className="text-warning small">{saveError}</div> : null}
          </div>
        )}

        <div className="d-flex justify-content-end mt-5 pt-4 form-header-border">
          <button
            type="submit"
            disabled={saving}
            className="btn-gold-action px-5 py-3 d-flex align-items-center justify-content-center gap-2"
            style={{ fontSize: '14px', borderRadius: '12px' }}
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
            {saving ? 'GUARDANDO...' : 'REGISTRAR CLIENTE'}
          </button>
        </div>
      </form>
    </div>
  )
}

function VistaBuscarCliente({
  query,
  onQueryChange,
  onSearch,
  searching,
  error,
  results,
  onViewDetail,
  loadingDetail,
  selectedDetail,
  onCloseDetail,
  previewImage,
  setPreviewImage,
}: {
  query: string
  onQueryChange: (value: string) => void
  onSearch: () => void
  searching: boolean
  error: string
  results: SearchResult[]
  onViewDetail: (id: number) => void
  loadingDetail: boolean
  selectedDetail: ClienteDetail | null
  onCloseDetail: () => void
  previewImage: string | null
  setPreviewImage: (url: string | null) => void
}) {
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
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <div>
          <h4
            className="text-white fw-bold mb-1"
            style={{ letterSpacing: '0.5px' }}
          >
            Búsqueda de Clientes
          </h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
            Busca por DPI, nombre, apellido, NIT o número de teléfono.
          </span>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="inset-input-box">
            <input
              type="text"
              placeholder="Ingrese el dato a buscar..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
            <button
              type="button"
              className="btn-gold-action ms-2 px-4 py-2"
              style={{ borderRadius: '8px' }}
              onClick={onSearch}
              disabled={searching}
            >
              {searching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="text-warning">{error}</p> : null}

      <div className="d-flex flex-column gap-3">
        {results.length === 0 ? (
          <p className="text-white-50 mb-0">No hay resultados para mostrar.</p>
        ) : (
          results.map((item) => (
            <div key={item.id} className="inner-dark-box p-4">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                <div className="flex-fill">
                  <h5 className="text-white mb-1">{item.nombre_completo}</h5>
                  <p className="text-white-50 mb-1">
                    DPI: {item.dpi || '—'} | NIT: {item.nit || '—'}
                  </p>
                  <p className="text-white-50 mb-1">
                    {item.departamento || '—'}, {item.municipio || '—'},{' '}
                    {item.distrito || '—'}
                  </p>
                  <p className="text-white-50 mb-1">
                    Dirección: {item.direccion || '—'}
                  </p>
                  <p className="text-white-50 mb-1">
                    Teléfonos:{' '}
                    {item.telefonos.length > 0
                      ? item.telefonos.map((t) => t.numero).join(', ')
                      : '—'}
                  </p>
                  <p className="text-white-50 mb-0">
                    Estado: {item.estado_cliente}{' '}
                    {item.en_lista_negra ? '• EN LISTA NEGRA' : ''}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-gold-action px-4 py-2"
                  style={{ borderRadius: '8px' }}
                  onClick={() => onViewDetail(item.id)}
                  disabled={loadingDetail && selectedDetail?.id === item.id}
                >
                  {loadingDetail && selectedDetail?.id === item.id
                    ? 'Cargando...'
                    : 'Ver detalles'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedDetail && (
        <div className="reference-box p-4 mt-5 animate-fade-in">
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
            <h5 className="text-white mb-0">
              <span className="text-gold me-2">Detalles:</span>
              {selectedDetail.nombre_completo}
            </h5>
            <button
              type="button"
              className="btn-modern-dark px-3 py-1"
              style={{ borderRadius: '6px', fontSize: '12px' }}
              onClick={onCloseDetail}
            >
              Cerrar
            </button>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <div className="inner-dark-box p-3">
                <small className="text-white-50 d-block">DPI</small>
                <strong className="text-white">
                  {selectedDetail.dpi || '—'}
                </strong>
              </div>
            </div>

            <div className="col-md-4">
              <div className="inner-dark-box p-3">
                <small className="text-white-50 d-block">NIT</small>
                <strong className="text-white">
                  {selectedDetail.nit || '—'}
                </strong>
              </div>
            </div>

            <div className="col-md-4">
              <div className="inner-dark-box p-3">
                <small className="text-white-50 d-block">Asesor</small>
                <strong className="text-white">
                  {selectedDetail.asesor_nombre || '—'}
                </strong>
              </div>
            </div>

            <div className="col-md-6">
              <div className="inner-dark-box p-3">
                <small className="text-white-50 d-block">Dirección</small>
                <strong className="text-white">
                  {selectedDetail.direccion || '—'}
                </strong>
              </div>
            </div>

            <div className="col-md-2">
              <div className="inner-dark-box p-3">
                <small className="text-white-50 d-block">Depto.</small>
                <strong className="text-white">
                  {selectedDetail.departamento || '—'}
                </strong>
              </div>
            </div>

            <div className="col-md-2">
              <div className="inner-dark-box p-3">
                <small className="text-white-50 d-block">Municipio</small>
                <strong className="text-white">
                  {selectedDetail.municipio || '—'}
                </strong>
              </div>
            </div>

            <div className="col-md-2">
              <div className="inner-dark-box p-3">
                <small className="text-white-50 d-block">Distrito</small>
                <strong className="text-white">
                  {selectedDetail.distrito || '—'}
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h6 className="text-gold mb-3" style={{ fontSize: '14px' }}>
              Teléfonos
            </h6>
            <div className="row g-3">
              {selectedDetail.telefonos.map((tel) => (
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
            <h6 className="text-gold mb-3" style={{ fontSize: '14px' }}>
              Información Laboral
            </h6>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="inner-dark-box p-3">
                  <small className="text-white-50 d-block">
                    Lugar de trabajo
                  </small>
                  <strong className="text-white">
                    {selectedDetail.informacion_laboral?.lugar_trabajo || '—'}
                  </strong>
                </div>
              </div>

              <div className="col-md-4">
                <div className="inner-dark-box p-3">
                  <small className="text-white-50 d-block">Puesto</small>
                  <strong className="text-white">
                    {selectedDetail.informacion_laboral?.puesto || '—'}
                  </strong>
                </div>
              </div>

              <div className="col-md-4">
                <div className="inner-dark-box p-3">
                  <small className="text-white-50 d-block">
                    Tiempo laborando
                  </small>
                  <strong className="text-white">
                    {selectedDetail.informacion_laboral?.tiempo_laborando ||
                      '—'}
                  </strong>
                </div>
              </div>

              <div className="col-md-6">
                <div className="inner-dark-box p-3">
                  <small className="text-white-50 d-block">
                    Ingresos Mensuales
                  </small>
                  <strong className="text-white">
                    Q {selectedDetail.ingresos_mensuales}
                  </strong>
                </div>
              </div>

              <div className="col-md-6">
                <div className="inner-dark-box p-3">
                  <small className="text-white-50 d-block">
                    Egresos Mensuales
                  </small>
                  <strong className="text-white">
                    Q {selectedDetail.egreso_aproximado_mensual}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h6 className="text-gold mb-3" style={{ fontSize: '14px' }}>
              Referencias
            </h6>
            <div className="row g-3">
              {selectedDetail.referencias.map((ref) => (
                <div key={ref.id} className="col-md-6">
                  <div className="inner-dark-box p-3">
                    <strong className="text-white d-block">
                      {ref.nombres}
                    </strong>
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
            <h6 className="text-gold mb-3" style={{ fontSize: '14px' }}>
              Fotografías
            </h6>
            <div className="row g-3">
              {/* Foto de Recibo de Luz (desde Información Laboral) */}
              {selectedDetail.informacion_laboral?.foto_recibo_luz && (
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
                        src={selectedDetail.informacion_laboral.foto_recibo_luz}
                        alt="Recibo de Luz"
                        className="w-100 h-100"
                        style={{ objectFit: 'contain', cursor: 'pointer' }}
                        onClick={() =>
                          setPreviewImage(
                            selectedDetail.informacion_laboral!.foto_recibo_luz,
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
                          selectedDetail.informacion_laboral!.foto_recibo_luz,
                        )
                      }
                    >
                      Ampliar imagen
                    </button>
                  </div>
                </div>
              )}

              {selectedDetail.fotos.length === 0 &&
              !selectedDetail.informacion_laboral?.foto_recibo_luz ? (
                <div className="col-12">
                  <div className="inner-dark-box p-3 text-white-50">
                    No hay fotografías registradas.
                  </div>
                </div>
              ) : (
                selectedDetail.fotos.map((foto) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <ImageModal
          src={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  )
}

function VistaListaNegra({
  canViewFullList,
  canValidateOnly,
  canAssign,
  blacklistQuery,
  setBlacklistQuery,
  onLoadBlacklist,
  blacklistLoading,
  blacklistError,
  blacklistItems,
  candidateQuery,
  setCandidateQuery,
  onSearchCandidates,
  candidateLoading,
  candidates,
  onAddToBlacklist,
  actionLoading,
  actionMessage,
}: {
  canViewFullList: boolean
  canValidateOnly: boolean
  canAssign: boolean
  blacklistQuery: string
  setBlacklistQuery: (value: string) => void
  onLoadBlacklist: () => void
  blacklistLoading: boolean
  blacklistError: string
  blacklistItems: BlacklistItem[]
  candidateQuery: string
  setCandidateQuery: (value: string) => void
  onSearchCandidates: () => void
  candidateLoading: boolean
  candidates: SearchResult[]
  onAddToBlacklist: (clienteId: number) => void
  actionLoading: number | null
  actionMessage: string
}) {
  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div
          className="form-icon-box me-3"
          style={{
            borderColor: '#ff4747',
            background: 'rgba(255, 71, 71, 0.1)',
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff4747"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div>
          <h4
            className="text-white fw-bold mb-1"
            style={{ letterSpacing: '0.5px' }}
          >
            Lista Negra
          </h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>
            {canViewFullList
              ? 'Clientes restringidos por incumplimiento o fraude.'
              : 'Solo puedes validar si una persona aparece restringida, sin consultar el listado completo.'}
          </span>
        </div>
      </div>

      {blacklistError ? <p className="text-warning">{blacklistError}</p> : null}
      {actionMessage ? (
        <p className="text-warning">{actionMessage}</p>
      ) : null}

      {canViewFullList && (
        <>
          <div className="inner-dark-box p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
              <h5 className="text-white mb-0">Registros restringidos</h5>
            </div>

            <div className="inset-input-box mb-3">
              <input
                type="text"
                placeholder="Buscar en lista negra por DPI o nombre..."
                value={blacklistQuery}
                onChange={(e) => setBlacklistQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onLoadBlacklist()}
              />
              <button
                type="button"
                className="btn-gold-action ms-2 px-4 py-2"
                style={{ borderRadius: '8px' }}
                onClick={onLoadBlacklist}
                disabled={blacklistLoading}
              >
                {blacklistLoading ? 'Cargando...' : 'Buscar'}
              </button>
            </div>

            <div className="d-flex flex-column gap-3">
              {blacklistItems.length === 0 ? (
                <p className="text-white-50 mb-0">
                  No hay registros en lista negra.
                </p>
              ) : (
                blacklistItems.map((item) => (
                  <div key={item.id} className="border border-secondary rounded p-3">
                    <h6 className="text-white mb-1">
                      {item.acreedor.nombre_completo}
                    </h6>
                    <p className="text-white-50 mb-1">
                      DPI: {item.acreedor.dpi || '—'}
                    </p>
                    <p className="text-white-50 mb-0">
                      Fecha ingreso:{' '}
                      {new Date(item.fecha_ingreso).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {canAssign && (
            <div className="inner-dark-box p-4">
              <h5 className="text-white mb-3">
                Agregar cliente a lista negra
              </h5>

              <div className="inset-input-box mb-3">
                <input
                  type="text"
                  placeholder="Buscar cliente por DPI o nombre..."
                  value={candidateQuery}
                  onChange={(e) => setCandidateQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearchCandidates()}
                />
                <button
                  type="button"
                  className="btn-gold-action ms-2 px-4 py-2"
                  style={{ borderRadius: '8px' }}
                  onClick={onSearchCandidates}
                  disabled={candidateLoading}
                >
                  {candidateLoading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              <div className="d-flex flex-column gap-3">
                {candidates.length === 0 ? (
                  <p className="text-white-50 mb-0">
                    No hay clientes para mostrar.
                  </p>
                ) : (
                  candidates.map((item) => (
                    <div
                      key={item.id}
                      className="border border-secondary rounded p-3 d-flex justify-content-between align-items-center gap-3 flex-wrap"
                    >
                      <div>
                        <h6 className="text-white mb-1">
                          {item.nombre_completo}
                        </h6>
                        <p className="text-white-50 mb-0">
                          DPI: {item.dpi || '—'}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="btn-gold-action px-4 py-2"
                        style={{ borderRadius: '8px' }}
                        onClick={() => onAddToBlacklist(item.id)}
                        disabled={
                          actionLoading === item.id || item.en_lista_negra
                        }
                      >
                        {item.en_lista_negra
                          ? 'Ya en lista negra'
                          : actionLoading === item.id
                            ? 'Agregando...'
                            : 'Agregar'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {canValidateOnly && (
        <div className="inner-dark-box p-4">
          <h5 className="text-white mb-3">Validación puntual</h5>
          <div className="inset-input-box mb-3">
            <input
              type="text"
              placeholder="Buscar por DPI o nombre del cliente..."
              value={blacklistQuery}
              onChange={(e) => setBlacklistQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onLoadBlacklist()}
            />
            <button
              type="button"
              className="btn-gold-action ms-2 px-4 py-2"
              style={{ borderRadius: '8px' }}
              onClick={onLoadBlacklist}
              disabled={blacklistLoading}
            >
              {blacklistLoading ? 'Validando...' : 'Validar'}
            </button>
          </div>

          <div className="d-flex flex-column gap-3">
            {blacklistItems.length === 0 ? (
              <p className="text-white-50 mb-0">
                Esta vista no expone el catálogo completo; solo confirma si el
                cliente está restringido.
              </p>
            ) : (
              blacklistItems.map((item) => (
                <div key={item.id} className="border border-secondary rounded p-3">
                  <h6 className="text-white mb-1">
                    {item.acreedor.nombre_completo}
                  </h6>
                  <p className="text-white-50 mb-0">Resultado: restringido</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default CreditorsPage