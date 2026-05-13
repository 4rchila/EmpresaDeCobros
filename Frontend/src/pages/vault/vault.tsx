import "./vault.css";
import '../dashboard/dashboard.css';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL, authHeaders } from '../../lib';

interface LoanInfo {
    clientName: string;
    clientDPI: string;
    loanType: string;
    requestedAmount: number;
    interestRate: number;
    term: string;
    guarantee: string;
    guaranteeValue: number;
    advisor: string;
}

interface PendingDisbursement {
    id: string;
    loanInfo: LoanInfo;
    requestDate: string;
    status: 'pendiente' | 'aprobado';
    notes: string;
}

interface Transaction {
    id: string;
    type: 'ingreso' | 'egreso';
    amount: number;
    date: string;
    description: string;
    category: string;
}

// SVG Icons
const ShieldIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
const DollarIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>);
const TrendingDownIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>);
const TrendingUpIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>);
const CalendarIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>);
const FileTextIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>);
const PlusCircleIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>);
const AlertCircleIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>);
const TagIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>);
const LockIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>);
const CloseIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const ChevronRightIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>);
const ChevronDownIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>);
const ClockIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const BellIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>);
const UserIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const CheckCircleIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>);
const CreditCardIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>);

const categories = [
    'Mantenimiento', 'Pago de Alquiler', 'Servicios Básicos',
    'Planilla / Salarios', 'Compra de Insumos', 'Otros Gastos Operativos'
];

const initialTransactions: Transaction[] = [];

const PREVIEW_COUNT = 6;

const initialDisbursements: PendingDisbursement[] = [];

/** Get Monday-based week start for a given date */
function getWeekStart(dateStr: string): Date {
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function getWeekEnd(weekStart: Date): Date {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
}

function formatWeekRange(weekStart: Date): string {
    const weekEnd = getWeekEnd(weekStart);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const yearOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${weekStart.toLocaleDateString('es-ES', opts)} — ${weekEnd.toLocaleDateString('es-ES', yearOpts)}`;
}

interface WeekGroup {
    weekKey: string;
    weekStart: Date;
    label: string;
    transactions: Transaction[];
    totalIngresos: number;
    totalEgresos: number;
    netAmount: number;
}

function groupByWeek(txs: Transaction[]): WeekGroup[] {
    const sorted = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const groups = new Map<string, WeekGroup>();
    for (const tx of sorted) {
        const ws = getWeekStart(tx.date);
        const key = ws.toISOString();
        if (!groups.has(key)) {
            groups.set(key, {
                weekKey: key, weekStart: ws, label: formatWeekRange(ws),
                transactions: [], totalIngresos: 0, totalEgresos: 0, netAmount: 0,
            });
        }
        const g = groups.get(key)!;
        g.transactions.push(tx);
        if (tx.type === 'ingreso') g.totalIngresos += tx.amount;
        else g.totalEgresos += tx.amount;
        g.netAmount = g.totalIngresos - g.totalEgresos;
    }
    return Array.from(groups.values());
}

export default function VaultPage() {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('');
    const [expenseDescription, setExpenseDescription] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showFullHistory, setShowFullHistory] = useState(false);
    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
    const [disbursements, setDisbursements] = useState<PendingDisbursement[]>(initialDisbursements);
    const [selectedDisbursement, setSelectedDisbursement] = useState<PendingDisbursement | null>(null);

    const [currentBalance, setCurrentBalance] = useState<number>(0);

    interface ApiTx {
        id: string;
        type: 'ingreso' | 'egreso';
        amount: string;
        date: string;
        description: string;
        category: string;
    }

    interface ApiPendingLoan {
        id: string | number;
        cliente_nombre: string;
        cliente_dpi: string;
        monto_solicitado: string;
        interes: string;
        numero_cuotas: string;
        periodicidad: string;
        fecha_aprobacion?: string;
        fecha_solicitud?: string;
        destino_uso?: string;
    }

    const fetchCajaData = useCallback(async () => {
        try {
            const headers = authHeaders();
            const cajaRes = await axios.get(`${API_BASE_URL}/vault/caja/`, { headers });
            setCurrentBalance(parseFloat(cajaRes.data.saldo_actual) || 0);

            const movsRes = await axios.get(`${API_BASE_URL}/vault/caja/movimientos/`, { headers });
            setTransactions(movsRes.data.map((tx: ApiTx) => ({ ...tx, amount: parseFloat(tx.amount) })));

            const pendingRes = await axios.get(`${API_BASE_URL}/loans/pending-disbursement/`, { headers });
            const formatted = pendingRes.data.map((loan: ApiPendingLoan) => ({
                id: String(loan.id),
                loanInfo: {
                    clientName: loan.cliente_nombre,
                    clientDPI: loan.cliente_dpi,
                    loanType: 'Préstamo',
                    requestedAmount: parseFloat(loan.monto_solicitado),
                    interestRate: parseFloat(loan.interes),
                    term: loan.numero_cuotas ? `${loan.numero_cuotas} ${loan.periodicidad}` : 'N/A',
                    guarantee: 'Ver detalle de préstamo',
                    guaranteeValue: 0,
                    advisor: 'Asesor'
                },
                requestDate: loan.fecha_aprobacion || loan.fecha_solicitud || new Date().toISOString(),
                status: 'pendiente',
                notes: loan.destino_uso || ''
            }));
            setDisbursements(formatted);
        } catch (err) {
            console.error("Error fetching vault data", err);
        }
    }, []);

    useEffect(() => {
        // perform the fetch asynchronously so any setState calls happen after
        // the effect body and don't trigger synchronous cascading renders
        (async () => {
            try {
                await fetchCajaData();
            } catch (err) {
                console.error('Error loading vault data', err);
            }
        })();
    }, [fetchCajaData]);

    const pendingCount = useMemo(() => disbursements.filter(d => d.status === 'pendiente').length, [disbursements]);

    const handleApproveDisbursement = async (id: string) => {
        const disb = disbursements.find(d => d.id === id);
        if (!disb || disb.status === 'aprobado') return;

        try {
            await axios.post(`${API_BASE_URL}/loans/${id}/disburse/`, {}, { headers: authHeaders() });
            await fetchCajaData(); // Refresh everything

            if (selectedDisbursement?.id === id) {
                setSelectedDisbursement(prev => prev ? { ...prev, status: 'aprobado' } : null);
            }

            setSuccessMsg(`Desembolso de ${formatMoney(disb.loanInfo.requestedAmount)} aprobado para ${disb.loanInfo.clientName}`);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail || "Error al aprobar el desembolso");
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(String(err) || "Error al aprobar el desembolso");
            }
            setTimeout(() => setError(''), 3000);
        }
    };

    const toggleWeek = (weekKey: string) => {
        setExpandedWeeks(prev => {
            const next = new Set(prev);
            if (next.has(weekKey)) next.delete(weekKey);
            else next.add(weekKey);
            return next;
        });
    };

    const expandAllWeeks = () => {
        setExpandedWeeks(new Set(weekGroups.map(w => w.weekKey)));
    };

    const collapseAllWeeks = () => {
        setExpandedWeeks(new Set());
    };

    const sortedTransactions = transactions.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const previewTransactions = sortedTransactions.slice(0, PREVIEW_COUNT);
    const weekGroups = groupByWeek(transactions);

    const formatMoney = (amount: number) => new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount);

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
        return {
            date: d.toLocaleDateString('es-ES', dateOpts),
            time: d.toLocaleTimeString('es-ES', timeOpts)
        };
    };

    const formatDayName = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('es-ES', { weekday: 'long' });
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const amount = parseFloat(expenseAmount);
        if (isNaN(amount) || amount <= 0) { setError('Ingrese un monto válido mayor a 0.'); return; }
        if (!expenseCategory) { setError('Seleccione una categoría para el egreso.'); return; }
        if (!expenseDescription.trim()) { setError('Detalle la justificación del egreso.'); return; }
        if (amount > currentBalance) { setError('Fondos insuficientes en la bóveda.'); return; }

        try {
            await axios.post(`${API_BASE_URL}/vault/caja/egreso/`, {
                monto: amount,
                tipo_egreso: expenseCategory,
                descripcion: expenseDescription.trim()
            }, { headers: authHeaders() });

            await fetchCajaData(); // Refresh balance and movs
            setExpenseAmount(''); setExpenseCategory(''); setExpenseDescription('');
            setSuccessMsg('Egreso registrado exitosamente');
            setTimeout(() => setSuccessMsg(''), 2500);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || 'Error al registrar el egreso');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(String(err) || 'Error al registrar el egreso');
            }
        }
    };

    const renderTxRow = (tx: Transaction, detailed?: boolean) => {
        const { date, time } = formatDate(tx.date);
        return (
            <div key={tx.id} className={`vault-tx-row ${detailed ? 'vault-tx-row-detailed' : ''}`}>
                <div className={`vault-tx-type-icon ${tx.type === 'ingreso' ? 'tx-ingreso' : 'tx-egreso'}`}>
                    {tx.type === 'ingreso' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                </div>
                <div className="vault-tx-info">
                    <span className={`vault-tx-type-badge ${tx.type === 'ingreso' ? 'badge-ingreso' : 'badge-egreso'}`}>
                        {tx.type === 'ingreso' ? <><TrendingUpIcon /> Ingreso</> : <><TrendingDownIcon /> Egreso</>}
                    </span>
                    <span className="vault-tx-category-badge">{tx.category}</span>
                    <p className="vault-tx-description">{tx.description}</p>
                    {detailed && (
                        <div className="vault-tx-day-label">
                            <ClockIcon />
                            <span style={{ textTransform: 'capitalize' }}>{formatDayName(tx.date)}</span>
                        </div>
                    )}
                </div>
                <div className="vault-tx-date">
                    <div>{date}</div>
                    <div className="vault-tx-date-sub">{time}</div>
                </div>
                <div className={`vault-tx-amount ${tx.type === 'ingreso' ? 'amount-ingreso' : 'amount-egreso'}`}>
                    {tx.type === 'ingreso' ? '+' : '-'} {formatMoney(tx.amount)}
                </div>
            </div>
        );
    };

    return (
        <div className="vault-container w-100 h-100 d-flex flex-column overflow-auto custom-scrollbar">

            {/* HEADER */}
            <div className="vault-header p-4 p-lg-5 mb-4">
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="vault-secure-badge"><span className="vault-secure-dot" /> <LockIcon /> Conexión Segura</span>
                        </div>
                        <h1 className="vault-title">CAJA FUERTE</h1>
                        <p className="vault-subtitle mt-1">Sistema de Control de Efectivo</p>
                    </div>
                    <div className="vault-status-box">
                        <div className="vault-status-icon"><ShieldIcon /></div>
                        <div>
                            <p className="vault-status-label">Estado Físico</p>
                            <p className="vault-status-text"><span className="vault-secure-dot" /> Caja Cerrada y Asegurada</p>
                        </div>
                    </div>
                </div>

                {/* BALANCE */}
                <div className="vault-balance-card p-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <DollarIcon />
                        <span className="vault-balance-label">Efectivo Disponible en Bóveda</span>
                    </div>
                    <p className="vault-balance-amount">{formatMoney(currentBalance)}</p>
                </div>
            </div>

            {/* ============ DESEMBOLSOS PENDIENTES ============ */}
            <div className="vault-disbursements-section px-4 px-lg-5 mb-4">
                <div className="vault-disb-card">
                    <div className="vault-disb-header">
                        <div className="d-flex align-items-center gap-3">
                            <div className="vault-disb-icon-box">
                                <BellIcon />
                                {pendingCount > 0 && <span className="vault-disb-badge-dot" />}
                            </div>
                            <div>
                                <h3 className="vault-disb-title">Desembolsos Pendientes</h3>
                                <p className="vault-disb-subtitle">Solicitudes de préstamos por aprobar</p>
                            </div>
                        </div>
                        {pendingCount > 0 && (
                            <span className="vault-disb-pending-badge">
                                <span className="vault-secure-dot" style={{ background: '#f59e0b' }} />
                                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div className="vault-disb-list">
                        {disbursements.length === 0 ? (
                            <div className="vault-empty-state" style={{ padding: '30px 20px' }}>
                                <CheckCircleIcon />
                                <p style={{ fontSize: 13, marginTop: 8 }}>No hay desembolsos pendientes</p>
                            </div>
                        ) : (
                            disbursements.map(disb => {
                                const { date, time } = formatDate(disb.requestDate);
                                const isApproved = disb.status === 'aprobado';
                                return (
                                    <div key={disb.id} className={`vault-disb-row ${isApproved ? 'disb-approved' : 'disb-pending'}`}>
                                        <div className="vault-disb-row-clickable" onClick={() => setSelectedDisbursement(disb)}>
                                            <div className={`vault-disb-status-icon ${isApproved ? 'status-approved' : 'status-pending'}`}>
                                                {isApproved ? <CheckCircleIcon /> : <ClockIcon />}
                                            </div>
                                            <div className="vault-disb-row-info">
                                                <div className="d-flex align-items-center gap-2 mb-1">
                                                    <span className={`vault-disb-status-badge ${isApproved ? 'badge-approved' : 'badge-pending'}`}>
                                                        {isApproved ? 'Aprobado' : 'Pendiente'}
                                                    </span>
                                                    <span className="vault-tx-category-badge">{disb.loanInfo.loanType}</span>
                                                </div>
                                                <p className="vault-disb-client-name">
                                                    <UserIcon /> {disb.loanInfo.clientName}
                                                </p>
                                                <p className="vault-disb-detail-hint">Click para ver detalles del préstamo</p>
                                            </div>
                                            <div className="vault-tx-date">
                                                <div>{date}</div>
                                                <div className="vault-tx-date-sub">{time}</div>
                                            </div>
                                            <div className="vault-disb-amount">
                                                {formatMoney(disb.loanInfo.requestedAmount)}
                                            </div>
                                        </div>
                                        {!isApproved && (
                                            <button className="btn-approve-disb" onClick={(e) => { e.stopPropagation(); handleApproveDisbursement(disb.id); }}>
                                                <CheckCircleIcon /> Aprobar
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* GRID: FORM + HISTORIAL */}
            <div className="vault-grid px-4 px-lg-5 pb-5">

                {/* FORMULARIO DE EGRESOS */}
                <div>
                    <div className="vault-form-card">
                        <div className="vault-form-header">
                            <div className="vault-form-icon"><TrendingDownIcon /></div>
                            <h3 className="vault-form-title">Autorizar Egreso</h3>
                        </div>

                        <form onSubmit={handleAddExpense} className="d-flex flex-column gap-3">
                            {error && (
                                <div className="vault-error-box">
                                    <AlertCircleIcon />
                                    <span>{error}</span>
                                </div>
                            )}
                            {successMsg && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                                    <ShieldIcon />
                                    <span>{successMsg}</span>
                                </div>
                            )}

                            <div>
                                <label className="vault-field-label">Monto del Retiro</label>
                                <div className="vault-input-box">
                                    <span className="vault-input-icon" style={{ fontSize: 18, fontWeight: 800 }}>Q</span>
                                    <input type="number" step="0.01" min="0" className="vault-amount-input"
                                        value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} placeholder="0.00" />
                                </div>
                            </div>

                            <div>
                                <label className="vault-field-label">Categoría del Gasto</label>
                                <div className="vault-input-box">
                                    <span className="vault-input-icon"><TagIcon /></span>
                                    <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)}>
                                        <option value="">Seleccione una categoría...</option>
                                        {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>


                            <div>
                                <label className="vault-field-label">Justificación Detallada</label>
                                <div className="vault-input-box" style={{ alignItems: 'flex-start' }}>
                                    <span className="vault-input-icon" style={{ marginTop: 2 }}><FileTextIcon /></span>
                                    <textarea rows={3} value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)}
                                        placeholder="Motivo detallado del retiro..." />
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, marginTop: 8 }}>
                                <button type="submit" className="btn-confirm-expense">
                                    <PlusCircleIcon /> Confirmar Retiro de Efectivo
                                </button>
                                <p className="vault-form-note">* Los ingresos solo pueden ser registrados por el sistema central de depósitos. Esta terminal es exclusiva para egresos.</p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* HISTORIAL DE MOVIMIENTOS - PREVIEW */}
                <div>
                    <div className="vault-history-card">
                        <div className="vault-history-header">
                            <div className="d-flex align-items-center gap-3">
                                <div className="vault-history-icon"><CalendarIcon /></div>
                                <h3 className="vault-history-title">Registro de Movimientos</h3>
                            </div>
                            <span className="vault-tx-count-badge">{transactions.length} transacciones</span>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {previewTransactions.map(tx => renderTxRow(tx))}
                            {transactions.length === 0 && (
                                <div className="vault-empty-state">
                                    <ShieldIcon />
                                    <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginTop: 12 }}>Sin movimientos</h3>
                                    <p style={{ fontSize: 13 }}>No hay transacciones registradas en la bóveda.</p>
                                </div>
                            )}
                        </div>

                        {/* Botón Ver Historial Completo */}
                        {transactions.length > PREVIEW_COUNT && (
                            <div className="vault-history-footer">
                                <button className="btn-view-full-history" onClick={() => setShowFullHistory(true)}>
                                    <CalendarIcon />
                                    <span>Ver Historial Completo</span>
                                    <span className="vault-history-footer-count">{transactions.length - PREVIEW_COUNT} más</span>
                                    <ChevronRightIcon />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============ OVERLAY HISTORIAL COMPLETO POR SEMANAS ============ */}
            {showFullHistory && (
                <div 
                    className="vault-fullhistory-overlay" 
                    onClick={() => setShowFullHistory(false)}
                    style={{ 
                        position: 'fixed', 
                        top: 0, 
                        left: 0, 
                        width: '100vw', 
                        height: '100vh', 
                        zIndex: 2147483647,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(11, 20, 33, 0.95)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <div className="vault-fullhistory-panel" onClick={e => e.stopPropagation()}>

                        {/* Panel Header */}
                        <div className="vault-fullhistory-header">
                            <div className="d-flex align-items-center gap-3">
                                <div className="vault-history-icon"><CalendarIcon /></div>
                                <div>
                                    <h2 className="vault-fullhistory-title">Historial Completo</h2>
                                    <p className="vault-fullhistory-subtitle">Movimientos agrupados por semana</p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <span className="vault-tx-count-badge">{transactions.length} transacciones</span>
                                <button className="vault-fullhistory-close" onClick={() => setShowFullHistory(false)}>
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        {/* Toggle all */}
                        <div className="vault-fullhistory-actions">
                            <button className="btn-toggle-all" onClick={expandAllWeeks}>
                                <ChevronDownIcon /> Expandir Todo
                            </button>
                            <button className="btn-toggle-all" onClick={collapseAllWeeks}>
                                <ChevronRightIcon /> Colapsar Todo
                            </button>
                        </div>

                        {/* Weeks List */}
                        <div className="vault-fullhistory-body custom-scrollbar">
                            {weekGroups.map((week) => {
                                const isExpanded = expandedWeeks.has(week.weekKey);
                                return (
                                    <div key={week.weekKey} className={`vault-week-group ${isExpanded ? 'week-expanded' : ''}`}>
                                        {/* Week header - clickable */}
                                        <div className="vault-week-header" onClick={() => toggleWeek(week.weekKey)}>
                                            <div className="vault-week-header-left">
                                                <div className={`vault-week-chevron ${isExpanded ? 'chevron-open' : ''}`}>
                                                    <ChevronRightIcon />
                                                </div>
                                                <div className="vault-week-icon"><CalendarIcon /></div>
                                                <div>
                                                    <p className="vault-week-label">Semana</p>
                                                    <p className="vault-week-range">{week.label}</p>
                                                </div>
                                            </div>
                                            <div className="vault-week-summary">
                                                <div className="vault-week-stat">
                                                    <span className="vault-week-stat-label">Ingresos</span>
                                                    <span className="vault-week-stat-value stat-ingreso">+{formatMoney(week.totalIngresos)}</span>
                                                </div>
                                                <div className="vault-week-stat">
                                                    <span className="vault-week-stat-label">Egresos</span>
                                                    <span className="vault-week-stat-value stat-egreso">-{formatMoney(week.totalEgresos)}</span>
                                                </div>
                                                <div className="vault-week-stat vault-week-stat-net">
                                                    <span className="vault-week-stat-label">Neto</span>
                                                    <span className={`vault-week-stat-value ${week.netAmount >= 0 ? 'stat-ingreso' : 'stat-egreso'}`}>
                                                        {week.netAmount >= 0 ? '+' : ''}{formatMoney(week.netAmount)}
                                                    </span>
                                                </div>
                                                <span className="vault-week-tx-count">{week.transactions.length}</span>
                                            </div>
                                        </div>

                                        {/* Week transactions - collapsible */}
                                        {isExpanded && (
                                            <>
                                                <div className="vault-week-transactions">
                                                    {week.transactions.map(tx => renderTxRow(tx, true))}
                                                </div>
                                                <div className="vault-week-footer">
                                                    <span>{week.transactions.length} movimiento{week.transactions.length !== 1 ? 's' : ''} esta semana</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ============ OVERLAY DETALLE DE DESEMBOLSO ============ */}
            {selectedDisbursement && (
                <div className="vault-fullhistory-overlay" onClick={() => setSelectedDisbursement(null)}>
                    <div className="vault-disb-detail-panel" onClick={e => e.stopPropagation()}>
                        <div className="vault-fullhistory-header">
                            <div className="d-flex align-items-center gap-3">
                                <div className={`vault-disb-status-icon ${selectedDisbursement.status === 'aprobado' ? 'status-approved' : 'status-pending'}`} style={{ width: 44, height: 44 }}>
                                    {selectedDisbursement.status === 'aprobado' ? <CheckCircleIcon /> : <CreditCardIcon />}
                                </div>
                                <div>
                                    <h2 className="vault-fullhistory-title">Detalle del Desembolso</h2>
                                    <p className="vault-fullhistory-subtitle">Información completa del préstamo</p>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <span className={`vault-disb-status-badge ${selectedDisbursement.status === 'aprobado' ? 'badge-approved' : 'badge-pending'}`} style={{ padding: '6px 14px', fontSize: 12 }}>
                                    {selectedDisbursement.status === 'aprobado' ? '✓ Aprobado' : '⏳ Pendiente'}
                                </span>
                                <button className="vault-fullhistory-close" onClick={() => setSelectedDisbursement(null)}>
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        <div className="vault-disb-detail-body custom-scrollbar">
                            {/* Monto principal */}
                            <div className="vault-disb-detail-amount-card">
                                <span className="vault-disb-detail-amount-label">Monto Solicitado</span>
                                <span className="vault-disb-detail-amount-value">{formatMoney(selectedDisbursement.loanInfo.requestedAmount)}</span>
                            </div>

                            {/* Info del cliente */}
                            <div className="vault-disb-detail-section">
                                <h4 className="vault-disb-detail-section-title"><UserIcon /> Información del Cliente</h4>
                                <div className="vault-disb-detail-grid">
                                    <div className="vault-disb-detail-field">
                                        <span className="vault-disb-detail-field-label">Nombre Completo</span>
                                        <span className="vault-disb-detail-field-value">{selectedDisbursement.loanInfo.clientName}</span>
                                    </div>
                                    <div className="vault-disb-detail-field">
                                        <span className="vault-disb-detail-field-label">DPI</span>
                                        <span className="vault-disb-detail-field-value">{selectedDisbursement.loanInfo.clientDPI}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info del préstamo */}
                            <div className="vault-disb-detail-section">
                                <h4 className="vault-disb-detail-section-title"><CreditCardIcon /> Detalles del Préstamo</h4>
                                <div className="vault-disb-detail-grid">
                                    <div className="vault-disb-detail-field">
                                        <span className="vault-disb-detail-field-label">Tipo de Préstamo</span>
                                        <span className="vault-disb-detail-field-value">{selectedDisbursement.loanInfo.loanType}</span>
                                    </div>
                                    <div className="vault-disb-detail-field">
                                        <span className="vault-disb-detail-field-label">Tasa de Interés</span>
                                        <span className="vault-disb-detail-field-value">{selectedDisbursement.loanInfo.interestRate}% mensual</span>
                                    </div>
                                    <div className="vault-disb-detail-field">
                                        <span className="vault-disb-detail-field-label">Plazo</span>
                                        <span className="vault-disb-detail-field-value">{selectedDisbursement.loanInfo.term}</span>
                                    </div>
                                    <div className="vault-disb-detail-field">
                                        <span className="vault-disb-detail-field-label">Asesor Asignado</span>
                                        <span className="vault-disb-detail-field-value">{selectedDisbursement.loanInfo.advisor}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Garantía */}
                            <div className="vault-disb-detail-section">
                                <h4 className="vault-disb-detail-section-title"><ShieldIcon /> Garantía</h4>
                                <div className="vault-disb-detail-grid">
                                    <div className="vault-disb-detail-field">
                                        <span className="vault-disb-detail-field-label">Descripción de la Prenda</span>
                                        <span className="vault-disb-detail-field-value">{selectedDisbursement.loanInfo.guarantee}</span>
                                    </div>
                                    <div className="vault-disb-detail-field">
                                        <span className="vault-disb-detail-field-label">Valor Estimado</span>
                                        <span className="vault-disb-detail-field-value" style={{ color: '#10b981' }}>{formatMoney(selectedDisbursement.loanInfo.guaranteeValue)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notas */}
                            <div className="vault-disb-detail-section">
                                <h4 className="vault-disb-detail-section-title"><FileTextIcon /> Observaciones</h4>
                                <p className="vault-disb-detail-notes">{selectedDisbursement.notes}</p>
                            </div>

                            {/* Fecha de solicitud */}
                            <div className="vault-disb-detail-section">
                                <h4 className="vault-disb-detail-section-title"><CalendarIcon /> Fecha de Solicitud</h4>
                                <p className="vault-disb-detail-field-value">{formatDate(selectedDisbursement.requestDate).date} — {formatDate(selectedDisbursement.requestDate).time}</p>
                            </div>

                            {/* Botón de aprobar */}
                            {selectedDisbursement.status === 'pendiente' && (
                                <button className="btn-approve-disb-large" onClick={() => handleApproveDisbursement(selectedDisbursement.id)}>
                                    <CheckCircleIcon /> Aprobar Desembolso de {formatMoney(selectedDisbursement.loanInfo.requestedAmount)}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
