import "./payments.css";
import '../dashboard/dashboard.css';
import React, { useState, useMemo } from 'react';

interface ActiveLoan { id: string; type: string; total: number; balance: number; expectedQuota: number; }
interface Client {
    id: string; name: string; address: string; phone: string; status: string; priority: number;
    paidAmounts?: Record<string, number>; activeLoans: ActiveLoan[];
}

interface AdvisorCollection {
    id: string; advisorName: string; advisorInitials: string; route: string;
    amount: number; clientsVisited: number; totalClients: number;
    date: string; time: string; status: 'pending' | 'validated' | 'rejected';
}

const mockCollections: AdvisorCollection[] = [
    { id: 'RC-001', advisorName: 'Pedro Ramírez', advisorInitials: 'PR', route: 'Ruta Centro - Zona 1', amount: 4250, clientsVisited: 12, totalClients: 15, date: '01/05/2026', time: '16:45', status: 'pending' },
    { id: 'RC-002', advisorName: 'Luis Mendoza', advisorInitials: 'LM', route: 'Ruta Minerva - Zona 3', amount: 3180, clientsVisited: 9, totalClients: 11, date: '01/05/2026', time: '17:10', status: 'pending' },
    { id: 'RC-003', advisorName: 'Roberto Castillo', advisorInitials: 'RC', route: 'Ruta Democracia - Zona 3', amount: 5620, clientsVisited: 18, totalClients: 18, date: '01/05/2026', time: '15:30', status: 'pending' },
];

const mockRoute: Client[] = [
    {
        id: 'C-101', name: 'María Fernanda López', address: 'Mercado La Democracia, Local 45', phone: '5555-0101', status: 'pending', priority: 1,
        activeLoans: [{ id: 'L-5001', type: 'Préstamo Diario', total: 5000, balance: 2500, expectedQuota: 300 }, { id: 'L-5002', type: 'Mercadería', total: 2000, balance: 1800, expectedQuota: 150 }]
    },
    {
        id: 'C-102', name: 'Carlos Estuardo Morales', address: '4ta Calle, Zona 1', phone: '5555-0202', status: 'completed', priority: 3, paidAmounts: { 'L-5003': 700 },
        activeLoans: [{ id: 'L-5003', type: 'Préstamo Diario', total: 10000, balance: 8000, expectedQuota: 1000 }]
    },
    {
        id: 'C-103', name: 'Ana Gonzales', address: 'Avenida Las Américas, Zona 3', phone: '5555-0303', status: 'pending', priority: 2,
        activeLoans: [{ id: 'L-5004', type: 'Préstamo Diario', total: 3000, balance: 300, expectedQuota: 300 }]
    },
    {
        id: 'C-104', name: 'Juan Pérez', address: 'Terminal Minerva, Sector Verduras', phone: '5555-0404', status: 'pending', priority: 1,
        activeLoans: [{ id: 'L-5005', type: 'Préstamo Diario', total: 4000, balance: 3900, expectedQuota: 200 }, { id: 'L-5007', type: 'Préstamo Diario', total: 5000, balance: 5000, expectedQuota: 400 }]
    }
];

// SVG Icons
const CalendarIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>);
const WalletIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" /></svg>);
const TrendingUpIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>);
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
const MapPinIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);
const ChevronDownIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>);
const ChevronUpIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>);
const AlertCircleIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>);
const DollarIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cca641" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>);
const CheckIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>);
const CheckCircleIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>);
const BigMapPin = () => (<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);
const WarningIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
const TrendingDownIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>);
const SafeIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="12" r="3" /><line x1="12" y1="9" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="15" /><line x1="9" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="15" y2="12" /></svg>);
const ClockIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const UsersIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
const XIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const SendIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>);
const BellIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>);

export default function PaymentsPage() {
    const [activeTab, setActiveTab] = useState<'ruta' | 'recaudacion'>('ruta');
    const [clients, setClients] = useState<Client[]>(mockRoute);
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});
    const [paymentSuccessId, setPaymentSuccessId] = useState<string | null>(null);
    const [expandedMorosoId, setExpandedMorosoId] = useState<string | null>(null);
    const [collections, setCollections] = useState<AdvisorCollection[]>(mockCollections);
    const [showCajaModal, setShowCajaModal] = useState(false);
    const [cajaSentAmount, setCajaSentAmount] = useState(0);

    const pendingCollections = useMemo(() => collections.filter(c => c.status === 'pending'), [collections]);
    const validatedCollections = useMemo(() => collections.filter(c => c.status === 'validated'), [collections]);
    const totalValidated = useMemo(() => validatedCollections.reduce((s, c) => s + c.amount, 0), [validatedCollections]);

    const handleValidate = (id: string) => {
        setCollections(prev => prev.map(c => c.id === id ? { ...c, status: 'validated' as const } : c));
    };
    const handleReject = (id: string) => {
        setCollections(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' as const } : c));
    };
    const handleEnviarCaja = () => {
        setCajaSentAmount(totalValidated);
        setShowCajaModal(true);
        setCollections(prev => prev.filter(c => c.status !== 'validated'));
    };

    const filteredClients = useMemo(() => {
        return clients
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.address.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.priority - b.priority);
    }, [clients, searchTerm]);

    // Clientes morosos: pagaron menos de la cuota en al menos un préstamo
    const morosos = useMemo(() => {
        return clients.filter(c => {
            if (c.status !== 'completed' || !c.paidAmounts) return false;
            return c.activeLoans.some(loan => (c.paidAmounts![loan.id] ?? 0) < loan.expectedQuota);
        });
    }, [clients]);

    const stats = useMemo(() => {
        const total = clients.length;
        const visited = clients.filter(c => c.status === 'completed').length;
        const percentage = total === 0 ? 0 : Math.round((visited / total) * 100);
        let expectedMoney = 0, collectedMoney = 0, totalLoans = 0;
        clients.forEach(c => {
            c.activeLoans.forEach(loan => { expectedMoney += loan.expectedQuota; totalLoans++; });
            if (c.status === 'completed' && c.paidAmounts) {
                Object.values(c.paidAmounts).forEach(amount => { collectedMoney += amount; });
            }
        });
        const moneyPercentage = expectedMoney === 0 ? 0 : (collectedMoney / expectedMoney) * 100;
        return { total, visited, percentage, expectedMoney, collectedMoney, moneyPercentage, totalLoans };
    }, [clients]);

    const toggleExpandClient = (client: Client) => {
        if (expandedClientId === client.id) { setExpandedClientId(null); return; }
        setExpandedClientId(client.id);
        setPaymentSuccessId(null);
        const initial: Record<string, string> = {};
        client.activeLoans.forEach(loan => { initial[loan.id] = String(loan.expectedQuota); });
        setPaymentInputs(initial);
    };

    const handlePaymentChange = (loanId: string, rawValue: string, maxQuota: number) => {
        // Allow empty string so user can clear the field
        if (rawValue === '') { setPaymentInputs(prev => ({ ...prev, [loanId]: '' })); return; }
        const num = parseFloat(rawValue);
        if (isNaN(num) || num < 0) return;
        // Cap at max quota
        if (num > maxQuota) { setPaymentInputs(prev => ({ ...prev, [loanId]: String(maxQuota) })); return; }
        setPaymentInputs(prev => ({ ...prev, [loanId]: rawValue }));
    };

    const getNumericValue = (loanId: string): number => {
        const val = paymentInputs[loanId];
        if (val === undefined || val === '') return 0;
        return parseFloat(val) || 0;
    };

    const handleRegisterPayment = (client: Client) => {
        setPaymentSuccessId(client.id);
        setTimeout(() => {
            const numericAmounts: Record<string, number> = {};
            Object.entries(paymentInputs).forEach(([k, v]) => { numericAmounts[k] = parseFloat(v) || 0; });
            setClients(prev => prev.map(c =>
                c.id === client.id ? { ...c, status: 'completed', paidAmounts: numericAmounts } : c
            ));
            setExpandedClientId(null);
            setPaymentSuccessId(null);
        }, 1500);
    };

    const formatMoney = (amount: number) => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);

    return (
        <div className="payments-container w-100 h-100 d-flex flex-column overflow-auto custom-scrollbar">

            {/* TAB NAVIGATION */}
            <div className="px-4 px-lg-5 pt-4">
                <div className="payments-tabs">
                    <button className={`payments-tab-btn ${activeTab === 'ruta' ? 'tab-active' : ''}`} onClick={() => setActiveTab('ruta')}>
                        <MapPinIcon /> Ruta Diaria
                    </button>
                    <button className={`payments-tab-btn ${activeTab === 'recaudacion' ? 'tab-active' : ''}`} onClick={() => setActiveTab('recaudacion')}>
                        <BellIcon /> Recaudación
                        {pendingCollections.length > 0 && <span className="tab-notif-dot">{pendingCollections.length}</span>}
                    </button>
                </div>
            </div>

            {activeTab === 'ruta' && <>
            {/* HEADER */}
            <div className="payments-header p-4 p-lg-5 mb-4">
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="payments-date-badge"><CalendarIcon /> HOY, 1 DE MAYO</span>
                        </div>
                        <h1 className="payments-title">Ruta Diaria</h1>
                        <p className="payments-subtitle mt-1">Ordenada por prioridad de cobro</p>
                    </div>
                    <div className="progress-ring-container">
                        <div className="progress-ring-box">
                            <svg width="64" height="64" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round"
                                    strokeDasharray={`${stats.percentage}, 100`} style={{ transition: 'stroke-dasharray 1s ease-out', filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' }} />
                            </svg>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', zIndex: 1 }}>{stats.visited}/{stats.total}</span>
                        </div>
                        <span className="progress-ring-label">Visitas</span>
                    </div>
                </div>

                {/* DASHBOARD FINANCIERO */}
                <div className="finance-card p-4 mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-2"><WalletIcon /><span className="finance-label">Recaudación del Día</span></div>
                        <span className="loans-count-badge">{stats.totalLoans} préstamos</span>
                    </div>

                    <div className="d-flex align-items-end justify-content-between mt-2">
                        <div>
                            <p className="finance-amount-big">{formatMoney(stats.collectedMoney)}</p>
                            <p className="finance-amount-sub mt-1">recolectado de <span style={{ color: 'rgba(255,255,255,0.7)' }}>{formatMoney(stats.expectedMoney)}</span></p>
                        </div>
                        <div className="d-flex flex-column align-items-end gap-2">
                            <div className="finance-percentage"><TrendingUpIcon /> {Math.round(stats.moneyPercentage)}%</div>
                        </div>
                    </div>

                    <div className="money-progress-track mt-3"><div className="money-progress-fill" style={{ width: `${Math.min(stats.moneyPercentage, 100)}%` }} /></div>

                    {/* Botón Recaudar */}
                    <div className="d-flex justify-content-end mt-4">
                        <button className="btn-recaudar">
                            <SafeIcon /> Recaudar
                        </button>
                    </div>
                </div>

                {/* BUSCADOR */}
                <div className="payments-search-box">
                    <span className="me-2" style={{ color: 'rgba(204,166,65,0.5)', flexShrink: 0 }}><SearchIcon /></span>
                    <input type="text" placeholder="Buscar en la ruta..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* TIMELINE DE CLIENTES */}
            <div className="px-4 px-lg-5 pb-4" style={{ position: 'relative' }}>
                <div style={{ position: 'relative', paddingLeft: '36px' }}>
                    {!searchTerm && <div className="timeline-line" />}
                    <div className="d-flex flex-column gap-3">
                        {filteredClients.map((client, index) => {
                            const isExpanded = expandedClientId === client.id;
                            const isCompleted = client.status === 'completed';
                            return (
                                <div key={client.id} style={{ position: 'relative' }}>
                                    {!searchTerm && (
                                        <div className={`timeline-node ${isCompleted ? 'timeline-node-completed' : isExpanded ? 'timeline-node-active' : 'timeline-node-pending'}`}>
                                            {isCompleted ? <CheckIcon /> : (index + 1)}
                                        </div>
                                    )}
                                    <div className={`client-card ${isExpanded ? 'client-card-expanded' : ''} ${isCompleted ? 'client-card-completed' : ''}`}>
                                        <button className="client-card-header" onClick={() => toggleExpandClient(client)}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <h3 className={`client-name ${isCompleted ? 'client-name-completed' : ''}`}>{client.name}</h3>
                                                    {isCompleted && <span className="cobrado-badge">Cobrado</span>}
                                                </div>
                                                <div className="client-address">
                                                    <span style={{ color: isExpanded ? '#cca641' : undefined, flexShrink: 0 }}><MapPinIcon /></span>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.address}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex flex-column align-items-end gap-2" style={{ flexShrink: 0 }}>
                                                {!isCompleted && client.activeLoans.length > 1 && (
                                                    <span className="ctas-badge"><AlertCircleIcon /> {client.activeLoans.length} CTAS</span>
                                                )}
                                                <div className={`chevron-box ${isExpanded ? 'chevron-box-active' : 'chevron-box-default'}`}>
                                                    {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                </div>
                                            </div>
                                        </button>

                                        {isExpanded && !isCompleted && (
                                            <div className="client-detail-panel">
                                                <div className="detail-separator" />
                                                <div className="d-flex flex-column gap-3 mb-3">
                                                    {client.activeLoans.map((loan, lIndex) => (
                                                        <div key={loan.id} className="loan-detail-card">
                                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                                <div>
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <span className="loan-index-badge">{lIndex + 1}</span>
                                                                        <span className="loan-type-name">{loan.type}</span>
                                                                    </div>
                                                                    <p className="loan-balance-text" style={{ marginLeft: '32px' }}>Saldo: <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{formatMoney(loan.balance)}</span></p>
                                                                </div>
                                                                <div className="loan-quota-box">
                                                                    <p className="loan-quota-label mb-0">Cuota ideal</p>
                                                                    <p className="loan-quota-value mb-0">{formatMoney(loan.expectedQuota)}</p>
                                                                </div>
                                                            </div>
                                                            <div style={{ marginLeft: '32px' }}>
                                                                <p className="payment-input-label">Monto a recibir (Q)</p>
                                                                <div className="payment-input-box">
                                                                    <span style={{ flexShrink: 0, marginRight: '8px' }}><DollarIcon /></span>
                                                                    <input type="number" min="0" max={loan.expectedQuota} step="0.01"
                                                                        value={paymentInputs[loan.id] ?? ''}
                                                                        onChange={(e) => handlePaymentChange(loan.id, e.target.value, loan.expectedQuota)} />
                                                                </div>
                                                                {/* Advertencia si el monto es menor a la cuota */}
                                                                {paymentInputs[loan.id] !== undefined && paymentInputs[loan.id] !== '' && getNumericValue(loan.id) < loan.expectedQuota && (
                                                                    <div className="moroso-warning-inline mt-2">
                                                                        <WarningIcon />
                                                                        <span>Monto inferior a la cuota ({formatMoney(loan.expectedQuota)}). Se registrará como moroso.</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="payment-footer">
                                                    <div>
                                                        <p className="payment-total-label mb-0">Total de este cliente</p>
                                                        <p className="payment-total-amount mb-0">
                                                            {formatMoney(client.activeLoans.reduce((sum, loan) => sum + getNumericValue(loan.id), 0))}
                                                        </p>
                                                    </div>
                                                    {paymentSuccessId === client.id ? (
                                                        <div className="payment-success-box"><CheckCircleIcon /> ¡Registrado!</div>
                                                    ) : (
                                                        <button onClick={() => handleRegisterPayment(client)} className="btn-confirm-payment">Confirmar Pago</button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {isExpanded && isCompleted && (
                                            <div className="client-detail-panel">
                                                <div className="completed-message-box">
                                                    <div className="completed-icon-circle"><CheckCircleIcon /></div>
                                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, margin: 0 }}>La visita ya fue registrada con éxito.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {filteredClients.length === 0 && (
                            <div className="empty-state-box">
                                <BigMapPin />
                                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginTop: '12px' }}>Sin resultados</h3>
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>Intenta buscar con otro nombre.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ================= SECCIÓN MOROSOS ================= */}
            {morosos.length > 0 && (
                <div className="px-4 px-lg-5 pb-5">
                    <div className="moroso-section-card">
                        {/* Header de la sección */}
                        <div className="moroso-section-header">
                            <div className="moroso-icon-circle"><WarningIcon /></div>
                            <div style={{ flex: 1 }}>
                                <h2 className="moroso-section-title">Clientes Morosos</h2>
                                <p className="moroso-section-subtitle">Pagaron por debajo de la cuota establecida</p>
                            </div>
                            <span className="moroso-count-badge">{morosos.length}</span>
                        </div>

                        <div className="d-flex flex-column gap-3">
                            {morosos.map(client => {
                                const isOpen = expandedMorosoId === client.id;
                                const delinquentLoans = client.activeLoans.filter(loan => (client.paidAmounts![loan.id] ?? 0) < loan.expectedQuota);
                                const totalDiff = delinquentLoans.reduce((sum, loan) => sum + (loan.expectedQuota - (client.paidAmounts![loan.id] ?? 0)), 0);

                                return (
                                    <div key={client.id} className="moroso-card">
                                        <button className="moroso-card-header" onClick={() => setExpandedMorosoId(isOpen ? null : client.id)}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <h4 className="moroso-client-name">{client.name}</h4>
                                                    <span className="moroso-badge">MOROSO</span>
                                                </div>
                                                <p className="moroso-client-address"><MapPinIcon /> {client.address}</p>
                                            </div>
                                            <div className="d-flex align-items-center gap-3" style={{ flexShrink: 0 }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(239,68,68,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Faltante</p>
                                                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444', margin: 0 }}>{formatMoney(totalDiff)}</p>
                                                </div>
                                                <div className={`chevron-box ${isOpen ? 'chevron-box-moroso-active' : 'chevron-box-moroso'}`}>
                                                    {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                </div>
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="moroso-detail-panel">
                                                <div className="detail-separator" style={{ background: 'rgba(239,68,68,0.1)' }} />
                                                <div className="d-flex flex-column gap-3">
                                                    {delinquentLoans.map(loan => {
                                                        const paid = client.paidAmounts![loan.id] ?? 0;
                                                        const diff = loan.expectedQuota - paid;
                                                        const pctPaid = loan.expectedQuota > 0 ? Math.round((paid / loan.expectedQuota) * 100) : 0;
                                                        return (
                                                            <div key={loan.id} className="moroso-loan-card">
                                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <span className="moroso-loan-icon"><TrendingDownIcon /></span>
                                                                        <span className="loan-type-name">{loan.type}</span>
                                                                    </div>
                                                                    <span className="moroso-pct-badge">{pctPaid}% pagado</span>
                                                                </div>
                                                                <div className="row g-2 mb-3">
                                                                    <div className="col-4">
                                                                        <p className="moroso-detail-label">Cuota Esperada</p>
                                                                        <p className="moroso-detail-value">{formatMoney(loan.expectedQuota)}</p>
                                                                    </div>
                                                                    <div className="col-4">
                                                                        <p className="moroso-detail-label">Monto Pagado</p>
                                                                        <p className="moroso-detail-value" style={{ color: '#f59e0b' }}>{formatMoney(paid)}</p>
                                                                    </div>
                                                                    <div className="col-4">
                                                                        <p className="moroso-detail-label">Diferencia</p>
                                                                        <p className="moroso-detail-value" style={{ color: '#ef4444' }}>-{formatMoney(diff)}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="moroso-progress-track">
                                                                    <div className="moroso-progress-fill" style={{ width: `${pctPaid}%` }} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            </>}

            {/* ================= RECAUDACIÓN TAB ================= */}
            {activeTab === 'recaudacion' && (
                <div className="recaudacion-container px-4 px-lg-5 py-4">
                    {/* Header con total validado */}
                    <div className="recaudacion-header-card mb-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="d-flex align-items-center gap-2"><SafeIcon /><span className="finance-label">Validación de Recaudación</span></div>
                            <span className="payments-date-badge"><CalendarIcon /> HOY, 1 DE MAYO</span>
                        </div>
                        <div className="d-flex align-items-end justify-content-between">
                            <div>
                                <p className="recaudacion-total-label">Total Validado</p>
                                <p className="recaudacion-total-amount">{formatMoney(totalValidated)}</p>
                                <p className="recaudacion-sub">{validatedCollections.length} asesor(es) validado(s) &bull; {pendingCollections.length} pendiente(s)</p>
                            </div>
                            <button className="btn-enviar-caja" disabled={validatedCollections.length === 0} onClick={handleEnviarCaja}>
                                <SendIcon /> Enviar a Caja
                            </button>
                        </div>
                        <div className="money-progress-track mt-3">
                            <div className="money-progress-fill" style={{ width: `${collections.length === 0 ? 0 : (validatedCollections.length / collections.length) * 100}%`, background: 'linear-gradient(135deg, #10b981, #34d399)' }} />
                        </div>
                    </div>

                    {/* Notificaciones pendientes */}
                    {pendingCollections.length > 0 && (
                        <div className="mb-4">
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Pendientes de Validación</h3>
                            <div className="d-flex flex-column gap-3">
                                {pendingCollections.map(col => (
                                    <div key={col.id} className="recaudacion-notif-card">
                                        <div className="notif-card-top">
                                            <div className="d-flex align-items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                                                <div className="notif-advisor-avatar">{col.advisorInitials}</div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p className="notif-advisor-name">{col.advisorName}</p>
                                                    <p className="notif-advisor-route"><MapPinIcon /> {col.route}</p>
                                                </div>
                                            </div>
                                            <div className="notif-amount-box">
                                                <p className="notif-amount-label">Monto</p>
                                                <p className="notif-amount-value">{formatMoney(col.amount)}</p>
                                            </div>
                                        </div>
                                        <div className="notif-details-strip">
                                            <div className="notif-detail-item"><p className="notif-detail-key">Fecha</p><p className="notif-detail-val">{col.date}</p></div>
                                            <div className="notif-detail-item"><p className="notif-detail-key">Hora</p><p className="notif-detail-val">{col.time}</p></div>
                                            <div className="notif-detail-item"><p className="notif-detail-key">Clientes</p><p className="notif-detail-val">{col.clientsVisited}/{col.totalClients}</p></div>
                                            <div className="notif-detail-item"><p className="notif-detail-key">ID</p><p className="notif-detail-val">{col.id}</p></div>
                                        </div>
                                        <div className="notif-actions">
                                            <button className="btn-validar" onClick={() => handleValidate(col.id)}><CheckCircleIcon /> Validar Entrega</button>
                                            <button className="btn-rechazar" onClick={() => handleReject(col.id)}><XIcon /> Rechazar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Asesores validados */}
                    {validatedCollections.length > 0 && (
                        <div className="mb-4">
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Validados</h3>
                            <div className="d-flex flex-column gap-2">
                                {validatedCollections.map(col => (
                                    <div key={col.id} className="validated-advisor-row">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="notif-advisor-avatar" style={{ width: 36, height: 36, fontSize: 12, borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>{col.advisorInitials}</div>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>{col.advisorName}</p>
                                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{col.route} &bull; {col.time}</p>
                                            </div>
                                        </div>
                                        <span className="validated-amount">{formatMoney(col.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {pendingCollections.length === 0 && validatedCollections.length === 0 && (
                        <div className="recaudacion-empty">
                            <SafeIcon />
                            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '16px', marginTop: '12px' }}>Sin recaudaciones</h3>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>No hay entregas pendientes por validar.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Caja */}
            {showCajaModal && (
                <div className="caja-overlay" onClick={() => setShowCajaModal(false)}>
                    <div className="caja-modal" onClick={e => e.stopPropagation()}>
                        <div className="caja-icon-circle"><CheckCircleIcon /></div>
                        <h2 className="caja-title">¡Enviado a Caja!</h2>
                        <p className="caja-subtitle">La recaudación ha sido registrada exitosamente</p>
                        <p className="caja-amount">{formatMoney(cajaSentAmount)}</p>
                        <button className="btn-cerrar-modal" onClick={() => setShowCajaModal(false)}>Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
