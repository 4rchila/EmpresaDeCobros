import React, { useState } from 'react';
import '../dashboard/dashboard.css';
import './creditors.css';

function creditorsPage() {
  const [activeTab, setActiveTab] = useState('nuevo');

  const renderView = () => {
    switch (activeTab) {
      case 'nuevo':
        return <VistaNuevoAcreedor />;
      case 'buscar':
        return <VistaBuscarAcreedor />;
      case 'lista_negra':
        return <VistaListaNegra />;
      default:
        return <VistaNuevoAcreedor />;
    }
  };

  return (
    <div className="w-100 h-100 d-flex flex-column">

      {/* ================= TABS SUPERIORES ================= */}
      <div className="mb-4">
        <div className="d-flex gap-3 tabs-container">
          {/* 3. Agregamos eventos onClick y clases dinámicas para cambiar el estado */}
          <button
            className={`tab-btn ${activeTab === 'nuevo' ? 'active' : ''}`}
            onClick={() => setActiveTab('nuevo')}
          >
            Nuevo Acreedor
          </button>
          <button
            className={`tab-btn ${activeTab === 'buscar' ? 'active' : ''}`}
            onClick={() => setActiveTab('buscar')}
          >
            Buscar Acreedor
          </button>
          <button
            className={`tab-btn ${activeTab === 'lista_negra' ? 'active' : ''}`}
            onClick={() => setActiveTab('lista_negra')}
          >
            Lista Negra
          </button>
        </div>
      </div>

      {/* ================= CONTENEDOR DINÁMICO ================= */}
      <div className="extruded-form-card p-4 p-lg-5 flex-fill overflow-auto custom-scrollbar">
        {/* Aquí llamamos a la función que renderiza el contenido correcto */}
        {renderView()}
      </div>
    </div>
  );
}

// =====================================================================
// SUB-COMPONENTES (Puedes dejarlos aquí o moverlos a otros archivos)
// =====================================================================

// Vista 1: Tu formulario actual (Lo encapsulé aquí para orden)
function VistaNuevoAcreedor() {
  return (
    <div className="w-100 h-100 d-flex flex-column">

      {/* ================= TABS SUPERIORES (Estilo Neumórfico) ================= */}
      {/* ================= CONTENEDOR DEL FORMULARIO (Extruded Card) ================= */}
      <div className="extruded-form-card p-4 p-lg-5 flex-fill overflow-auto custom-scrollbar">

        {/* Cabecera del Formulario */}
        <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
          <div className="form-icon-box me-3">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
          </div>
          <div>
            <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Registro de Nuevo Acreedor</h4>
            <span className="text-white-50" style={{ fontSize: '0.85rem' }}>Los campos marcados con (*) son obligatorios.</span>
          </div>
        </div>

        <form>
          {/* ---- SECCIÓN 1: Datos Personales ---- */}
          <h6 className="form-section-title mb-4">
            <span className="text-gold me-2">01.</span> Información Personal
          </h6>
          <div className="row g-4 mb-5">
            <div className="col-md-6">
              <label className="form-label text-white-50 small mb-2">Nombres *</label>
              <div className="inset-input-box"><input type="text" placeholder="Ej. Juan Carlos" required /></div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-white-50 small mb-2">Apellidos *</label>
              <div className="inset-input-box"><input type="text" placeholder="Ej. Pérez López" required /></div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-white-50 small mb-2">DPI *</label>
              <div className="inset-input-box"><input type="text" placeholder="13 dígitos sin espacios" required /></div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-white-50 small mb-2">NIT *</label>
              <div className="inset-input-box"><input type="text" placeholder="Ej. 1234567-8" required /></div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-white-50 small mb-2">Teléfono Principal *</label>
              <div className="inset-input-box"><input type="tel" placeholder="Ej. 5555-5555" required /></div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-white-50 small mb-2">Teléfono Secundario</label>
              <div className="inset-input-box"><input type="tel" placeholder="Opcional" /></div>
            </div>
          </div>

          {/* ---- SECCIÓN 2: Ubicación ---- */}
          <h6 className="form-section-title mb-4">
            <span className="text-gold me-2">02.</span> Ubicación Domiciliar
          </h6>
          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <label className="form-label text-white-50 small mb-2">Departamento *</label>
              <div className="inset-input-box pe-2">
                <select className="w-100 bg-transparent border-0 outline-none select-custom" required>
                  <option value="">Seleccione...</option>
                  <option value="Totonicapan">Totonicapán</option>
                  <option value="Quetzaltenango">Quetzaltenango</option>
                  <option value="Guatemala">Guatemala</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label text-white-50 small mb-2">Municipio *</label>
              <div className="inset-input-box pe-2">
                <select className="w-100 bg-transparent border-0 outline-none select-custom" required>
                  <option value="">Seleccione...</option>
                  <option value="Totonicapan">Totonicapán (Cabecera)</option>
                  <option value="San Cristobal">San Cristóbal Totonicapán</option>
                  <option value="San Francisco">San Francisco El Alto</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label text-white-50 small mb-2">Distrito / Cantón *</label>
              <div className="inset-input-box"><input type="text" placeholder="Ej. Cantón Xesacmalja" required /></div>
            </div>
            <div className="col-12">
              <label className="form-label text-white-50 small mb-2">Dirección Exacta *</label>
              <div className="inset-input-box"><input type="text" placeholder="Avenida, Calle, Lote, Referencias..." required /></div>
            </div>
          </div>

          {/* ---- SECCIÓN 3: Laboral y Financiera ---- */}
          <h6 className="form-section-title mb-4">
            <span className="text-gold me-2">03.</span> Laboral y Financiera
          </h6>
          <div className="row g-4 mb-5">
            <div className="col-md-6">
              <label className="form-label text-white-50 small mb-2">¿En qué trabaja? *</label>
              <div className="inset-input-box"><input type="text" placeholder="Profesión u Oficio" required /></div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-white-50 small mb-2">Número de Trabajo *</label>
              <div className="inset-input-box"><input type="tel" placeholder="Ej. 5555-5555" required /></div>
            </div>
            <div className="col-12">
              <label className="form-label text-white-50 small mb-2">Dirección del Lugar de Trabajo *</label>
              <div className="inset-input-box"><input type="text" placeholder="Dirección completa" required /></div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-white-50 small mb-2">Ingresos Mensuales *</label>
              <div className="inset-input-box d-flex align-items-center">
                <span className="text-gold me-2 fw-bold">Q</span>
                <input type="number" className="flex-fill" placeholder="0.00" required />
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label text-white-50 small mb-2">Egresos Mensuales *</label>
              <div className="inset-input-box d-flex align-items-center">
                <span className="text-gold me-2 fw-bold">Q</span>
                <input type="number" className="flex-fill" placeholder="0.00" required />
              </div>
            </div>
          </div>

          {/* ---- SECCIÓN 4: Fotografías ---- */}
          <h6 className="form-section-title mb-4">
            <span className="text-gold me-2">04.</span> Respaldo Documental
          </h6>
          <div className="row g-4 mb-5">
            <div className="col-md-6">
              <div className="inset-upload-box p-4 d-flex flex-column align-items-center justify-content-center text-center">
                <p className="text-white mb-3 small">Foto de la Vivienda *</p>
                <button type="button" className="btn-modern-dark d-flex align-items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  Subir Imagen
                </button>
              </div>
            </div>
            <div className="col-md-6">
              <div className="inset-upload-box p-4 d-flex flex-column align-items-center justify-content-center text-center">
                <p className="text-white mb-3 small">Foto Recibo de Luz *</p>
                <button type="button" className="btn-modern-dark d-flex align-items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  Subir Imagen
                </button>
              </div>
            </div>
          </div>

          {/* ---- SECCIÓN 5: Referencias ---- */}
          <h6 className="form-section-title mb-4">
            <span className="text-gold me-2">05.</span> Referencias Personales
          </h6>

          <div className="reference-box p-4 mb-3">
            <p className="text-gold fw-bold mb-3" style={{ fontSize: '13px', color: '#cca641' }}>Referencia 1 (Obligatoria)</p>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="inset-input-box"><input type="text" placeholder="Nombres" required /></div>
              </div>
              <div className="col-md-4">
                <div className="inset-input-box"><input type="text" placeholder="Apellidos" required /></div>
              </div>
              <div className="col-md-4">
                <div className="inset-input-box"><input type="tel" placeholder="No. Teléfono" required /></div>
              </div>
            </div>
          </div>

          <div className="reference-box p-4 mb-3">
            <p className="text-white-50 fw-bold mb-3" style={{ fontSize: '13px' }}>Referencia 2 (Opcional)</p>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="inset-input-box"><input type="text" placeholder="Nombres" /></div>
              </div>
              <div className="col-md-4">
                <div className="inset-input-box"><input type="text" placeholder="Apellidos" /></div>
              </div>
              <div className="col-md-4">
                <div className="inset-input-box"><input type="tel" placeholder="No. Teléfono" /></div>
              </div>
            </div>
          </div>

          <div className="reference-box p-4 mb-3">
            <p className="text-white-50 fw-bold mb-3" style={{ fontSize: '13px' }}>Referencia 3 (Opcional)</p>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="inset-input-box"><input type="text" placeholder="Nombres" /></div>
              </div>
              <div className="col-md-4">
                <div className="inset-input-box"><input type="text" placeholder="Apellidos" /></div>
              </div>
              <div className="col-md-4">
                <div className="inset-input-box"><input type="tel" placeholder="No. Teléfono" /></div>
              </div>
            </div>
          </div>

          {/* ---- BOTÓN GUARDAR ---- */}
          <div className="d-flex justify-content-end mt-5 pt-4 form-header-border">
            <button type="submit" className="btn-gold-action px-5 py-3 d-flex align-items-center gap-2" style={{ fontSize: '14px', borderRadius: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              REGISTRAR ACREEDOR
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// Vista 2: Buscar Acreedor (Estructura base sugerida)
function VistaBuscarAcreedor() {
  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div className="form-icon-box me-3">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Búsqueda de Acreedores</h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>Busca por DPI, Nombre o Número de Teléfono.</span>
        </div>
      </div>

      {/* Buscador */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="inset-input-box">
            <input type="text" placeholder="Ingrese el dato a buscar..." />
            <button className="btn-gold-action ms-2 px-4 py-2" style={{ borderRadius: '8px' }}>Buscar</button>
          </div>
        </div>
      </div>

      {/* Aquí irá tu tabla o lista de resultados más adelante */}
    </>
  );
}

// Vista 3: Lista Negra (Estructura base sugerida)
function VistaListaNegra() {
  return (
    <>
      <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
        <div className="form-icon-box me-3" style={{ borderColor: '#ff4747', background: 'rgba(255, 71, 71, 0.1)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff4747" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div>
          <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Lista Negra</h4>
          <span className="text-white-50" style={{ fontSize: '0.85rem' }}>Acreedores restringidos por incumplimiento o fraude.</span>
        </div>
      </div>

      {/* Aquí irá tu tabla de lista negra más adelante */}
    </>
  );
}

export default creditorsPage;