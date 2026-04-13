import "./loan.css"
import '../dashboard/dashboard.css';
import React, { useState } from 'react';

// =====================================================================
// Interfaz para una garantía individual
// =====================================================================
interface Garantia {
  descripcion: string;
  categoria: string;
  valorEstimado: string;
  estadoGeneral: string;
  estadoEspecifico: string;
  observaciones: string;
  fotos: { tipo: string; archivo: File | null }[];
}

// Garantía vacía por defecto
const crearGarantiaVacia = (): Garantia => ({
  descripcion: '',
  categoria: '',
  valorEstimado: '',
  estadoGeneral: '',
  estadoEspecifico: '',
  observaciones: '',
  fotos: [{ tipo: 'frontal', archivo: null }],
});

function LoansPage() {

  const [activeTab, setActiveTab] = useState('nueva');

  const renderView = () => {
    switch (activeTab) {
      case 'nueva':
        return <VistaNuevaSolicitud />;
      case 'solicitudes':
        return <VistaSolicitudPendiente />;
      case 'desembolsos':
        return <VistaDesembolsoPendiente />;
      case 'simulador':
        return <VistaSimuladorPagos />;
      case 'planes':
        return <VistaPlanPersonalizado />;
      default:
        return <VistaNuevaSolicitud />;
    }
  };

  return (
    <div className="w-100 h-100 d-flex flex-column">

      {/* ================= TABS SUPERIORES ================= */}
      <div className="mb-4">
        <div className="d-flex gap-3 tabs-container flex-wrap">
          <button
            className={`tab-btn ${activeTab === 'nueva' ? 'active' : ''}`}
            onClick={() => setActiveTab('nueva')}
          >
            Nueva Solicitud
          </button>
          <button
            className={`tab-btn ${activeTab === 'solicitudes' ? 'active' : ''}`}
            onClick={() => setActiveTab('solicitudes')}
          >
            Solicitudes Pendientes
          </button>
          <button
            className={`tab-btn ${activeTab === 'desembolsos' ? 'active' : ''}`}
            onClick={() => setActiveTab('desembolsos')}
          >
            Desembolsos Pendientes
          </button>
          <button
            className={`tab-btn ${activeTab === 'simulador' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulador')}
          >
            Simulador de Pagos
          </button>
          <button
            className={`tab-btn ${activeTab === 'planes' ? 'active' : ''}`}
            onClick={() => setActiveTab('planes')}
          >
            Planes Personalizados
          </button>
        </div>
      </div>

      {/* ================= CONTENEDOR DINÁMICO ================= */}
      <div className="extruded-form-card p-4 p-lg-5 flex-fill overflow-auto custom-scrollbar">
        {renderView()}
      </div>
    </div>
  );
}

// =====================================================================
// SUB-COMPONENTES
// =====================================================================

// Vista 1: Formulario de nueva solicitud de préstamo
function VistaNuevaSolicitud() {
  const [usePlanPersonalizado, setUsePlanPersonalizado] = useState(false);
  const [monto, setMonto] = useState<number>(0);
  const [interes, setInteres] = useState<number>(0);
  const [garantias, setGarantias] = useState<Garantia[]>([crearGarantiaVacia()]);

  // Cálculo del monto a pagar
  const montoAPagar = monto > 0 && interes > 0 ? monto + (monto * interes / 100) : 0;

  // Agregar nueva garantía
  const agregarGarantia = () => {
    setGarantias([...garantias, crearGarantiaVacia()]);
  };

  // Eliminar garantía (no permite eliminar la primera)
  const eliminarGarantia = (index: number) => {
    if (index === 0) return;
    setGarantias(garantias.filter((_, i) => i !== index));
  };

  // Agregar foto a una garantía
  const agregarFoto = (garantiaIndex: number) => {
    const nuevas = [...garantias];
    nuevas[garantiaIndex].fotos.push({ tipo: 'frontal', archivo: null });
    setGarantias(nuevas);
  };

  // Eliminar foto de una garantía
  const eliminarFoto = (garantiaIndex: number, fotoIndex: number) => {
    const nuevas = [...garantias];
    nuevas[garantiaIndex].fotos = nuevas[garantiaIndex].fotos.filter((_, i) => i !== fotoIndex);
    setGarantias(nuevas);
  };

  return (
    <>
      {/* Cabecera del Formulario */}
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div className="form-icon-box me-3">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Registro de Nuevo Préstamo</h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>Los campos marcados con (*) son obligatorios.</span>
        </div>
      </div>

      <form>
        {/* ---- SECCIÓN 1: Asignación de Cliente ---- */}
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">01.</span> Asignación de Cliente
        </h6>
        <div className="row g-4 mb-5">
          <div className="col-md-8">
            <label className="form-label text-white-50 small mb-2">Buscar Cliente (DPI o Nombre) *</label>
            <div className="inset-input-box">
              <input type="text" placeholder="Ingrese DPI o nombre del acreedor..." required />
            </div>
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <button type="button" className="btn-gold-action px-4 py-3 d-flex align-items-center gap-2 w-100 justify-content-center" style={{ fontSize: '13px', borderRadius: '10px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              BUSCAR CLIENTE
            </button>
          </div>
          <div className="col-12">
            <div className="reference-box p-3 d-flex align-items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
              <span className="text-white-50 small">Ningún acreedor seleccionado. Use el buscador de arriba para asignar un acreedor a este préstamo.</span>
            </div>
          </div>
        </div>

        {/* ---- SECCIÓN 2: Información del Préstamo ---- */}
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">02.</span> Información del Préstamo
        </h6>
        <div className="row g-4 mb-3">
          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Monto Solicitado *</label>
            <div className="inset-input-box d-flex align-items-center">
              <span className="text-gold me-2 fw-bold">Q</span>
              <input type="number" className="flex-fill" placeholder="0.00" required value={monto || ''} onChange={(e) => setMonto(Number(e.target.value))} />
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Interés (%) *</label>
            <div className="inset-input-box d-flex align-items-center">
              <input type="number" className="flex-fill" placeholder="Ej. 5" required value={interes || ''} onChange={(e) => setInteres(Number(e.target.value))} />
              <span className="text-white-50 ms-2 fw-bold">%</span>
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Destino / Uso *</label>
            <div className="inset-input-box pe-2">
              <select className="w-100 bg-transparent border-0 outline-none select-custom" required>
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
        </div>
        {/* Caja de Monto a Pagar calculado */}
        <div className="row g-4 mb-5">
          <div className="col-12">
            <div className="monto-resultado-box p-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                <span className="text-white-50 small fw-bold">Monto Total a Pagar (Capital + Interés):</span>
              </div>
              <span className="text-gold fw-bold" style={{ fontSize: '18px' }}>
                Q {montoAPagar > 0 ? montoAPagar.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* ---- SECCIÓN 3: Plan de Pago ---- */}
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">03.</span> Plan de Pago
        </h6>

        {/* Selector de plan personalizado */}
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
                <span className="text-gold small fw-bold">¿Usar un plan personalizado creado por el administrador?</span>
              </label>
            </div>
          </div>
        </div>

        {/* Si usa plan personalizado: selector de planes */}
        {usePlanPersonalizado && (
          <div className="row g-4 mb-5">
            <div className="col-md-12">
              <label className="form-label text-white-50 small mb-2">Seleccionar Plan Personalizado *</label>
              <div className="inset-input-box pe-2">
                <select className="w-100 bg-transparent border-0 outline-none select-custom" required>
                  <option value="">Seleccione un plan personalizado...</option>
                  <option value="plan_custom_1">Plan Especial - Cliente Preferente (Mensual, 5%, 12 cuotas)</option>
                  <option value="plan_custom_2">Plan VIP - Tasa Reducida (Quincenal, 3%, 24 cuotas)</option>
                </select>
              </div>
            </div>
            <div className="col-12">
              <div className="reference-box p-3">
                <p className="text-white-50 small mb-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2" className="me-2" style={{ verticalAlign: 'text-bottom' }}>
                    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Al seleccionar un plan personalizado, los campos de periodicidad, cuotas y mora se definen automáticamente según el plan. Puede gestionar planes en la pestaña <strong className="text-gold">"Planes Personalizados"</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Si NO usa plan personalizado: campos manuales */}
        {!usePlanPersonalizado && (
          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <label className="form-label text-white-50 small mb-2">Periodicidad *</label>
              <div className="inset-input-box pe-2">
                <select className="w-100 bg-transparent border-0 outline-none select-custom" required>
                  <option value="">Seleccione...</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label text-white-50 small mb-2">Número de Cuotas *</label>
              <div className="inset-input-box"><input type="number" placeholder="Ej. 12" required /></div>
            </div>
            <div className="col-md-4">
              <label className="form-label text-white-50 small mb-2">Mora (%)</label>
              <div className="inset-input-box d-flex align-items-center">
                <input type="number" className="flex-fill" placeholder="Ej. 2" />
                <span className="text-white-50 ms-2 fw-bold">%</span>
              </div>
            </div>
          </div>
        )}

        {/* ---- SECCIÓN 4: Garantías Dinámicas ---- */}
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">04.</span> Garantía(s)
        </h6>

        {garantias.map((garantia, gIndex) => (
          <div className="reference-box p-4 mb-3" key={gIndex}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <p className={`${gIndex === 0 ? 'text-gold' : 'text-white-50'} fw-bold mb-0`} style={{ fontSize: '13px', color: gIndex === 0 ? '#cca641' : undefined }}>
                Garantía {gIndex + 1} {gIndex === 0 ? '(Obligatoria)' : '(Opcional)'}
              </p>
              {gIndex > 0 && (
                <button type="button" className="btn-remove-garantia" onClick={() => eliminarGarantia(gIndex)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Eliminar
                </button>
              )}
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">Descripción {gIndex === 0 ? '*' : ''}</label>
                <div className="inset-input-box"><input type="text" placeholder="Ej. Televisor Samsung 55 pulgadas" required={gIndex === 0} /></div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">Categoría {gIndex === 0 ? '*' : ''}</label>
                <div className="inset-input-box pe-2">
                  <select className="w-100 bg-transparent border-0 outline-none select-custom" required={gIndex === 0}>
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
              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">Valor Estimado {gIndex === 0 ? '*' : ''}</label>
                <div className="inset-input-box d-flex align-items-center">
                  <span className="text-gold me-2 fw-bold">Q</span>
                  <input type="number" className="flex-fill" placeholder="0.00" required={gIndex === 0} />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">Estado General {gIndex === 0 ? '*' : ''}</label>
                <div className="inset-input-box pe-2">
                  <select className="w-100 bg-transparent border-0 outline-none select-custom" required={gIndex === 0}>
                    <option value="">Seleccione...</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="bueno">Bueno</option>
                    <option value="regular">Regular</option>
                    <option value="deteriorado">Deteriorado</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">Estado específico</label>
                <div className="inset-input-box"><input type="text" placeholder="Ej. Tiene un rayón en la pantalla" /></div>
              </div>
              <div className="col-md-6">
                <label className="form-label text-white-50 small mb-2">Observaciones</label>
                <div className="inset-input-box"><input type="text" placeholder="Ej. No funciona el botón de encendido" /></div>
              </div>

              {/* ---- Fotos dinámicas de esta garantía ---- */}
              <div className="col-12 mt-3">
                <p className="text-white-50 small fw-bold mb-2">Fotografías de esta garantía</p>
                <div className="row g-3">
                  {garantia.fotos.map((foto, fIndex) => (
                    <div className="col-md-4" key={fIndex}>
                      <div className="inset-upload-box p-3 d-flex flex-column align-items-center justify-content-center text-center position-relative">
                        {garantia.fotos.length > 1 && (
                          <button type="button" className="btn-remove-foto" onClick={() => eliminarFoto(gIndex, fIndex)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        )}
                        <div className="inset-input-box pe-2 mb-2 w-100" style={{ padding: '8px 12px' }}>
                          <select className="w-100 bg-transparent border-0 outline-none select-custom" style={{ fontSize: '12px' }}>
                            <option value="frontal">Frontal</option>
                            <option value="lateral">Lateral</option>
                            <option value="trasera">Trasera</option>
                            <option value="detallada">Detallada</option>
                          </select>
                        </div>
                        <button type="button" className="btn-modern-dark d-flex align-items-center gap-2" style={{ fontSize: '11px', padding: '8px 14px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                          Subir Imagen
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Botón agregar foto */}
                  <div className="col-md-4">
                    <button type="button" className="btn-add-foto w-100" onClick={() => agregarFoto(gIndex)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      <span>Agregar Foto</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Botón agregar nueva garantía */}
        <div className="mb-5">
          <button type="button" className="btn-add-garantia w-100" onClick={agregarGarantia}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Agregar otra garantía
          </button>
        </div>

        {/* ---- BOTÓN GUARDAR ---- */}
        <div className="d-flex justify-content-end mt-5 pt-4 form-header-border">
          <button type="submit" className="btn-gold-action px-5 py-3 d-flex align-items-center gap-2" style={{ fontSize: '14px', borderRadius: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            REGISTRAR PRÉSTAMO
          </button>
        </div>

      </form>
    </>
  );
}

// Vista 2: Solicitudes pendientes de aprobación
function VistaSolicitudPendiente() {
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
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Solicitudes Pendientes</h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>Préstamos en espera de aprobación por parte del administrador.</span>
        </div>
      </div>

      {/* Buscador */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="inset-input-box">
            <input type="text" placeholder="Buscar por nombre del acreedor, DPI o No. de préstamo..." />
            <button className="btn-gold-action ms-2 px-4 py-2" style={{ borderRadius: '8px' }}>Buscar</button>
          </div>
        </div>
      </div>

      {/* Aquí irá la tabla de solicitudes pendientes */}
      <div className="reference-box p-4 text-center">
        <p className="text-white-50 small mb-0">Las solicitudes pendientes aparecerán aquí cuando se conecte con el backend.</p>
      </div>
    </>
  );
}

// Vista 3: Desembolsos pendientes
function VistaDesembolsoPendiente() {
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
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Desembolsos Pendientes</h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>Préstamos aprobados en espera de desembolso al acreedor.</span>
        </div>
      </div>

      {/* Buscador */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="inset-input-box">
            <input type="text" placeholder="Buscar por nombre del acreedor o No. de préstamo..." />
            <button className="btn-gold-action ms-2 px-4 py-2" style={{ borderRadius: '8px' }}>Buscar</button>
          </div>
        </div>
      </div>

      {/* Aquí irá la tabla de desembolsos pendientes */}
      <div className="reference-box p-4 text-center">
        <p className="text-white-50 small mb-0">Los desembolsos pendientes aparecerán aquí cuando se conecte con el backend.</p>
      </div>
    </>
  );
}

// Vista 4: Simulador de pagos
function VistaSimuladorPagos() {
  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div className="form-icon-box me-3" style={{ borderColor: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="8" y1="6" x2="16" y2="6"></line>
            <line x1="8" y1="10" x2="16" y2="10"></line>
            <line x1="8" y1="14" x2="12" y2="14"></line>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Simulador de Pagos</h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>Calcula cuotas, intereses y mora antes de registrar un préstamo.</span>
        </div>
      </div>

      {/* Formulario de simulación */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <label className="form-label text-white-50 small mb-2">Monto del Préstamo</label>
          <div className="inset-input-box d-flex align-items-center">
            <span className="text-gold me-2 fw-bold">Q</span>
            <input type="number" className="flex-fill" placeholder="0.00" />
          </div>
        </div>
        <div className="col-md-4">
          <label className="form-label text-white-50 small mb-2">Interés (%)</label>
          <div className="inset-input-box d-flex align-items-center">
            <input type="number" className="flex-fill" placeholder="Ej. 5" />
            <span className="text-white-50 ms-2 fw-bold">%</span>
          </div>
        </div>
        <div className="col-md-4">
          <label className="form-label text-white-50 small mb-2">Número de Cuotas</label>
          <div className="inset-input-box"><input type="number" placeholder="Ej. 12" /></div>
        </div>
        <div className="col-md-4">
          <label className="form-label text-white-50 small mb-2">Fecha Inicio</label>
          <div className="inset-input-box"><input type="date" /></div>
        </div>
        <div className="col-md-4">
          <label className="form-label text-white-50 small mb-2">Fecha Final</label>
          <div className="inset-input-box"><input type="date" /></div>
        </div>
      </div>
      <div className="d-flex justify-content-center mb-4">
        <button type="button" className="btn-gold-action px-5 py-3 d-flex align-items-center gap-2" style={{ fontSize: '14px', borderRadius: '12px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line></svg>
          SIMULAR
        </button>
      </div>

      {/* Aquí aparecerá la tabla de resultados de la simulación */}
      <div className="reference-box p-4 text-center">
        <p className="text-white-50 small mb-0">Los resultados de la simulación aparecerán aquí al presionar el botón "Simular".</p>
      </div>
    </>
  );
}

// Vista 5: Planes Personalizados - Crear y gestionar planes especiales
function VistaPlanPersonalizado() {
  const [periodicidad, setPeriodicidad] = useState('');
  const [numeroCuotas, setNumeroCuotas] = useState<number>(0);
  const [interesPlan, setInteresPlan] = useState<number>(0);
  const [moraPlan, setMoraPlan] = useState<number>(0);
  const [montoPlan, setMontoPlan] = useState<number>(0);

  const montoTotalPlan = montoPlan > 0 && interesPlan > 0 ? montoPlan + (montoPlan * interesPlan / 100) : 0;
  const cuotaEstimada = montoTotalPlan > 0 && numeroCuotas > 0 ? montoTotalPlan / numeroCuotas : 0;

  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div className="form-icon-box me-3" style={{ borderColor: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Planes Personalizados</h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>Cree planes de pago especiales para clientes específicos.</span>
        </div>
      </div>

      <form>
        {/* ---- Crear nuevo plan ---- */}
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">01.</span> Nuevo Plan Personalizado
        </h6>
        <div className="row g-4 mb-4">
          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">Nombre del Plan *</label>
            <div className="inset-input-box"><input type="text" placeholder="Ej. Plan Especial - Cliente Preferente" required /></div>
          </div>
          <div className="col-md-6">
            <label className="form-label text-white-50 small mb-2">Periodicidad *</label>
            <div className="inset-input-box pe-2">
              <select className="w-100 bg-transparent border-0 outline-none select-custom" required value={periodicidad} onChange={(e) => setPeriodicidad(e.target.value)}>
                <option value="">Seleccione...</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Número de Cuotas *</label>
            <div className="inset-input-box"><input type="number" placeholder="Ej. 12" required value={numeroCuotas || ''} onChange={(e) => setNumeroCuotas(Number(e.target.value))} /></div>
          </div>
          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Interés (%) *</label>
            <div className="inset-input-box d-flex align-items-center">
              <input type="number" className="flex-fill" placeholder="Ej. 3" required value={interesPlan || ''} onChange={(e) => setInteresPlan(Number(e.target.value))} />
              <span className="text-white-50 ms-2 fw-bold">%</span>
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Mora (%) *</label>
            <div className="inset-input-box d-flex align-items-center">
              <input type="number" className="flex-fill" placeholder="Ej. 1" required value={moraPlan || ''} onChange={(e) => setMoraPlan(Number(e.target.value))} />
              <span className="text-white-50 ms-2 fw-bold">%</span>
            </div>
          </div>
          <div className="col-md-4">
            <label className="form-label text-white-50 small mb-2">Monto del Préstamo *</label>
            <div className="inset-input-box d-flex align-items-center">
              <span className="text-gold me-2 fw-bold">Q</span>
              <input type="number" className="flex-fill" placeholder="0.00" required value={montoPlan || ''} onChange={(e) => setMontoPlan(Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* ---- Resumen / Preview del plan ---- */}
        {(montoPlan > 0 && interesPlan > 0 && numeroCuotas > 0) && (
          <div className="row g-4 mb-5">
            <div className="col-12">
              <div className="monto-resultado-box p-4">
                <p className="text-gold fw-bold mb-3" style={{ fontSize: '13px' }}>📊 Resumen del Plan</p>
                <div className="row g-3">
                  <div className="col-md-4">
                    <p className="text-white-50 small mb-1">Monto Total a Pagar</p>
                    <p className="text-gold fw-bold mb-0" style={{ fontSize: '16px' }}>Q {montoTotalPlan.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="col-md-4">
                    <p className="text-white-50 small mb-1">Cuota Estimada</p>
                    <p className="text-white fw-bold mb-0" style={{ fontSize: '16px' }}>Q {cuotaEstimada.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="col-md-4">
                    <p className="text-white-50 small mb-1">Duración</p>
                    <p className="text-white fw-bold mb-0" style={{ fontSize: '16px' }}>{numeroCuotas} cuotas {periodicidad ? `(${periodicidad})` : ''}</p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- BOTÓN GUARDAR PLAN ---- */}
        <div className="d-flex justify-content-end mt-4 pt-4 form-header-border">
          <button type="submit" className="btn-gold-action px-5 py-3 d-flex align-items-center gap-2" style={{ fontSize: '14px', borderRadius: '12px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            CREAR PLAN PERSONALIZADO
          </button>
        </div>
      </form>

      {/* ---- Planes existentes ---- */}
      <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h6 className="form-section-title mb-4">
          <span className="text-gold me-2">02.</span> Planes Existentes
        </h6>
        <div className="reference-box p-4 text-center">
          <p className="text-white-50 small mb-0">Los planes personalizados creados aparecerán aquí cuando se conecte con el backend.</p>
        </div>
      </div>
    </>
  );
}

export default LoansPage;