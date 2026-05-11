import "./report.css";
import '../dashboard/dashboard.css';
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart, Line } from 'recharts';

// SVG Icons
const BarChartIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" /></svg>);
const TrendUpIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>);
const DollarIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>);
const UsersIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
const AlertTriangleIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
const ClockIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const ShieldIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
const ActivityIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>);
const UserXIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" /></svg>);
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
const CalendarIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>);
const DownloadIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>);
const RefreshIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>);
const ChevronDownIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>);
const ChevronUpIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>);
const PhoneIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>);
const ArchiveIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" /></svg>);
const SkullIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="8" /><circle cx="9" cy="9" r="1.5" fill="currentColor" /><circle cx="15" cy="9" r="1.5" fill="currentColor" /><path d="M8 20h8" /><path d="M10 16v4" /><path d="M14 16v4" /></svg>);

interface BalanceRow {
    id: string;
    cliente: string;
    fechaInicio: string;
    fechaFin: string;
    desembolso: number;
    interes: number;
    deudaOriginal: number;
    montoAbonado: number;
    pagosAtrasados: number;
    mora: number;
    saldoCapital: number;
    saldoInteres: number;
    saldoCartera: number;
    saldoCarteraMora: number;
}

const mockBalance: BalanceRow[] = [
    { id: 'CR-001', cliente: 'María López', fechaInicio: '01/01/2026', fechaFin: '01/07/2026', desembolso: 10000, interes: 5, deudaOriginal: 10500, montoAbonado: 4200, pagosAtrasados: 0, mora: 0, saldoCapital: 5800, saldoInteres: 500, saldoCartera: 6300, saldoCarteraMora: 6300 },
    { id: 'CR-002', cliente: 'Carlos Morales', fechaInicio: '15/02/2026', fechaFin: '15/08/2026', desembolso: 5000, interes: 8, deudaOriginal: 5400, montoAbonado: 1800, pagosAtrasados: 2, mora: 150, saldoCapital: 3200, saldoInteres: 400, saldoCartera: 3600, saldoCarteraMora: 3750 },
    { id: 'CR-003', cliente: 'Ana Gonzales', fechaInicio: '01/03/2026', fechaFin: '01/09/2026', desembolso: 8000, interes: 6, deudaOriginal: 8480, montoAbonado: 2120, pagosAtrasados: 1, mora: 80, saldoCapital: 5880, saldoInteres: 480, saldoCartera: 6360, saldoCarteraMora: 6440 },
    { id: 'CR-004', cliente: 'Juan Pérez', fechaInicio: '10/01/2026', fechaFin: '10/07/2026', desembolso: 15000, interes: 4, deudaOriginal: 15600, montoAbonado: 7800, pagosAtrasados: 0, mora: 0, saldoCapital: 7200, saldoInteres: 600, saldoCartera: 7800, saldoCarteraMora: 7800 },
    { id: 'CR-005', cliente: 'Rosa Hernández', fechaInicio: '20/03/2026', fechaFin: '20/09/2026', desembolso: 3000, interes: 10, deudaOriginal: 3300, montoAbonado: 550, pagosAtrasados: 3, mora: 220, saldoCapital: 2450, saldoInteres: 300, saldoCartera: 2750, saldoCarteraMora: 2970 },
    { id: 'CR-006', cliente: 'Pedro Ramírez', fechaInicio: '05/04/2026', fechaFin: '05/10/2026', desembolso: 12000, interes: 5, deudaOriginal: 12600, montoAbonado: 4200, pagosAtrasados: 0, mora: 0, saldoCapital: 7800, saldoInteres: 600, saldoCartera: 8400, saldoCarteraMora: 8400 },
];

interface ClienteInactivo {
    id: string;
    nombre: string;
    telefono: string;
    ultimoPrestamo: string;
    fechaFinalizacion: string;
    diasSinRenovar: number;
}

const mockInactivos: ClienteInactivo[] = [
    { id: 'CL-010', nombre: 'Fernando Castillo', telefono: '5555-1234', ultimoPrestamo: 'Q 5,000.00', fechaFinalizacion: '15/01/2026', diasSinRenovar: 115 },
    { id: 'CL-015', nombre: 'Luisa Ramírez', telefono: '5555-5678', ultimoPrestamo: 'Q 3,000.00', fechaFinalizacion: '28/02/2026', diasSinRenovar: 71 },
    { id: 'CL-022', nombre: 'Roberto Méndez', telefono: '5555-9012', ultimoPrestamo: 'Q 8,000.00', fechaFinalizacion: '10/12/2025', diasSinRenovar: 151 },
    { id: 'CL-031', nombre: 'Patricia Solís', telefono: '5555-3456', ultimoPrestamo: 'Q 2,500.00', fechaFinalizacion: '20/03/2026', diasSinRenovar: 51 },
];

// Datos de rendimiento mensual (empresa)
const mockRendimientoMensual = [
    { mes: 'Ene', desembolso: 28000, recaudado: 18500, interes: 2100, mora: 320, ganancia: 2100 - 320 },
    { mes: 'Feb', desembolso: 32000, recaudado: 22000, interes: 2500, mora: 180, ganancia: 2500 - 180 },
    { mes: 'Mar', desembolso: 25000, recaudado: 19800, interes: 1900, mora: 450, ganancia: 1900 - 450 },
    { mes: 'Abr', desembolso: 35000, recaudado: 26500, interes: 2800, mora: 280, ganancia: 2800 - 280 },
    { mes: 'May', desembolso: 53000, recaudado: 20670, interes: 2880, mora: 450, ganancia: 2880 - 450 },
];

// Datos de rendimiento por asesor
interface AsesorRendimiento {
    id: string;
    nombre: string;
    iniciales: string;
    ruta: string;
    clientesAsignados: number;
    clientesCobrados: number;
    montoRecaudado: number;
    montoEsperado: number;
    moraGenerada: number;
    interesRecaudado: number;
    efectividad: number;
}

const mockAsesores: AsesorRendimiento[] = [
    { id: 'AS-001', nombre: 'Pedro Ramírez', iniciales: 'PR', ruta: 'Ruta Centro - Zona 1', clientesAsignados: 25, clientesCobrados: 23, montoRecaudado: 12500, montoEsperado: 14000, moraGenerada: 120, interesRecaudado: 1800, efectividad: 92 },
    { id: 'AS-002', nombre: 'Luis Mendoza', iniciales: 'LM', ruta: 'Ruta Minerva - Zona 3', clientesAsignados: 20, clientesCobrados: 18, montoRecaudado: 9800, montoEsperado: 11500, moraGenerada: 350, interesRecaudado: 1400, efectividad: 85 },
    { id: 'AS-003', nombre: 'Roberto Castillo', iniciales: 'RC', ruta: 'Ruta Democracia - Zona 3', clientesAsignados: 30, clientesCobrados: 29, montoRecaudado: 18200, montoEsperado: 19000, moraGenerada: 80, interesRecaudado: 2600, efectividad: 96 },
    { id: 'AS-004', nombre: 'María García', iniciales: 'MG', ruta: 'Ruta Américas - Zona 7', clientesAsignados: 18, clientesCobrados: 14, montoRecaudado: 6500, montoEsperado: 9200, moraGenerada: 580, interesRecaudado: 950, efectividad: 71 },
    { id: 'AS-005', nombre: 'Jorge Flores', iniciales: 'JF', ruta: 'Ruta Terminal - Zona 8', clientesAsignados: 22, clientesCobrados: 20, montoRecaudado: 11000, montoEsperado: 12800, moraGenerada: 200, interesRecaudado: 1600, efectividad: 86 },
];

type ReportTab = 'balance' | 'activos' | 'faltaPago' | 'morosidad' | 'carteraVencida' | 'carteraMuerta' | 'rendimiento' | 'inactivos';

const formatMoney = (amount: number) => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<ReportTab>('balance');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const tabs: { key: ReportTab; label: string; icon: React.ReactNode; color: string }[] = [
        { key: 'balance', label: 'Balance', icon: <BarChartIcon />, color: '#cca641' },
        { key: 'activos', label: 'Activos', icon: <ShieldIcon />, color: '#10b981' },
        { key: 'faltaPago', label: 'Falta de Pago', icon: <ClockIcon />, color: '#f59e0b' },
        { key: 'morosidad', label: 'Morosidad', icon: <AlertTriangleIcon />, color: '#ef4444' },
        { key: 'carteraVencida', label: 'Cartera Vencida', icon: <ArchiveIcon />, color: '#8b5cf6' },
        { key: 'carteraMuerta', label: 'Cartera Muerta', icon: <SkullIcon />, color: '#6b7280' },
        { key: 'rendimiento', label: 'Rendimiento', icon: <ActivityIcon />, color: '#3b82f6' },
        { key: 'inactivos', label: 'Inactivos', icon: <UserXIcon />, color: '#f97316' },
    ];

    const balanceFiltered = useMemo(() => {
        if (!searchTerm) return mockBalance;
        return mockBalance.filter(r => r.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [searchTerm]);

    const totals = useMemo(() => {
        return mockBalance.reduce((acc, r) => ({
            desembolso: acc.desembolso + r.desembolso,
            deudaOriginal: acc.deudaOriginal + r.deudaOriginal,
            montoAbonado: acc.montoAbonado + r.montoAbonado,
            mora: acc.mora + r.mora,
            saldoCartera: acc.saldoCartera + r.saldoCartera,
            saldoCarteraMora: acc.saldoCarteraMora + r.saldoCarteraMora,
        }), { desembolso: 0, deudaOriginal: 0, montoAbonado: 0, mora: 0, saldoCartera: 0, saldoCarteraMora: 0 });
    }, []);

    const activosCount = mockBalance.filter(r => r.pagosAtrasados === 0).length;
    const morosidadCount = mockBalance.filter(r => r.mora > 0).length;
    const collectionRate = totals.deudaOriginal > 0 ? (totals.montoAbonado / totals.deudaOriginal) * 100 : 0;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'balance': return <VistaBalance data={balanceFiltered} totals={totals} searchTerm={searchTerm} setSearchTerm={setSearchTerm} expandedRowId={expandedRowId} setExpandedRowId={setExpandedRowId} />;
            case 'activos': return <VistaActivos data={mockBalance.filter(r => r.pagosAtrasados === 0)} />;
            case 'faltaPago': return <VistaFaltaPago data={mockBalance.filter(r => r.pagosAtrasados > 0)} />;
            case 'morosidad': return <VistaMorosidad data={mockBalance.filter(r => r.mora > 0)} />;
            case 'carteraVencida': return <VistaCarteraVencida />;
            case 'carteraMuerta': return <VistaCarteraMuerta />;
            case 'rendimiento': return <VistaRendimiento totals={totals} collectionRate={collectionRate} activosCount={activosCount} morosidadCount={morosidadCount} totalCreditos={mockBalance.length} />;
            case 'inactivos': return <VistaInactivos data={mockInactivos} />;
            default: return null;
        }
    };

    return (
        <div className="reports-container w-100 h-100 d-flex flex-column overflow-auto custom-scrollbar">
            {/* HEADER */}
            <div className="reports-header p-4 p-lg-5">
                <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="rpt-date-badge"><CalendarIcon /> REPORTES GENERALES</span>
                        </div>
                        <h1 className="rpt-title">Centro de Reportes</h1>
                        <p className="rpt-subtitle mt-1">Análisis integral de la cartera de créditos</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="rpt-action-btn"><RefreshIcon /> Actualizar</button>
                        <button className="rpt-action-btn rpt-action-btn-gold"><DownloadIcon /> Exportar</button>
                    </div>
                </div>

                {/* KPI CARDS ROW */}
                <div className="rpt-kpi-row">
                    <div className="rpt-kpi-card">
                        <div className="rpt-kpi-icon" style={{ background: 'rgba(204,166,65,0.12)', borderColor: 'rgba(204,166,65,0.3)', color: '#cca641' }}><DollarIcon /></div>
                        <div>
                            <p className="rpt-kpi-label">Total Desembolsado</p>
                            <p className="rpt-kpi-value">{formatMoney(totals.desembolso)}</p>
                        </div>
                    </div>
                    <div className="rpt-kpi-card">
                        <div className="rpt-kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }}><TrendUpIcon /></div>
                        <div>
                            <p className="rpt-kpi-label">Total Recaudado</p>
                            <p className="rpt-kpi-value" style={{ color: '#10b981' }}>{formatMoney(totals.montoAbonado)}</p>
                        </div>
                    </div>
                    <div className="rpt-kpi-card">
                        <div className="rpt-kpi-icon" style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}><AlertTriangleIcon /></div>
                        <div>
                            <p className="rpt-kpi-label">Total Mora</p>
                            <p className="rpt-kpi-value" style={{ color: '#ef4444' }}>{formatMoney(totals.mora)}</p>
                        </div>
                    </div>
                    <div className="rpt-kpi-card">
                        <div className="rpt-kpi-icon" style={{ background: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)', color: '#3b82f6' }}><UsersIcon /></div>
                        <div>
                            <p className="rpt-kpi-label">Créditos Activos</p>
                            <p className="rpt-kpi-value" style={{ color: '#3b82f6' }}>{mockBalance.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS DE NAVEGACIÓN */}
            <div className="px-4 px-lg-5 mb-4">
                <div className="rpt-tabs-container">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`rpt-tab-btn ${activeTab === tab.key ? 'rpt-tab-active' : ''}`}
                            onClick={() => { setActiveTab(tab.key); setSearchTerm(''); setExpandedRowId(null); }}
                            style={activeTab === tab.key ? { '--tab-color': tab.color } as React.CSSProperties : {}}
                        >
                            <span className="rpt-tab-icon" style={{ color: activeTab === tab.key ? tab.color : undefined }}>{tab.icon}</span>
                            <span className="rpt-tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENIDO DINÁMICO */}
            <div className="px-4 px-lg-5 pb-5 flex-fill">
                {renderTabContent()}
            </div>
        </div>
    );
}

// =====================================================================
// VISTA: BALANCE GENERAL
// =====================================================================
function VistaBalance({ data, totals, searchTerm, setSearchTerm, expandedRowId, setExpandedRowId }: {
    data: BalanceRow[];
    totals: { desembolso: number; deudaOriginal: number; montoAbonado: number; mora: number; saldoCartera: number; saldoCarteraMora: number };
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    expandedRowId: string | null;
    setExpandedRowId: (v: string | null) => void;
}) {
    return (
        <div className="rpt-section-animate">
            {/* Header */}
            <div className="rpt-section-header mb-4">
                <div className="rpt-section-icon" style={{ background: 'rgba(204,166,65,0.1)', borderColor: 'rgba(204,166,65,0.3)' }}>
                    <BarChartIcon />
                </div>
                <div style={{ flex: 1 }}>
                    <h2 className="rpt-section-title">Balance General de Créditos</h2>
                    <p className="rpt-section-subtitle">Información de todos los créditos vigentes de la empresa</p>
                </div>
                <span className="rpt-count-badge">{data.length} créditos</span>
            </div>

            {/* Buscador */}
            <div className="rpt-search-box mb-4">
                <span style={{ color: 'rgba(204,166,65,0.5)', flexShrink: 0 }}><SearchIcon /></span>
                <input type="text" placeholder="Buscar por cliente o No. de crédito..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* Tabla de Balance */}
            <div className="rpt-table-wrapper">
                <table className="rpt-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                            <th>Desembolso</th>
                            <th>Int. %</th>
                            <th>Deuda Original</th>
                            <th>Abonado</th>
                            <th>Atrasos</th>
                            <th>Mora</th>
                            <th>S. Capital</th>
                            <th>S. Interés</th>
                            <th>S. Cartera</th>
                            <th>S. Cart+Mora</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(row => (
                            <React.Fragment key={row.id}>
                                <tr className={`rpt-table-row ${expandedRowId === row.id ? 'rpt-row-expanded' : ''} ${row.pagosAtrasados > 0 ? 'rpt-row-warning' : ''}`}
                                    onClick={() => setExpandedRowId(expandedRowId === row.id ? null : row.id)}>
                                    <td className="rpt-td-id">{row.id}</td>
                                    <td className="rpt-td-name">{row.cliente}</td>
                                    <td>{row.fechaInicio}</td>
                                    <td>{row.fechaFin}</td>
                                    <td className="rpt-td-money">{formatMoney(row.desembolso)}</td>
                                    <td>{row.interes}%</td>
                                    <td className="rpt-td-money">{formatMoney(row.deudaOriginal)}</td>
                                    <td className="rpt-td-money rpt-td-green">{formatMoney(row.montoAbonado)}</td>
                                    <td><span className={`rpt-atraso-badge ${row.pagosAtrasados > 0 ? 'rpt-atraso-danger' : 'rpt-atraso-ok'}`}>{row.pagosAtrasados}</span></td>
                                    <td className={`rpt-td-money ${row.mora > 0 ? 'rpt-td-red' : ''}`}>{formatMoney(row.mora)}</td>
                                    <td className="rpt-td-money">{formatMoney(row.saldoCapital)}</td>
                                    <td className="rpt-td-money">{formatMoney(row.saldoInteres)}</td>
                                    <td className="rpt-td-money rpt-td-gold">{formatMoney(row.saldoCartera)}</td>
                                    <td className="rpt-td-money rpt-td-gold">{formatMoney(row.saldoCarteraMora)}</td>
                                    <td>
                                        <div className={`rpt-expand-btn ${expandedRowId === row.id ? 'rpt-expand-active' : ''}`}>
                                            {expandedRowId === row.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                        </div>
                                    </td>
                                </tr>
                                {expandedRowId === row.id && (
                                    <tr className="rpt-detail-row">
                                        <td colSpan={15}>
                                            <div className="rpt-row-detail">
                                                <div className="row g-3">
                                                    <div className="col-md-3">
                                                        <div className="rpt-detail-mini-card">
                                                            <p className="rpt-mini-label">% Recuperado</p>
                                                            <p className="rpt-mini-value" style={{ color: '#10b981' }}>{row.deudaOriginal > 0 ? Math.round((row.montoAbonado / row.deudaOriginal) * 100) : 0}%</p>
                                                            <div className="rpt-mini-bar"><div className="rpt-mini-bar-fill" style={{ width: `${row.deudaOriginal > 0 ? Math.round((row.montoAbonado / row.deudaOriginal) * 100) : 0}%`, background: 'linear-gradient(135deg, #10b981, #34d399)' }} /></div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="rpt-detail-mini-card">
                                                            <p className="rpt-mini-label">Saldo Pendiente</p>
                                                            <p className="rpt-mini-value">{formatMoney(row.saldoCarteraMora)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="rpt-detail-mini-card">
                                                            <p className="rpt-mini-label">Estado</p>
                                                            <p className="rpt-mini-value">
                                                                <span className={`rpt-status-badge ${row.pagosAtrasados === 0 ? 'rpt-status-ok' : 'rpt-status-danger'}`}>
                                                                    {row.pagosAtrasados === 0 ? 'Al día' : 'En atraso'}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="rpt-detail-mini-card">
                                                            <p className="rpt-mini-label">Interés Generado</p>
                                                            <p className="rpt-mini-value" style={{ color: '#cca641' }}>{formatMoney(row.saldoInteres)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="rpt-table-footer">
                            <td colSpan={4} className="rpt-footer-label">TOTALES</td>
                            <td className="rpt-td-money rpt-td-gold">{formatMoney(totals.desembolso)}</td>
                            <td></td>
                            <td className="rpt-td-money rpt-td-gold">{formatMoney(totals.deudaOriginal)}</td>
                            <td className="rpt-td-money rpt-td-green">{formatMoney(totals.montoAbonado)}</td>
                            <td></td>
                            <td className="rpt-td-money rpt-td-red">{formatMoney(totals.mora)}</td>
                            <td></td>
                            <td></td>
                            <td className="rpt-td-money rpt-td-gold">{formatMoney(totals.saldoCartera)}</td>
                            <td className="rpt-td-money rpt-td-gold">{formatMoney(totals.saldoCarteraMora)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

// =====================================================================
// VISTA: ACTIVOS NO VENCIDOS
// =====================================================================
function VistaActivos({ data }: { data: BalanceRow[] }) {
    return (
        <div className="rpt-section-animate">
            <div className="rpt-section-header mb-4">
                <div className="rpt-section-icon" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }}><ShieldIcon /></div>
                <div style={{ flex: 1 }}>
                    <h2 className="rpt-section-title">Créditos Activos No Vencidos</h2>
                    <p className="rpt-section-subtitle">Créditos vigentes con pagos al día</p>
                </div>
                <span className="rpt-count-badge" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }}>{data.length}</span>
            </div>

            <div className="d-flex flex-column gap-3">
                {data.map(row => (
                    <div key={row.id} className="rpt-card-item rpt-card-ok">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="rpt-card-avatar rpt-avatar-ok">{row.cliente.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                <div>
                                    <p className="rpt-card-name">{row.cliente}</p>
                                    <p className="rpt-card-sub">{row.id} &bull; {row.fechaInicio} - {row.fechaFin}</p>
                                </div>
                            </div>
                            <div className="d-flex gap-4 align-items-center flex-wrap">
                                <div className="text-end">
                                    <p className="rpt-card-label">Desembolso</p>
                                    <p className="rpt-card-amount">{formatMoney(row.desembolso)}</p>
                                </div>
                                <div className="text-end">
                                    <p className="rpt-card-label">Abonado</p>
                                    <p className="rpt-card-amount" style={{ color: '#10b981' }}>{formatMoney(row.montoAbonado)}</p>
                                </div>
                                <div className="text-end">
                                    <p className="rpt-card-label">Saldo</p>
                                    <p className="rpt-card-amount" style={{ color: '#cca641' }}>{formatMoney(row.saldoCartera)}</p>
                                </div>
                                <span className="rpt-status-badge rpt-status-ok">Al día</span>
                            </div>
                        </div>
                    </div>
                ))}
                {data.length === 0 && <EmptyState text="No hay créditos activos al día." />}
            </div>
        </div>
    );
}

// =====================================================================
// VISTA: FALTA DE PAGO
// =====================================================================
function VistaFaltaPago({ data }: { data: BalanceRow[] }) {
    return (
        <div className="rpt-section-animate">
            <div className="rpt-section-header mb-4">
                <div className="rpt-section-icon" style={{ background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }}><ClockIcon /></div>
                <div style={{ flex: 1 }}>
                    <h2 className="rpt-section-title">Falta de Pago</h2>
                    <p className="rpt-section-subtitle">Clientes que no han realizado sus pagos a tiempo</p>
                </div>
                <span className="rpt-count-badge" style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }}>{data.length}</span>
            </div>

            <div className="d-flex flex-column gap-3">
                {data.map(row => (
                    <div key={row.id} className="rpt-card-item rpt-card-warning">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="rpt-card-avatar rpt-avatar-warning">{row.cliente.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                <div>
                                    <p className="rpt-card-name">{row.cliente}</p>
                                    <p className="rpt-card-sub">{row.id} &bull; {row.fechaInicio} - {row.fechaFin}</p>
                                </div>
                            </div>
                            <div className="d-flex gap-4 align-items-center flex-wrap">
                                <div className="text-end">
                                    <p className="rpt-card-label">Pagos Atrasados</p>
                                    <p className="rpt-card-amount" style={{ color: '#f59e0b' }}>{row.pagosAtrasados}</p>
                                </div>
                                <div className="text-end">
                                    <p className="rpt-card-label">Saldo Pendiente</p>
                                    <p className="rpt-card-amount">{formatMoney(row.saldoCartera)}</p>
                                </div>
                                <span className="rpt-status-badge rpt-status-warning">Atraso</span>
                            </div>
                        </div>
                    </div>
                ))}
                {data.length === 0 && <EmptyState text="No hay clientes con falta de pago." />}
            </div>
        </div>
    );
}

// =====================================================================
// VISTA: MOROSIDAD
// =====================================================================
function VistaMorosidad({ data }: { data: BalanceRow[] }) {
    const totalMora = data.reduce((s, r) => s + r.mora, 0);
    return (
        <div className="rpt-section-animate">
            <div className="rpt-section-header mb-4">
                <div className="rpt-section-icon" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}><AlertTriangleIcon /></div>
                <div style={{ flex: 1 }}>
                    <h2 className="rpt-section-title">Clientes en Mora</h2>
                    <p className="rpt-section-subtitle">Clientes con mora acumulada por pagos atrasados</p>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <div className="text-end">
                        <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(239,68,68,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Total Mora</p>
                        <p style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444', margin: 0 }}>{formatMoney(totalMora)}</p>
                    </div>
                    <span className="rpt-count-badge" style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>{data.length}</span>
                </div>
            </div>

            <div className="d-flex flex-column gap-3">
                {data.map(row => {
                    const porcentajeMora = row.deudaOriginal > 0 ? (row.mora / row.deudaOriginal) * 100 : 0;
                    return (
                        <div key={row.id} className="rpt-card-item rpt-card-danger">
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rpt-card-avatar rpt-avatar-danger">{row.cliente.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                    <div>
                                        <p className="rpt-card-name">{row.cliente}</p>
                                        <p className="rpt-card-sub">{row.id} &bull; {row.pagosAtrasados} pagos atrasados</p>
                                    </div>
                                </div>
                                <div className="d-flex gap-4 align-items-center flex-wrap">
                                    <div className="text-end">
                                        <p className="rpt-card-label">Mora</p>
                                        <p className="rpt-card-amount" style={{ color: '#ef4444' }}>{formatMoney(row.mora)}</p>
                                    </div>
                                    <div className="text-end">
                                        <p className="rpt-card-label">% sobre deuda</p>
                                        <p className="rpt-card-amount" style={{ color: '#f59e0b' }}>{porcentajeMora.toFixed(1)}%</p>
                                    </div>
                                    <span className="rpt-status-badge rpt-status-danger">Moroso</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {data.length === 0 && <EmptyState text="No hay clientes en mora." />}
            </div>
        </div>
    );
}

// =====================================================================
// VISTA: CARTERA VENCIDA
// =====================================================================
function VistaCarteraVencida() {
    return (
        <div className="rpt-section-animate">
            <div className="rpt-section-header mb-4">
                <div className="rpt-section-icon" style={{ background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)', color: '#8b5cf6' }}><ArchiveIcon /></div>
                <div style={{ flex: 1 }}>
                    <h2 className="rpt-section-title">Cartera Vencida</h2>
                    <p className="rpt-section-subtitle">Créditos cuyo plazo ha finalizado sin liquidarse completamente</p>
                </div>
            </div>
            <EmptyState text="La información de cartera vencida se mostrará cuando se conecte con el backend." icon={<ArchiveIcon />} />
        </div>
    );
}

// =====================================================================
// VISTA: CARTERA MUERTA
// =====================================================================
function VistaCarteraMuerta() {
    return (
        <div className="rpt-section-animate">
            <div className="rpt-section-header mb-4">
                <div className="rpt-section-icon" style={{ background: 'rgba(107,114,128,0.1)', borderColor: 'rgba(107,114,128,0.3)', color: '#6b7280' }}><SkullIcon /></div>
                <div style={{ flex: 1 }}>
                    <h2 className="rpt-section-title">Cartera Muerta</h2>
                    <p className="rpt-section-subtitle">Créditos considerados como irrecuperables</p>
                </div>
            </div>
            <EmptyState text="La información de cartera muerta se mostrará cuando se conecte con el backend." icon={<SkullIcon />} />
        </div>
    );
}

// =====================================================================
// VISTA: RENDIMIENTO (con gráficas Recharts)
// =====================================================================

const CHART_COLORS = {
    gold: '#cca641',
    goldLight: '#f6e073',
    green: '#10b981',
    greenLight: '#34d399',
    red: '#ef4444',
    orange: '#f59e0b',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    gray: '#6b7280',
};

const PIE_COLORS = [CHART_COLORS.green, CHART_COLORS.red, CHART_COLORS.orange];

const chartTooltipStyle = {
    contentStyle: { background: '#0b1f33', border: '1px solid rgba(204,166,65,0.25)', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' },
    labelStyle: { color: '#cca641', fontWeight: 700, marginBottom: '4px' },
    itemStyle: { color: 'rgba(255,255,255,0.7)', fontSize: '11px' },
};

function CustomTooltipMoney({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
    if (!active || !payload) return null;
    return (
        <div style={{ ...chartTooltipStyle.contentStyle, padding: '12px 16px' }}>
            <p style={{ ...chartTooltipStyle.labelStyle, margin: '0 0 6px' }}>{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ margin: '2px 0', fontSize: '11px', color: entry.color }}>
                    <span style={{ fontWeight: 700 }}>{entry.name}:</span> {formatMoney(entry.value)}
                </p>
            ))}
        </div>
    );
}

function VistaRendimiento({ totals, collectionRate, activosCount, morosidadCount, totalCreditos }: {
    totals: { desembolso: number; deudaOriginal: number; montoAbonado: number; mora: number; saldoCartera: number; saldoCarteraMora: number };
    collectionRate: number;
    activosCount: number;
    morosidadCount: number;
    totalCreditos: number;
}) {
    const gananciaEstimada = totals.deudaOriginal - totals.desembolso;
    const gananciaRecuperada = totals.montoAbonado > totals.desembolso ? totals.montoAbonado - totals.desembolso : 0;

    const pieData = [
        { name: 'Al día', value: activosCount },
        { name: 'En mora', value: morosidadCount },
        { name: 'Falta pago', value: totalCreditos - activosCount - morosidadCount > 0 ? totalCreditos - activosCount - morosidadCount : 0 },
    ].filter(d => d.value > 0);

    const asesoresSorted = useMemo(() => [...mockAsesores].sort((a, b) => b.efectividad - a.efectividad), []);
    const asesorBarData = useMemo(() => mockAsesores.map(a => ({
        nombre: a.iniciales,
        nombreCompleto: a.nombre,
        recaudado: a.montoRecaudado,
        esperado: a.montoEsperado,
        interes: a.interesRecaudado,
        mora: a.moraGenerada,
        efectividad: a.efectividad,
    })), []);

    return (
        <div className="rpt-section-animate">
            <div className="rpt-section-header mb-4">
                <div className="rpt-section-icon" style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)', color: '#3b82f6' }}><ActivityIcon /></div>
                <div style={{ flex: 1 }}>
                    <h2 className="rpt-section-title">Rendimiento General</h2>
                    <p className="rpt-section-subtitle">Métricas de rendimiento de toda la empresa</p>
                </div>
            </div>

            {/* FILA 1: KPI Cards */}
            <div className="row g-4 mb-4">
                <div className="col-md-6 col-lg-3">
                    <div className="rpt-metric-card rpt-metric-compact">
                        <p className="rpt-metric-title">Capital Colocado</p>
                        <p className="rpt-metric-big-value" style={{ fontSize: '1.4rem' }}>{formatMoney(totals.desembolso)}</p>
                        <div className="rpt-metric-badge-row mt-2"><span className="rpt-metric-change rpt-change-up"><TrendUpIcon /> Activo</span></div>
                    </div>
                </div>
                <div className="col-md-6 col-lg-3">
                    <div className="rpt-metric-card rpt-metric-compact">
                        <p className="rpt-metric-title">Ganancia por Interés</p>
                        <p className="rpt-metric-big-value" style={{ fontSize: '1.4rem', color: '#cca641' }}>{formatMoney(gananciaEstimada)}</p>
                    </div>
                </div>
                <div className="col-md-6 col-lg-3">
                    <div className="rpt-metric-card rpt-metric-compact">
                        <p className="rpt-metric-title">Ganancia Recuperada</p>
                        <p className="rpt-metric-big-value" style={{ fontSize: '1.4rem', color: '#10b981' }}>{formatMoney(gananciaRecuperada)}</p>
                    </div>
                </div>
                <div className="col-md-6 col-lg-3">
                    <div className="rpt-metric-card rpt-metric-compact">
                        <p className="rpt-metric-title">Pérdida por Mora</p>
                        <p className="rpt-metric-big-value" style={{ fontSize: '1.4rem', color: '#ef4444' }}>{formatMoney(totals.mora)}</p>
                    </div>
                </div>
            </div>

            {/* FILA 2: Gráfica de Ganancia vs Pérdida + Donut de distribución */}
            <div className="row g-4 mb-4">
                {/* Gráfica principal - Rendimiento Mensual (Ganancia e Interés) */}
                <div className="col-lg-8">
                    <div className="rpt-metric-card" style={{ height: '100%' }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="rpt-metric-title">Rendimiento Mensual</p>
                                <p className="rpt-metric-subtitle">Interés ganado vs mora perdida por mes</p>
                            </div>
                            <div className="d-flex gap-3">
                                <div className="d-flex align-items-center gap-1"><span className="rpt-dot" style={{ background: CHART_COLORS.gold }}></span><span className="rpt-chart-legend-text">Interés</span></div>
                                <div className="d-flex align-items-center gap-1"><span className="rpt-dot" style={{ background: CHART_COLORS.green }}></span><span className="rpt-chart-legend-text">Ganancia Neta</span></div>
                                <div className="d-flex align-items-center gap-1"><span className="rpt-dot" style={{ background: CHART_COLORS.red }}></span><span className="rpt-chart-legend-text">Mora</span></div>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: 280 }}>
                            <ResponsiveContainer>
                                <ComposedChart data={mockRendimientoMensual} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="gradGanancia" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="mes" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltipMoney />} />
                                    <Bar dataKey="interes" name="Interés" fill={CHART_COLORS.gold} radius={[4, 4, 0, 0]} barSize={28} fillOpacity={0.85} />
                                    <Bar dataKey="mora" name="Mora" fill={CHART_COLORS.red} radius={[4, 4, 0, 0]} barSize={28} fillOpacity={0.7} />
                                    <Area dataKey="ganancia" name="Ganancia Neta" type="monotone" fill="url(#gradGanancia)" stroke={CHART_COLORS.green} strokeWidth={2.5} dot={{ r: 4, fill: CHART_COLORS.green, strokeWidth: 0 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Donut de distribución de cartera + Tasa */}
                <div className="col-lg-4">
                    <div className="rpt-metric-card rpt-metric-tall">
                        <p className="rpt-metric-title">Distribución de Cartera</p>
                        <p className="rpt-metric-subtitle">Estado actual de los créditos</p>
                        <div style={{ width: '100%', height: 200 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                        {pieData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} style={{ filter: `drop-shadow(0 0 6px ${PIE_COLORS[i % PIE_COLORS.length]}40)` }} />))}
                                    </Pie>
                                    <Legend verticalAlign="bottom" iconType="circle" iconSize={8}
                                        formatter={(value: string) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: 600 }}>{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="rpt-donut-overlay-stat">
                            <span className="rpt-donut-value" style={{ fontSize: '20px' }}>{Math.round(collectionRate)}%</span>
                            <span className="rpt-donut-label">Recuperación</span>
                        </div>
                        <div className="d-flex justify-content-between mt-2">
                            <div><p className="rpt-metric-stat-label">Saldo Cartera</p><p className="rpt-metric-stat-val" style={{ color: '#cca641' }}>{formatMoney(totals.saldoCartera)}</p></div>
                            <div className="text-end"><p className="rpt-metric-stat-label">Recaudado</p><p className="rpt-metric-stat-val" style={{ color: '#10b981' }}>{formatMoney(totals.montoAbonado)}</p></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FILA 3: Gráfica Capital Desembolsado vs Recaudado */}
            <div className="row g-4 mb-4">
                <div className="col-12">
                    <div className="rpt-metric-card">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="rpt-metric-title">Capital: Desembolso vs Recaudación</p>
                                <p className="rpt-metric-subtitle">Flujo de capital mensual de la empresa</p>
                            </div>
                            <div className="d-flex gap-3">
                                <div className="d-flex align-items-center gap-1"><span className="rpt-dot" style={{ background: CHART_COLORS.blue }}></span><span className="rpt-chart-legend-text">Desembolso</span></div>
                                <div className="d-flex align-items-center gap-1"><span className="rpt-dot" style={{ background: CHART_COLORS.green }}></span><span className="rpt-chart-legend-text">Recaudado</span></div>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <AreaChart data={mockRendimientoMensual} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="gradDesembolso" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.25} />
                                            <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradRecaudado" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.25} />
                                            <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="mes" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltipMoney />} />
                                    <Area type="monotone" dataKey="desembolso" name="Desembolso" stroke={CHART_COLORS.blue} strokeWidth={2.5} fill="url(#gradDesembolso)" dot={{ r: 4, fill: CHART_COLORS.blue, strokeWidth: 0 }} />
                                    <Area type="monotone" dataKey="recaudado" name="Recaudado" stroke={CHART_COLORS.green} strokeWidth={2.5} fill="url(#gradRecaudado)" dot={{ r: 4, fill: CHART_COLORS.green, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= RENDIMIENTO DE ASESORES ================= */}
            <div className="rpt-section-header mb-4 mt-5" style={{ borderColor: 'rgba(204,166,65,0.15)' }}>
                <div className="rpt-section-icon" style={{ background: 'rgba(204,166,65,0.1)', borderColor: 'rgba(204,166,65,0.3)', color: '#cca641' }}><UsersIcon /></div>
                <div style={{ flex: 1 }}>
                    <h2 className="rpt-section-title">Rendimiento de Asesores</h2>
                    <p className="rpt-section-subtitle">Ranking y métricas de desempeño por asesor de cobro</p>
                </div>
            </div>

            {/* FILA 4: Gráfica Asesores - Recaudación + Ranking */}
            <div className="row g-4 mb-4">
                {/* Gráfica de barras - Recaudación por asesor */}
                <div className="col-lg-7">
                    <div className="rpt-metric-card" style={{ height: '100%' }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="rpt-metric-title">Recaudación por Asesor</p>
                                <p className="rpt-metric-subtitle">Monto recaudado vs esperado e interés generado</p>
                            </div>
                            <div className="d-flex gap-3">
                                <div className="d-flex align-items-center gap-1"><span className="rpt-dot" style={{ background: CHART_COLORS.green }}></span><span className="rpt-chart-legend-text">Recaudado</span></div>
                                <div className="d-flex align-items-center gap-1"><span className="rpt-dot" style={{ background: CHART_COLORS.gold }}></span><span className="rpt-chart-legend-text">Interés</span></div>
                                <div className="d-flex align-items-center gap-1"><span className="rpt-dot" style={{ background: CHART_COLORS.blue }}></span><span className="rpt-chart-legend-text">Efectividad</span></div>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <ComposedChart data={asesorBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="nombre" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                                    <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickFormatter={(v) => `Q${(v / 1000).toFixed(0)}k`} />
                                    <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                                    <Tooltip content={({ active, payload, label }) => {
                                        if (!active || !payload) return null;
                                        const asesor = mockAsesores.find(a => a.iniciales === label);
                                        return (
                                            <div style={{ ...chartTooltipStyle.contentStyle, padding: '12px 16px' }}>
                                                <p style={{ ...chartTooltipStyle.labelStyle, margin: '0 0 6px' }}>{asesor?.nombre || label}</p>
                                                {payload.map((entry, i) => (
                                                    <p key={i} style={{ margin: '2px 0', fontSize: '11px', color: entry.color as string }}>
                                                        <span style={{ fontWeight: 700 }}>{entry.name}:</span> {entry.name === 'Efectividad' ? `${entry.value}%` : formatMoney(entry.value as number)}
                                                    </p>
                                                ))}
                                            </div>
                                        );
                                    }} />
                                    <Bar yAxisId="left" dataKey="recaudado" name="Recaudado" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} barSize={24} fillOpacity={0.85} />
                                    <Bar yAxisId="left" dataKey="interes" name="Interés" fill={CHART_COLORS.gold} radius={[4, 4, 0, 0]} barSize={24} fillOpacity={0.85} />
                                    <Line yAxisId="right" type="monotone" dataKey="efectividad" name="Efectividad" stroke={CHART_COLORS.blue} strokeWidth={2.5} dot={{ r: 5, fill: CHART_COLORS.blue, strokeWidth: 2, stroke: '#0b1f33' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Ranking de Asesores */}
                <div className="col-lg-5">
                    <div className="rpt-metric-card rpt-metric-tall">
                        <p className="rpt-metric-title">Ranking de Asesores</p>
                        <p className="rpt-metric-subtitle">Ordenados por efectividad de cobro</p>
                        <div className="d-flex flex-column gap-3 mt-3">
                            {asesoresSorted.map((asesor, index) => {
                                const isTop = index === 0;
                                const barColor = index === 0 ? CHART_COLORS.gold : index === 1 ? CHART_COLORS.green : index < 3 ? CHART_COLORS.blue : 'rgba(255,255,255,0.2)';
                                return (
                                    <div key={asesor.id} className={`rpt-ranking-card ${isTop ? 'rpt-ranking-top' : ''}`}>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`rpt-ranking-pos ${isTop ? 'rpt-ranking-pos-gold' : ''}`}>
                                                {index === 0 ? (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>)
                                                    : <span>{index + 1}</span>}
                                            </div>
                                            <div className="rpt-ranking-avatar" style={{ borderColor: barColor, color: barColor, background: `${barColor}15` }}>{asesor.iniciales}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p className="rpt-ranking-name">{asesor.nombre}</p>
                                                <p className="rpt-ranking-route">{asesor.ruta}</p>
                                                <div className="rpt-ranking-bar-track mt-1">
                                                    <div className="rpt-ranking-bar-fill" style={{ width: `${asesor.efectividad}%`, background: barColor }} />
                                                </div>
                                            </div>
                                            <div className="text-end" style={{ flexShrink: 0 }}>
                                                <p className="rpt-ranking-pct" style={{ color: barColor }}>{asesor.efectividad}%</p>
                                                <p className="rpt-ranking-amount">{formatMoney(asesor.montoRecaudado)}</p>
                                            </div>
                                        </div>
                                        {isTop && (
                                            <div className="rpt-ranking-details mt-3">
                                                <div className="d-flex gap-3">
                                                    <div className="rpt-ranking-stat"><p className="rpt-ranking-stat-label">Clientes</p><p className="rpt-ranking-stat-val">{asesor.clientesCobrados}/{asesor.clientesAsignados}</p></div>
                                                    <div className="rpt-ranking-stat"><p className="rpt-ranking-stat-label">Interés</p><p className="rpt-ranking-stat-val" style={{ color: CHART_COLORS.gold }}>{formatMoney(asesor.interesRecaudado)}</p></div>
                                                    <div className="rpt-ranking-stat"><p className="rpt-ranking-stat-label">Mora</p><p className="rpt-ranking-stat-val" style={{ color: CHART_COLORS.red }}>{formatMoney(asesor.moraGenerada)}</p></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* FILA 5: Mora por asesor */}
            <div className="row g-4">
                <div className="col-12">
                    <div className="rpt-metric-card">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <p className="rpt-metric-title">Mora Generada por Asesor</p>
                                <p className="rpt-metric-subtitle">Comparativa de mora en las rutas de cada asesor</p>
                            </div>
                        </div>
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                                <BarChart data={asesorBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="nombre" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickFormatter={(v) => `Q${v}`} />
                                    <Tooltip content={({ active, payload, label }) => {
                                        if (!active || !payload) return null;
                                        const asesor = mockAsesores.find(a => a.iniciales === label);
                                        return (
                                            <div style={{ ...chartTooltipStyle.contentStyle, padding: '12px 16px' }}>
                                                <p style={{ ...chartTooltipStyle.labelStyle, margin: '0 0 6px' }}>{asesor?.nombre || label}</p>
                                                {payload.map((entry, i) => (
                                                    <p key={i} style={{ margin: '2px 0', fontSize: '11px', color: entry.color as string }}>
                                                        <span style={{ fontWeight: 700 }}>{entry.name}:</span> {formatMoney(entry.value as number)}
                                                    </p>
                                                ))}
                                            </div>
                                        );
                                    }} />
                                    <Bar dataKey="mora" name="Mora" fill={CHART_COLORS.red} radius={[6, 6, 0, 0]} barSize={36} fillOpacity={0.8}>
                                        {asesorBarData.map((entry, index) => (
                                            <Cell key={index} fill={entry.mora > 300 ? CHART_COLORS.red : entry.mora > 150 ? CHART_COLORS.orange : CHART_COLORS.green} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =====================================================================
// VISTA: CLIENTES INACTIVOS
// =====================================================================
function VistaInactivos({ data }: { data: ClienteInactivo[] }) {
    return (
        <div className="rpt-section-animate">
            <div className="rpt-section-header mb-4">
                <div className="rpt-section-icon" style={{ background: 'rgba(249,115,22,0.1)', borderColor: 'rgba(249,115,22,0.3)', color: '#f97316' }}><UserXIcon /></div>
                <div style={{ flex: 1 }}>
                    <h2 className="rpt-section-title">Clientes Inactivos</h2>
                    <p className="rpt-section-subtitle">Personas que no han renovado su crédito, contactar para seguimiento</p>
                </div>
                <span className="rpt-count-badge" style={{ background: 'rgba(249,115,22,0.12)', borderColor: 'rgba(249,115,22,0.3)', color: '#f97316' }}>{data.length}</span>
            </div>

            <div className="d-flex flex-column gap-3">
                {data.map(cl => (
                    <div key={cl.id} className="rpt-card-item rpt-card-inactive">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="rpt-card-avatar rpt-avatar-inactive">{cl.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                                <div>
                                    <p className="rpt-card-name">{cl.nombre}</p>
                                    <p className="rpt-card-sub">{cl.id} &bull; Último: {cl.ultimoPrestamo}</p>
                                </div>
                            </div>
                            <div className="d-flex gap-4 align-items-center flex-wrap">
                                <div className="text-end">
                                    <p className="rpt-card-label">Finalizó</p>
                                    <p className="rpt-card-amount">{cl.fechaFinalizacion}</p>
                                </div>
                                <div className="text-end">
                                    <p className="rpt-card-label">Días sin renovar</p>
                                    <p className="rpt-card-amount" style={{ color: cl.diasSinRenovar > 90 ? '#ef4444' : '#f59e0b' }}>{cl.diasSinRenovar}</p>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <a href={`tel:${cl.telefono}`} className="rpt-contact-btn" title="Llamar">
                                        <PhoneIcon /> {cl.telefono}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {data.length === 0 && <EmptyState text="No hay clientes inactivos." />}
            </div>
        </div>
    );
}

// =====================================================================
// EMPTY STATE
// =====================================================================
function EmptyState({ text, icon }: { text: string; icon?: React.ReactNode }) {
    return (
        <div className="rpt-empty-state">
            <div className="rpt-empty-icon">{icon || <BarChartIcon />}</div>
            <p className="rpt-empty-text">{text}</p>
        </div>
    );
}
