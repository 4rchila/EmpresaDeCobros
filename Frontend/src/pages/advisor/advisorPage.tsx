import React, { useState } from 'react';
import '../dashboard/dashboard.css';
import './advisor.css';

// =====================================================================
// Datos de prueba para la lista de asesores
// =====================================================================
interface Asesor {
    id: string;
    nombre: string;
    apellido: string;
    rol: string;
    telefono: string;
    email: string;
    estado: 'activo' | 'inactivo';
}

const asesoresData: Asesor[] = [
    { id: 'a1', nombre: 'German', apellido: 'Archila', rol: 'Administrador', telefono: '+502 5555-0001', email: 'german@empresa.com', estado: 'activo' },
    { id: 'a2', nombre: 'Juan', apellido: 'Pérez', rol: 'Asesor', telefono: '+502 5555-0002', email: 'juan@empresa.com', estado: 'activo' },
    { id: 'a3', nombre: 'María', apellido: 'Gómez', rol: 'Secretaria', telefono: '+502 5555-0003', email: 'maria@empresa.com', estado: 'activo' },
    { id: 'a4', nombre: 'Carlos', apellido: 'López', rol: 'Asesor', telefono: '+502 5555-0004', email: 'carlos@empresa.com', estado: 'inactivo' },
    { id: 'a5', nombre: 'Ana', apellido: 'Martínez', rol: 'Asesor', telefono: '+502 5555-0005', email: 'ana@empresa.com', estado: 'activo' },
];

// =====================================================================
// Componente Principal con Tabs
// =====================================================================
function AdvisorPage() {
    const [activeTab, setActiveTab] = useState('nuevo');

    const renderView = () => {
        switch (activeTab) {
            case 'nuevo':
                return <VistaNuevoAsesor />;
            case 'transferencia':
                return <VistaTransferenciaPortafolio />;
            case 'asesores':
                return <VistaListaAsesores />;
            default:
                return <VistaNuevoAsesor />;
        }
    };

    return (
        <div className="w-100 h-100 d-flex flex-column">

            {/* ================= TABS SUPERIORES ================= */}
            <div className="mb-4">
                <div className="d-flex gap-3 tabs-container flex-wrap">
                    <button
                        className={`tab-btn ${activeTab === 'nuevo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('nuevo')}
                    >
                        Nuevo Asesor
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'transferencia' ? 'active' : ''}`}
                        onClick={() => setActiveTab('transferencia')}
                    >
                        Transferencia de Cartera
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'asesores' ? 'active' : ''}`}
                        onClick={() => setActiveTab('asesores')}
                    >
                        Asesores
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
// Vista 1: Formulario de Nuevo Asesor
// =====================================================================
function VistaNuevoAsesor() {
    return (
        <>
            {/* Cabecera */}
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
                    <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Registro de Nuevo Asesor</h4>
                    <span className="text-white-50" style={{ fontSize: '0.85rem' }}>Complete los datos del Usuario. Los campos marcados con (*) son obligatorios.</span>
                </div>
            </div>

            <form>
                {/* ---- SECCIÓN 1: Datos Personales ---- */}
                <h6 className="form-section-title mb-4">
                    <span className="text-gold me-2">🧑</span> Datos personales
                </h6>
                <div className="row g-4 mb-5">
                    <div className="col-md-4">
                        <label className="form-label text-white-50 small mb-2">Nombre *</label>
                        <div className="inset-input-box"><input type="text" placeholder="Ej. Juan" required /></div>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label text-white-50 small mb-2">Apellido *</label>
                        <div className="inset-input-box"><input type="text" placeholder="Ej. Pérez" required /></div>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label text-white-50 small mb-2">Teléfono *</label>
                        <div className="inset-input-box"><input type="tel" placeholder="Ej. 5555-5555" required /></div>
                    </div>
                </div>

                {/* ---- SECCIÓN 2: Acceso al Sistema ---- */}
                <h6 className="form-section-title mb-4">
                    <span className="text-gold me-2">🔐</span> Acceso al sistema
                </h6>
                <div className="row g-4 mb-5">
                    <div className="col-md-6">
                        <label className="form-label text-white-50 small mb-2">Usuario *</label>
                        <div className="inset-input-box"><input type="text" placeholder="Ej. juanperez" required /></div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label text-white-50 small mb-2">Email *</label>
                        <div className="inset-input-box"><input type="email" placeholder="Ej. juan@empresa.com" required /></div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label text-white-50 small mb-2">Contraseña *</label>
                        <div className="inset-input-box"><input type="password" placeholder="Ej. *********" required /></div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label text-white-50 small mb-2">Confirmar contraseña *</label>
                        <div className="inset-input-box"><input type="password" placeholder="Ej. *********" required /></div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label text-white-50 small mb-2">Rol Asignado *</label>
                        <div className="inset-input-box pe-2">
                            <select className="w-100 bg-transparent border-0 outline-none select-custom" required>
                                <option value="">Seleccione...</option>
                                <option value="asesor">Asesor</option>
                                <option value="secretaria">Secretaria</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-12">
                        <label className="form-label text-white-50 small mb-2">Observaciones</label>
                        <div className="inset-input-box"><input type="text" placeholder="Asignación de zona, detalles adicionales..." /></div>
                    </div>
                </div>

                {/* ---- BOTÓN GUARDAR ---- */}
                <div className="d-flex justify-content-end mt-5 pt-4 form-header-border">
                    <button type="submit" className="btn-gold-action px-5 py-3 d-flex align-items-center gap-2" style={{ fontSize: '14px', borderRadius: '12px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        REGISTRAR ASESOR
                    </button>
                </div>
            </form>
        </>
    );
}

// =====================================================================
// Vista 2: Transferencia de Portafolio
// =====================================================================

// Carteras de prueba disponibles para transferencia
const carterasDisponibles = [
    { id: 'ct1', name: 'Cartera Zona 1', clientes: 12 },
    { id: 'ct2', name: 'Cartera Norte', clientes: 8 },
    { id: 'ct3', name: 'Cartera Sur', clientes: 5 },
    { id: 'ct4', name: 'Cartera Centro', clientes: 15 },
    { id: 'ct5', name: 'Cartera Oriente', clientes: 3 },
];

function VistaTransferenciaPortafolio() {
    const [carterasSeleccionadas, setCarterasSeleccionadas] = useState<string[]>([]);

    const toggleCartera = (id: string) => {
        setCarterasSeleccionadas(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (carterasSeleccionadas.length === carterasDisponibles.length) {
            setCarterasSeleccionadas([]);
        } else {
            setCarterasSeleccionadas(carterasDisponibles.map(c => c.id));
        }
    };

    return (
        <>
            <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
                <div className="form-icon-box me-3" style={{ borderColor: '#4ecdc4', background: 'rgba(78, 205, 196, 0.1)' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ecdc4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 1 21 5 17 9"></polyline>
                        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                        <polyline points="7 23 3 19 7 15"></polyline>
                        <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                    </svg>
                </div>
                <div>
                    <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Transferencia de Cartera</h4>
                    <span className="text-white-50" style={{ fontSize: '0.85rem' }}>Transfiera una o varias carteras entre asesores del sistema.</span>
                </div>
            </div>

            <form>
                <h6 className="form-section-title mb-4">
                    <span className="text-gold me-2">01.</span> Asesor de Origen
                </h6>
                <div className="row g-4 mb-5">
                    <div className="col-md-8">
                        <label className="form-label text-white-50 small mb-2">Buscar Asesor (nombre o usuario) *</label>
                        <div className="inset-input-box">
                            <input type="text" placeholder="Ingrese nombre o usuario del asesor de origen..." required />
                        </div>
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                        <button type="button" className="btn-gold-action px-4 py-3 d-flex align-items-center gap-2 w-100 justify-content-center" style={{ fontSize: '13px', borderRadius: '10px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            BUSCAR
                        </button>
                    </div>
                    <div className="col-12">
                        <div className="reference-box p-3 d-flex align-items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <span className="text-white-50 small">Ningún asesor de origen seleccionado.</span>
                        </div>
                    </div>
                </div>

                <h6 className="form-section-title mb-4">
                    <span className="text-gold me-2">02.</span> Asesor de Destino
                </h6>
                <div className="row g-4 mb-5">
                    <div className="col-md-8">
                        <label className="form-label text-white-50 small mb-2">Buscar Asesor (nombre o usuario) *</label>
                        <div className="inset-input-box">
                            <input type="text" placeholder="Ingrese nombre o usuario del asesor de destino..." required />
                        </div>
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                        <button type="button" className="btn-gold-action px-4 py-3 d-flex align-items-center gap-2 w-100 justify-content-center" style={{ fontSize: '13px', borderRadius: '10px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            BUSCAR
                        </button>
                    </div>
                    <div className="col-12">
                        <div className="reference-box p-3 d-flex align-items-center gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <span className="text-white-50 small">Ningún asesor de destino seleccionado.</span>
                        </div>
                    </div>
                </div>

                <h6 className="form-section-title mb-4">
                    <span className="text-gold me-2">03.</span> Carteras a Transferir
                    {carterasSeleccionadas.length > 0 && (
                        <span className="transfer-count-badge">{carterasSeleccionadas.length} seleccionada(s)</span>
                    )}
                </h6>

                {/* Seleccionar todas */}
                <div className="mb-3">
                    <label className="transfer-check-item transfer-check-all" onClick={toggleAll}>
                        <div className={`transfer-checkbox ${carterasSeleccionadas.length === carterasDisponibles.length ? 'checked' : ''}`}>
                            {carterasSeleccionadas.length === carterasDisponibles.length && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                        </div>
                        <span className="text-white-50 small fw-bold">Seleccionar todas las carteras</span>
                    </label>
                </div>

                {/* Lista de carteras con checkboxes */}
                <div className="transfer-cartera-list mb-5">
                    {carterasDisponibles.map(cartera => {
                        const isSelected = carterasSeleccionadas.includes(cartera.id);
                        return (
                            <label key={cartera.id} className={`transfer-check-item ${isSelected ? 'selected' : ''}`} onClick={() => toggleCartera(cartera.id)}>
                                <div className={`transfer-checkbox ${isSelected ? 'checked' : ''}`}>
                                    {isSelected && (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    )}
                                </div>
                                <div className="transfer-cartera-info">
                                    <span className="transfer-cartera-name">{cartera.name}</span>
                                    <span className="transfer-cartera-count">{cartera.clientes} clientes</span>
                                </div>
                            </label>
                        );
                    })}
                </div>

                <div className="row g-4 mb-5">
                    <div className="col-12">
                        <label className="form-label text-white-50 small mb-2">Motivo de Transferencia</label>
                        <div className="inset-input-box"><input type="text" placeholder="Ej. Cambio de zona, renuncia, reorganización..." /></div>
                    </div>
                </div>

                {/* ---- BOTÓN TRANSFERIR ---- */}
                <div className="d-flex justify-content-end mt-5 pt-4 form-header-border">
                    <button type="submit" className="btn-gold-action px-5 py-3 d-flex align-items-center gap-2" style={{ fontSize: '14px', borderRadius: '12px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path></svg>
                        TRANSFERIR {carterasSeleccionadas.length > 0 ? `(${carterasSeleccionadas.length})` : ''} CARTERA{carterasSeleccionadas.length !== 1 ? 'S' : ''}
                    </button>
                </div>
            </form>
        </>
    );
}

// =====================================================================
// Vista 3: Lista de Asesores en el Sistema
// =====================================================================
function VistaListaAsesores() {
    const [busqueda, setBusqueda] = useState('');
    const [asesores, setAsesores] = useState<Asesor[]>(asesoresData);

    const toggleEstado = (id: string) => {
        setAsesores(prev => prev.map(a =>
            a.id === id ? { ...a, estado: a.estado === 'activo' ? 'inactivo' : 'activo' } : a
        ));
    };

    // Filtrar por búsqueda
    const asesoresFiltrados = asesores.filter(a =>
        `${a.nombre} ${a.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
        a.rol.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Separar activos e inactivos
    const activos = asesoresFiltrados.filter(a => a.estado === 'activo');
    const inactivos = asesoresFiltrados.filter(a => a.estado === 'inactivo');

    // Renderizar una tarjeta de asesor
    const renderAsesorCard = (asesor: Asesor) => (
        <div key={asesor.id} className={`advisor-card ${asesor.estado === 'inactivo' ? 'advisor-card-inactive' : ''}`}>
            {/* Avatar con iniciales */}
            <div className={`advisor-avatar ${asesor.estado === 'inactivo' ? 'advisor-avatar-inactive' : ''}`}>
                <span>{asesor.nombre[0]}{asesor.apellido[0]}</span>
            </div>

            {/* Info principal */}
            <div className="advisor-info">
                <div className="advisor-name-row">
                    <h6 className="advisor-name">{asesor.nombre} {asesor.apellido}</h6>
                    <span className={`advisor-estado-badge ${asesor.estado === 'activo' ? 'estado-activo' : 'estado-inactivo'}`}>
                        {asesor.estado}
                    </span>
                </div>
                <span className="advisor-role">{asesor.rol}</span>
            </div>

            {/* Datos de contacto */}
            <div className="advisor-contact">
                <div className="advisor-contact-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <span>{asesor.telefono}</span>
                </div>
                <div className="advisor-contact-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    <span>{asesor.email}</span>
                </div>
            </div>

            {/* Botón toggle estado */}
            <button
                className={`advisor-toggle-btn ${asesor.estado === 'activo' ? 'toggle-to-inactive' : 'toggle-to-active'}`}
                onClick={() => toggleEstado(asesor.id)}
                title={asesor.estado === 'activo' ? 'Desactivar asesor' : 'Activar asesor'}
            >
                {asesor.estado === 'activo' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                )}
            </button>
        </div>
    );

    return (
        <>
            <div className="d-flex align-items-center mb-5 pb-3 form-header-border">
                <div className="form-icon-box me-3" style={{ borderColor: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <div>
                    <h4 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>Asesores del Sistema</h4>
                    <span className="text-white-50" style={{ fontSize: '0.85rem' }}>Lista de usuarios registrados en el sistema.</span>
                </div>
            </div>

            {/* Buscador */}
            <div className="row g-4 mb-4">
                <div className="col-12">
                    <div className="inset-input-box">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" style={{ flexShrink: 0, marginRight: '10px' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" placeholder="Buscar por nombre o rol..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </div>
                </div>
            </div>

            {asesoresFiltrados.length === 0 ? (
                <div className="reference-box p-4 text-center">
                    <p className="text-white-50 small mb-0">No se encontraron asesores con ese criterio de búsqueda.</p>
                </div>
            ) : (
                <>
                    {/* ---- SECCIÓN ACTIVOS ---- */}
                    {activos.length > 0 && (
                        <div className="mb-5">
                            <div className="advisor-section-header">
                                <span className="advisor-section-dot" style={{ background: '#10b981' }}></span>
                                <h6 className="advisor-section-title">Activos</h6>
                                <span className="advisor-section-count">{activos.length}</span>
                            </div>
                            <div className="advisor-list">
                                {activos.map(renderAsesorCard)}
                            </div>
                        </div>
                    )}

                    {/* ---- SECCIÓN INACTIVOS ---- */}
                    {inactivos.length > 0 && (
                        <div className="mb-4">
                            <div className="advisor-section-header">
                                <span className="advisor-section-dot" style={{ background: '#ef4444' }}></span>
                                <h6 className="advisor-section-title">Inactivos</h6>
                                <span className="advisor-section-count">{inactivos.length}</span>
                            </div>
                            <div className="advisor-list">
                                {inactivos.map(renderAsesorCard)}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Conteo */}
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-white-50 small mb-0 text-center">
                    {activos.length} activo(s) · {inactivos.length} inactivo(s) · {asesores.length} total
                </p>
            </div>
        </>
    );
}

export default AdvisorPage;