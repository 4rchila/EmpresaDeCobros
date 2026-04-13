import "./portafolio.css"
import '../dashboard/dashboard.css';
import React, { useState } from 'react';

// =====================================================================
// Interfaces
// =====================================================================
interface Garantia {
  id: string;
  descripcion: string;
  categoria: string;
  valorEstimado: string;
  estado: string;
  fotos: number;
}

interface Loan {
  id: string;
  amount: string;
  interes: string;
  montoTotal: string;
  destino: string;
  periodicidad: string;
  cuotas: number;
  mora: string;
  status: string;
  date: string;
  garantias: Garantia[];
}

interface Cliente {
  id: string;
  carteraId: string;
  name: string;
  dpi: string;
  phone: string;
  loans: Loan[];
}

interface Cartera {
  id: string;
  name: string;
  status: 'activa' | 'vencida' | 'muerta';
}

// =====================================================================
// Datos de prueba
// =====================================================================
const initialCarteras: Cartera[] = [
  { id: 'c1', name: 'Cartera Zona 1', status: 'activa' },
  { id: 'c2', name: 'Cartera Norte', status: 'activa' },
  { id: 'c3', name: 'Cartera Sur', status: 'vencida' },
  { id: 'c4', name: 'Cartera Incobrables', status: 'muerta' },
];

const initialClientes: Cliente[] = [
  {
    id: 'cl1', carteraId: 'c1', name: 'Juan Pérez', dpi: '1234 56789 0101', phone: '+502 5555-1111',
    loans: [{
      id: 'p1', amount: 'Q5,000.00', interes: '5%', montoTotal: 'Q5,250.00', destino: 'Negocio / Inversión',
      periodicidad: 'Mensual', cuotas: 12, mora: '2%', status: 'Al día', date: '10/01/2023',
      garantias: [{ id: 'g1', descripcion: 'Televisor Samsung 55"', categoria: 'Electrónica', valorEstimado: 'Q3,500.00', estado: 'Bueno', fotos: 3 }]
    }]
  },
  {
    id: 'cl2', carteraId: 'c1', name: 'María Gómez', dpi: '9876 54321 0101', phone: '+502 5555-2222',
    loans: [
      { id: 'p2', amount: 'Q2,500.00', interes: '4%', montoTotal: 'Q2,600.00', destino: 'Consumo Personal', periodicidad: 'Quincenal', cuotas: 6, mora: '1.5%', status: 'Al día', date: '15/02/2023', garantias: [{ id: 'g2', descripcion: 'Laptop HP Pavilion', categoria: 'Electrónica', valorEstimado: 'Q4,000.00', estado: 'Nuevo', fotos: 2 }] },
      { id: 'p3', amount: 'Q1,000.00', interes: '3%', montoTotal: 'Q1,030.00', destino: 'Salud', periodicidad: 'Mensual', cuotas: 4, mora: '1%', status: 'Pagado', date: '01/11/2022', garantias: [] }
    ]
  },
  {
    id: 'cl3', carteraId: 'c2', name: 'Carlos López', dpi: '4567 89012 0101', phone: '+502 5555-3333',
    loans: [{ id: 'p4', amount: 'Q10,000.00', interes: '6%', montoTotal: 'Q10,600.00', destino: 'Vivienda', periodicidad: 'Mensual', cuotas: 24, mora: '3%', status: 'Al día', date: '20/03/2023', garantias: [{ id: 'g3', descripcion: 'Motocicleta Honda 150cc', categoria: 'Vehículo', valorEstimado: 'Q15,000.00', estado: 'Bueno', fotos: 4 }] }]
  },
  {
    id: 'cl4', carteraId: 'c3', name: 'Ana Martínez', dpi: '3456 78901 0101', phone: '+502 5555-4444',
    loans: [{ id: 'p5', amount: 'Q3,000.00', interes: '5%', montoTotal: 'Q3,150.00', destino: 'Educación', periodicidad: 'Semanal', cuotas: 8, mora: '2%', status: 'Atrasado 30 días', date: '05/12/2022', garantias: [{ id: 'g4', descripcion: 'Anillo de oro 18k', categoria: 'Joyería', valorEstimado: 'Q5,000.00', estado: 'Nuevo', fotos: 2 }] }]
  },
  {
    id: 'cl5', carteraId: 'c4', name: 'Luis Rodríguez', dpi: '2345 67890 0101', phone: '+502 5555-5555',
    loans: [{ id: 'p6', amount: 'Q8,000.00', interes: '8%', montoTotal: 'Q8,640.00', destino: 'Negocio / Inversión', periodicidad: 'Mensual', cuotas: 18, mora: '5%', status: 'En jurídico', date: '10/05/2021', garantias: [{ id: 'g5', descripcion: 'Refrigeradora Whirlpool 18 pies', categoria: 'Electrodoméstico', valorEstimado: 'Q6,500.00', estado: 'Regular', fotos: 3 }, { id: 'g6', descripcion: 'Microondas LG', categoria: 'Electrodoméstico', valorEstimado: 'Q1,200.00', estado: 'Bueno', fotos: 1 }] }]
  },
];

// Configuración visual por estado
const STATUS_CONFIG = {
  activa: { label: 'Activas', color: '#10b981', colorRgb: '16, 185, 129' },
  vencida: { label: 'Vencidas', color: '#f59e0b', colorRgb: '245, 158, 11' },
  muerta: { label: 'Muertas', color: '#ef4444', colorRgb: '239, 68, 68' },
};

// =====================================================================
// Componente Principal
// =====================================================================
function PortafolioPage() {
  const [carteras, setCarteras] = useState<Cartera[]>(initialCarteras);
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [editingCarteraId, setEditingCarteraId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showGarantias, setShowGarantias] = useState(false);

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, clienteId: string) => {
    e.dataTransfer.setData('clienteId', clienteId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, carteraId: string) => {
    e.preventDefault();
    const clienteId = e.dataTransfer.getData('clienteId');
    if (clienteId) {
      setClientes(clientes.map(cli =>
        cli.id === clienteId ? { ...cli, carteraId: carteraId } : cli
      ));
    }
  };

  // Edición de cartera
  const startEditing = (cartera: Cartera) => {
    setEditingCarteraId(cartera.id);
    setEditNameValue(cartera.name);
  };

  const saveEditing = (id: string) => {
    setCarteras(carteras.map(c =>
      c.id === id ? { ...c, name: editNameValue || 'Sin Nombre' } : c
    ));
    setEditingCarteraId(null);
  };

  const cancelEditing = () => {
    setEditingCarteraId(null);
  };

  const handleCrearCartera = () => {
    const newId = `c${Date.now()}`;
    setCarteras([...carteras, { id: newId, name: 'Nueva Cartera', status: 'activa' }]);
  };

  // Eliminar cartera
  const handleEliminarCartera = (carteraId: string) => {
    setCarteras(carteras.filter(c => c.id !== carteraId));
  };

  // Abrir detalle del préstamo
  const handleOpenLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowGarantias(false);
  };

  return (
    <div className="portafolio-page">

      {/* ================= HEADER ================= */}
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
        <button className="portafolio-btn-crear" onClick={handleCrearCartera}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Crear Nueva Cartera
        </button>
      </div>

      {/* ================= SECCIONES POR ESTADO ================= */}
      <div className="portafolio-sections">
        {(['activa', 'vencida', 'muerta'] as const).map(statusKey => {
          const carterasOfStatus = carteras.filter(c => c.status === statusKey);
          if (carterasOfStatus.length === 0) return null;
          const config = STATUS_CONFIG[statusKey];

          return (
            <div key={statusKey} className="portafolio-section">
              <div className="portafolio-section-header">
                <span className="portafolio-status-dot" style={{ background: config.color }}></span>
                <h2 className="portafolio-section-title">Carteras {config.label}</h2>
              </div>

              <div className="portafolio-grid">
                {carterasOfStatus.map(cartera => {
                  const carteraClientes = clientes.filter(cli => cli.carteraId === cartera.id);

                  return (
                    <div
                      key={cartera.id}
                      className="cartera-card"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, cartera.id)}
                    >
                      {/* Cartera Header */}
                      <div className="cartera-header" style={{ background: `linear-gradient(135deg, rgba(${config.colorRgb}, 0.8), rgba(${config.colorRgb}, 0.5))` }}>
                        <div className="cartera-header-left">
                          {editingCarteraId === cartera.id ? (
                            <div className="cartera-edit-row">
                              <input
                                type="text"
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                className="cartera-edit-input"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && saveEditing(cartera.id)}
                              />
                              <button className="cartera-edit-action" onClick={() => saveEditing(cartera.id)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </button>
                              <button className="cartera-edit-action" onClick={cancelEditing}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                            </div>
                          ) : (
                            <div className="cartera-name-row">
                              <h3 className="cartera-name">{cartera.name}</h3>
                              <button className="cartera-edit-btn" onClick={() => startEditing(cartera)} title="Editar nombre">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="cartera-header-actions">
                          <span className="cartera-status-badge">{statusKey}</span>
                          {/* Botón Eliminar Cartera */}
                          <button className="cartera-delete-btn" onClick={() => handleEliminarCartera(cartera.id)} title="Eliminar cartera">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>

                      {/* Cartera Body */}
                      <div className="cartera-body">
                        {carteraClientes.length === 0 ? (
                          <div className="cartera-empty">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            <p>Arrastra clientes aquí</p>
                          </div>
                        ) : (
                          carteraClientes.map(cliente => (
                            <div
                              key={cliente.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, cliente.id)}
                              onClick={() => setSelectedCliente(cliente)}
                              className="cliente-card"
                              title="Clic para ver detalles · Arrastrar para mover"
                            >
                              <p className="cliente-name">{cliente.name}</p>
                              <div className="cliente-info">
                                <div className="cliente-info-row">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                  <span>{cliente.dpi}</span>
                                </div>
                                <div className="cliente-info-row">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                  <span>{cliente.phone}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="cartera-footer">
                        {carteraClientes.length} {carteraClientes.length === 1 ? 'cliente' : 'clientes'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= MODAL EXPEDIENTE DEL CLIENTE ================= */}
      {selectedCliente && !selectedLoan && (
        <div className="modal-overlay" onClick={() => setSelectedCliente(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Expediente del Cliente
              </h2>
              <button className="modal-close" onClick={() => setSelectedCliente(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div>
                  <h3 className="modal-section-title">Datos Personales</h3>
                  <div className="modal-data-group">
                    <div className="modal-data-item">
                      <span className="modal-data-label">Nombre Completo</span>
                      <span className="modal-data-value modal-data-value-lg">{selectedCliente.name}</span>
                    </div>
                    <div className="modal-data-item">
                      <span className="modal-data-label">Documento de Identificación (DPI)</span>
                      <span className="modal-data-value">{selectedCliente.dpi}</span>
                    </div>
                    <div className="modal-data-item">
                      <span className="modal-data-label">Teléfono de Contacto</span>
                      <span className="modal-data-value">{selectedCliente.phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="modal-section-title">Ubicación Actual</h3>
                  <div className="modal-ubicacion-box">
                    <span className="modal-data-label">Cartera Asignada</span>
                    <span className="modal-data-value text-gold">{carteras.find(c => c.id === selectedCliente.carteraId)?.name || 'Desconocida'}</span>
                    <span className="modal-status-tag">
                      Estado: {carteras.find(c => c.id === selectedCliente.carteraId)?.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Préstamos Asociados - Clickeables */}
              <div className="modal-prestamos">
                <h3 className="modal-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  Préstamos Asociados
                </h3>

                {selectedCliente.loans && selectedCliente.loans.length > 0 ? (
                  <div className="modal-table-wrapper">
                    <table className="modal-table">
                      <thead>
                        <tr>
                          <th>Monto</th>
                          <th>Fecha</th>
                          <th>Estado</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCliente.loans.map(loan => (
                          <tr key={loan.id} className="tr-clickable" onClick={() => handleOpenLoan(loan)}>
                            <td className="td-monto">{loan.amount}</td>
                            <td>{loan.date}</td>
                            <td>
                              <span className={`loan-status-badge ${loan.status === 'Al día' ? 'status-ok' : loan.status === 'Pagado' ? 'status-paid' : 'status-late'}`}>
                                {loan.status}
                              </span>
                            </td>
                            <td>
                              <span className="loan-view-link">Ver detalle →</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="modal-empty-loans">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    <p>Este cliente no tiene préstamos activos o registrados en el sistema.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn-close" onClick={() => setSelectedCliente(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETALLE DEL PRÉSTAMO ================= */}
      {selectedLoan && !showGarantias && (
        <div className="modal-overlay" onClick={() => setSelectedLoan(null)}>
          <div className="modal-content modal-content-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                Detalle del Préstamo
              </h2>
              <button className="modal-close" onClick={() => setSelectedLoan(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="modal-body">
              {/* Sección: Información del Préstamo */}
              <h3 className="modal-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                Información del Préstamo
              </h3>
              <div className="loan-detail-grid">
                <div className="loan-detail-item">
                  <span className="modal-data-label">Monto Solicitado</span>
                  <span className="modal-data-value text-gold modal-data-value-lg">{selectedLoan.amount}</span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Interés (%)</span>
                  <span className="modal-data-value">{selectedLoan.interes}</span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Destino / Uso</span>
                  <span className="modal-data-value">{selectedLoan.destino}</span>
                </div>
              </div>

              {/* Caja de Monto Total */}
              <div className="loan-monto-total-box">
                <div className="loan-monto-total-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                  <span>Monto Total a Pagar (Capital + Interés):</span>
                </div>
                <span className="loan-monto-total-value">{selectedLoan.montoTotal}</span>
              </div>

              {/* Sección: Plan de Pago */}
              <h3 className="modal-section-title" style={{ marginTop: '24px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Plan de Pago
              </h3>
              <div className="loan-detail-grid">
                <div className="loan-detail-item">
                  <span className="modal-data-label">Periodicidad</span>
                  <span className="modal-data-value">{selectedLoan.periodicidad}</span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Número de Cuotas</span>
                  <span className="modal-data-value">{selectedLoan.cuotas}</span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Mora (%)</span>
                  <span className="modal-data-value">{selectedLoan.mora}</span>
                </div>
              </div>

              {/* Sección: Estado y Fecha */}
              <div className="loan-detail-grid" style={{ marginTop: '16px' }}>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Estado del Préstamo</span>
                  <span className={`loan-status-badge ${selectedLoan.status === 'Al día' ? 'status-ok' : selectedLoan.status === 'Pagado' ? 'status-paid' : 'status-late'}`}>
                    {selectedLoan.status}
                  </span>
                </div>
                <div className="loan-detail-item">
                  <span className="modal-data-label">Fecha de Emisión</span>
                  <span className="modal-data-value">{selectedLoan.date}</span>
                </div>
              </div>

              {/* Sección: Garantías - Botón para ver */}
              <div className="loan-garantia-section">
                <div className="loan-garantia-header">
                  <h3 className="modal-section-title" style={{ marginBottom: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Garantía(s)
                  </h3>
                  <span className="loan-garantia-count">{selectedLoan.garantias.length} registrada(s)</span>
                </div>
                {selectedLoan.garantias.length > 0 ? (
                  <button className="loan-garantia-btn" onClick={() => setShowGarantias(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    Ver Garantías del Préstamo
                  </button>
                ) : (
                  <p className="loan-garantia-empty">No se registraron garantías para este préstamo.</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn-close" onClick={() => setSelectedLoan(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL VISTA DE GARANTÍAS ================= */}
      {selectedLoan && showGarantias && (
        <div className="modal-overlay" onClick={() => { setShowGarantias(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Garantías del Préstamo
              </h2>
              <button className="modal-close" onClick={() => setShowGarantias(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
                      <span className="modal-data-value">{garantia.fotos} imagen(es) registrada(s)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="modal-btn-close" onClick={() => setShowGarantias(false)}>
                ← Volver al Préstamo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortafolioPage;
