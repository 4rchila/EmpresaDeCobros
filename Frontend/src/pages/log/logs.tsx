import "./log.css";
import '../dashboard/dashboard.css';
import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, authHeaders } from '../../lib';

// SVG Icons
const ClockIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
const CalendarIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>);
const ChevronDownIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>);
const ChevronUpIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>);
const FilterIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>);
const RefreshIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>);

// Tipos de movimiento y sus íconos/colores
type LogCategory = 'ingreso' | 'egreso' | 'prestamo' | 'pago' | 'cliente' | 'asesor' | 'garantia' | 'caja' | 'sistema' | 'mora';

interface CategoryConfig {
    label: string;
    color: string;
    bgAlpha: string;
    icon: React.ReactNode;
}

const categoryConfig: Record<LogCategory, CategoryConfig> = {
    ingreso: {
        label: 'Ingreso', color: '#10b981', bgAlpha: 'rgba(16,185,129,',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>,
    },
    egreso: {
        label: 'Egreso', color: '#ef4444', bgAlpha: 'rgba(239,68,68,',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>,
    },
    prestamo: {
        label: 'Préstamo', color: '#cca641', bgAlpha: 'rgba(204,166,65,',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
    },
    pago: {
        label: 'Pago', color: '#3b82f6', bgAlpha: 'rgba(59,130,246,',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    },
    cliente: {
        label: 'Cliente', color: '#8b5cf6', bgAlpha: 'rgba(139,92,246,',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>,
    },
    asesor: {
        label: 'Asesor', color: '#f97316', bgAlpha: 'rgba(249,115,22,',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    },
    garantia: {
        label: 'Garantía', color: '#f59e0b', bgAlpha: 'rgba(245,158,11,',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    },
    caja: {
        label: 'Caja Fuerte', color: '#14b8a6', bgAlpha: 'rgba(20,184,166,',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="12" r="3" /><line x1="12" y1="9" x2="12" y2="3" /></svg>,
    },
    sistema: {
        label: 'Sistema', color: '#6b7280', bgAlpha: 'rgba(107,114,128,',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
    },
    mora: {
        label: 'Mora', color: '#ef4444', bgAlpha: 'rgba(239,68,68,',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    },
};

interface LogEntry {
    id: string;
    fecha: string;
    hora: string;
    categoria: LogCategory;
    titulo: string;
    descripcion: string;
    usuario: string;
    monto?: number;
    detalles: { campo: string; valor: string }[];
}

// mockLogs removed to use real data

const INITIAL_VISIBLE = 8;

const formatMoney = (amount: number) => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);

const allCategories: LogCategory[] = ['ingreso', 'egreso', 'prestamo', 'pago', 'cliente', 'asesor', 'garantia', 'caja', 'sistema', 'mora'];

export default function LogsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<Set<LogCategory>>(new Set());
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/logs/`, { headers: authHeaders() });
            setLogs(res.data);
        } catch (error) {
            console.error("Error fetching logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const toggleCategory = (cat: LogCategory) => {
        setSelectedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat); else next.add(cat);
            return next;
        });
    };

    const clearFilters = () => {
        setSelectedCategories(new Set());
        setSearchTerm('');
    };

    const filteredLogs = useMemo(() => {
        let result = logs;
        if (selectedCategories.size > 0) {
            result = result.filter(l => selectedCategories.has(l.categoria));
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(l =>
                l.titulo.toLowerCase().includes(term) ||
                l.descripcion.toLowerCase().includes(term) ||
                (l.usuario && l.usuario.toLowerCase().includes(term)) ||
                l.id.toLowerCase().includes(term)
            );
        }
        return result;
    }, [searchTerm, selectedCategories, logs]);

    const visibleLogs = showAll ? filteredLogs : filteredLogs.slice(0, INITIAL_VISIBLE);
    const hasMore = filteredLogs.length > INITIAL_VISIBLE;

    const stats = useMemo(() => {
        const todayStr = new Date().toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const todayLogs = logs.filter(l => l.fecha === todayStr);
        const ingresos = todayLogs.filter(l => l.categoria === 'ingreso' || l.categoria === 'pago').reduce((s, l) => s + (l.monto || 0), 0);
        const egresos = todayLogs.filter(l => l.categoria === 'egreso').reduce((s, l) => s + (l.monto || 0), 0);
        return { total: logs.length, hoy: todayLogs.length, ingresos, egresos };
    }, [logs]);

    const groupedByDate = useMemo(() => {
        const groups: { fecha: string; logs: LogEntry[] }[] = [];
        const map = new Map<string, LogEntry[]>();
        visibleLogs.forEach(log => {
            if (!map.has(log.fecha)) map.set(log.fecha, []);
            map.get(log.fecha)!.push(log);
        });
        map.forEach((logs, fecha) => groups.push({ fecha, logs }));
        return groups;
    }, [visibleLogs]);

    return (
        <div className="log-container w-100 h-100 d-flex flex-column overflow-auto custom-scrollbar">

            {/* HEADER */}
            <div className="log-header p-4 p-lg-5">
                <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="log-badge-top"><CalendarIcon /> BITÁCORA DEL SISTEMA</span>
                        </div>
                        <h1 className="log-title">Registro de Movimientos</h1>
                        <p className="log-subtitle mt-1">Historial completo de todas las operaciones del sistema</p>
                    </div>
                    <button className="log-action-btn" onClick={() => {setShowAll(false); setExpandedLogId(null);}}><RefreshIcon /> Actualizar</button>
                </div>

                {/* KPI Resumen */}
                <div className="log-kpi-row">
                    <div className="log-kpi-card">
                        <div className="log-kpi-icon" style={{ background: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)', color: '#3b82f6' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                        </div>
                        <div>
                            <p className="log-kpi-label">Total Registros</p>
                            <p className="log-kpi-value">{stats.total}</p>
                        </div>
                    </div>
                    <div className="log-kpi-card">
                        <div className="log-kpi-icon" style={{ background: 'rgba(204,166,65,0.12)', borderColor: 'rgba(204,166,65,0.3)', color: '#cca641' }}><ClockIcon /></div>
                        <div>
                            <p className="log-kpi-label">Movimientos Hoy</p>
                            <p className="log-kpi-value" style={{ color: '#cca641' }}>{stats.hoy}</p>
                        </div>
                    </div>
                    <div className="log-kpi-card">
                        <div className="log-kpi-icon" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
                        </div>
                        <div>
                            <p className="log-kpi-label">Ingresos Hoy</p>
                            <p className="log-kpi-value" style={{ color: '#10b981' }}>{formatMoney(stats.ingresos)}</p>
                        </div>
                    </div>
                    <div className="log-kpi-card">
                        <div className="log-kpi-icon" style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
                        </div>
                        <div>
                            <p className="log-kpi-label">Egresos Hoy</p>
                            <p className="log-kpi-value" style={{ color: '#ef4444' }}>{formatMoney(stats.egresos)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* BUSCADOR + FILTROS */}
            <div className="px-4 px-lg-5 mb-4">
                <div className="d-flex gap-3 flex-wrap">
                    <div className="log-search-box flex-fill">
                        <span style={{ color: 'rgba(204,166,65,0.5)', flexShrink: 0 }}><SearchIcon /></span>
                        <input type="text" placeholder="Buscar por título, descripción, usuario o ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button className={`log-filter-btn ${showFilters ? 'log-filter-btn-active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                        <FilterIcon /> Filtros
                        {selectedCategories.size > 0 && <span className="log-filter-count">{selectedCategories.size}</span>}
                    </button>
                </div>

                {/* Panel de filtros */}
                {showFilters && (
                    <div className="log-filters-panel mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <p className="log-filters-title">Filtrar por tipo de movimiento</p>
                            {selectedCategories.size > 0 && (
                                <button className="log-clear-btn" onClick={clearFilters}>Limpiar filtros</button>
                            )}
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                            {allCategories.map(cat => {
                                const cfg = categoryConfig[cat];
                                const isActive = selectedCategories.has(cat);
                                return (
                                    <button key={cat}
                                        className={`log-cat-chip ${isActive ? 'log-cat-chip-active' : ''}`}
                                        style={isActive ? { background: `${cfg.bgAlpha}0.15)`, borderColor: `${cfg.bgAlpha}0.4)`, color: cfg.color } : {}}
                                        onClick={() => toggleCategory(cat)}
                                    >
                                        {cfg.icon} {cfg.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* TIMELINE DE MOVIMIENTOS */}
            <div className="px-4 px-lg-5 pb-5 flex-fill">
                {loading ? (
                    <div className="text-center p-5"><div className="spinner-border text-gold"></div><p className="mt-2 text-gold">Cargando bitácora...</p></div>
                ) : groupedByDate.map(group => (
                    <div key={group.fecha} className="mb-4">
                        {/* Date header */}
                        <div className="log-date-header">
                            <CalendarIcon />
                            <span>{group.fecha === '10/05/2026' ? 'Hoy, 10 de Mayo 2026' : group.fecha === '09/05/2026' ? 'Ayer, 9 de Mayo 2026' : group.fecha}</span>
                            <span className="log-date-count">{group.logs.length} movimientos</span>
                        </div>

                        {/* Log entries */}
                        <div className="log-timeline">
                            {group.logs.map(log => {
                                const cfg = categoryConfig[log.categoria];
                                const isExpanded = expandedLogId === log.id;
                                return (
                                    <div key={log.id} className="log-entry-wrapper">
                                        <div className="log-timeline-dot" style={{ background: `${cfg.bgAlpha}0.2)`, borderColor: `${cfg.bgAlpha}0.5)`, color: cfg.color }}>
                                            {cfg.icon}
                                        </div>
                                        <div className="log-timeline-connector" />

                                        <div className={`log-entry-card ${isExpanded ? 'log-entry-expanded' : ''}`}>
                                            <button className="log-entry-header" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                                                <div className="d-flex align-items-start gap-3" style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="log-entry-cat-badge" style={{ background: `${cfg.bgAlpha}0.12)`, borderColor: `${cfg.bgAlpha}0.3)`, color: cfg.color }}>
                                                        {cfg.label}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p className="log-entry-title">{log.titulo}</p>
                                                        <p className="log-entry-desc">{log.descripcion}</p>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center gap-3" style={{ flexShrink: 0 }}>
                                                    {log.monto !== undefined && (
                                                        <span className="log-entry-monto" style={{ color: log.categoria === 'egreso' ? '#ef4444' : log.categoria === 'mora' ? '#ef4444' : '#10b981' }}>
                                                            {log.categoria === 'egreso' ? '-' : '+'}{formatMoney(log.monto)}
                                                        </span>
                                                    )}
                                                    <span className="log-entry-time"><ClockIcon /> {log.hora}</span>
                                                    <div className={`log-entry-chevron ${isExpanded ? 'log-chevron-active' : ''}`}>
                                                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                    </div>
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="log-entry-detail">
                                                    <div className="log-detail-separator" />
                                                    <div className="log-detail-grid">
                                                        {log.detalles.map((det, i) => (
                                                            <div key={i} className="log-detail-item">
                                                                <p className="log-detail-key">{det.campo}</p>
                                                                <p className="log-detail-val">{det.valor}</p>
                                                            </div>
                                                        ))}
                                                        <div className="log-detail-item">
                                                            <p className="log-detail-key">Registrado por</p>
                                                            <p className="log-detail-val">{log.usuario}</p>
                                                        </div>
                                                        <div className="log-detail-item">
                                                            <p className="log-detail-key">ID Registro</p>
                                                            <p className="log-detail-val" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{log.id}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Mostrar más / menos */}
                {hasMore && (
                    <div className="d-flex justify-content-center mt-2 mb-4">
                        <button className="log-show-more-btn" onClick={() => setShowAll(!showAll)}>
                            {showAll ? (
                                <><ChevronUpIcon /> Mostrar menos</>
                            ) : (
                                <><ChevronDownIcon /> Mostrar todos los movimientos ({filteredLogs.length - INITIAL_VISIBLE} más)</>
                            )}
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {filteredLogs.length === 0 && (
                    <div className="log-empty-state">
                        <div className="log-empty-icon"><SearchIcon /></div>
                        <h3 className="log-empty-title">Sin resultados</h3>
                        <p className="log-empty-text">No se encontraron movimientos con los filtros aplicados.</p>
                        <button className="log-clear-btn mt-3" onClick={clearFilters}>Limpiar filtros</button>
                    </div>
                )}
            </div>
        </div>
    );
}
