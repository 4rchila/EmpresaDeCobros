import "./vault.css";
import '../dashboard/dashboard.css';
import React, { useState, useMemo } from 'react';

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

const categories = [
    'Mantenimiento', 'Pago de Alquiler', 'Servicios Básicos',
    'Planilla / Salarios', 'Compra de Insumos', 'Otros Gastos Operativos'
];

const initialTransactions: Transaction[] = [
    { id: '1', type: 'ingreso', amount: 15000.00, date: '2026-04-25T10:30:00', description: 'Traslado inicial de fondos', category: 'Fondo Fijo' },
    { id: '2', type: 'ingreso', amount: 3500.50, date: '2026-04-28T14:15:00', description: 'Recaudación de ventas semanales', category: 'Ventas' },
    { id: '3', type: 'egreso', amount: 1200.00, date: '2026-04-29T09:00:00', description: 'Pago de mantenimiento preventivo de aires acondicionados', category: 'Mantenimiento' },
];

export default function VaultPage() {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('');
    const [expenseDescription, setExpenseDescription] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const currentBalance = useMemo(() => {
        return transactions.reduce((acc, curr) => {
            if (curr.type === 'ingreso') return acc + curr.amount;
            if (curr.type === 'egreso') return acc - curr.amount;
            return acc;
        }, 0);
    }, [transactions]);

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

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const amount = parseFloat(expenseAmount);
        if (isNaN(amount) || amount <= 0) { setError('Ingrese un monto válido mayor a 0.'); return; }
        if (!expenseCategory) { setError('Seleccione una categoría para el egreso.'); return; }
        if (!expenseDescription.trim()) { setError('Detalle la justificación del egreso.'); return; }
        if (amount > currentBalance) { setError('Fondos insuficientes en la bóveda.'); return; }

        const newExpense: Transaction = {
            id: Date.now().toString(), type: 'egreso', amount,
            date: new Date().toISOString(), description: expenseDescription.trim(),
            category: expenseCategory
        };
        setTransactions([newExpense, ...transactions]);
        setExpenseAmount(''); setExpenseCategory(''); setExpenseDescription('');
        setSuccessMsg('Egreso registrado exitosamente');
        setTimeout(() => setSuccessMsg(''), 2500);
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

                {/* HISTORIAL DE MOVIMIENTOS */}
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
                            {transactions.map(tx => {
                                const { date, time } = formatDate(tx.date);
                                return (
                                    <div key={tx.id} className="vault-tx-row">
                                        <div className={`vault-tx-type-icon ${tx.type === 'ingreso' ? 'tx-ingreso' : 'tx-egreso'}`}>
                                            {tx.type === 'ingreso' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                        </div>
                                        <div className="vault-tx-info">
                                            <span className={`vault-tx-type-badge ${tx.type === 'ingreso' ? 'badge-ingreso' : 'badge-egreso'}`}>
                                                {tx.type === 'ingreso' ? <><TrendingUpIcon /> Ingreso</> : <><TrendingDownIcon /> Egreso</>}
                                            </span>
                                            <span className="vault-tx-category-badge">{tx.category}</span>
                                            <p className="vault-tx-description">{tx.description}</p>

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
                            })}
                            {transactions.length === 0 && (
                                <div className="vault-empty-state">
                                    <ShieldIcon />
                                    <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginTop: 12 }}>Sin movimientos</h3>
                                    <p style={{ fontSize: 13 }}>No hay transacciones registradas en la bóveda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
