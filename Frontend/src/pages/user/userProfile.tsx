import "./user.css"
import '../dashboard/dashboard.css';
import React, { useState, useRef, useEffect } from 'react';

function UserProfile() {
    // Estado del username editable
    const [username, setUsername] = useState('4rchila');
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [usernameInput, setUsernameInput] = useState(username);
    const usernameInputRef = useRef<HTMLInputElement>(null);

    // Focus automático al entrar en modo edición
    useEffect(() => {
        if (isEditingUsername && usernameInputRef.current) {
            usernameInputRef.current.focus();
            usernameInputRef.current.select();
        }
    }, [isEditingUsername]);

    // Guardar username
    const handleSaveUsername = () => {
        const trimmed = usernameInput.trim();
        if (trimmed && trimmed !== username) {
            setUsername(trimmed);
            // TODO: Llamar al endpoint de backend para guardar el username
            // fetch('/api/user/username', { method: 'PUT', body: JSON.stringify({ username: trimmed }) });
        } else {
            setUsernameInput(username); // Revertir si está vacío
        }
        setIsEditingUsername(false);
    };

    // Manejar teclas en el input
    const handleUsernameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveUsername();
        } else if (e.key === 'Escape') {
            setUsernameInput(username);
            setIsEditingUsername(false);
        }
    };
    return (
        <div className="w-100 h-100 d-flex align-items-center justify-content-center user-profile-container">

            {/* ================= LAYOUT PRINCIPAL ================= */}
            <div className="d-flex align-items-center gap-5 flex-wrap justify-content-center">

                {/* ---- COLUMNA IZQUIERDA: Avatar + Username ---- */}
                <div className="d-flex flex-column align-items-center">
                    {/* Avatar circular */}
                    <div className="profile-avatar-wrapper mb-4">
                        <div className="profile-avatar">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        {/* Botón cambiar foto */}
                        <button type="button" className="profile-avatar-edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                            </svg>
                        </button>
                    </div>
                    {/* Username - Editable inline */}
                    <h5 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>{username}</h5>
                    {isEditingUsername ? (
                        <input
                            ref={usernameInputRef}
                            type="text"
                            value={usernameInput}
                            onChange={(e) => setUsernameInput(e.target.value)}
                            onBlur={handleSaveUsername}
                            onKeyDown={handleUsernameKeyDown}
                            className="profile-username-input"
                            maxLength={30}
                        />
                    ) : (
                        <span
                            className="profile-username-display"
                            onClick={() => { setUsernameInput(username); setIsEditingUsername(true); }}
                            title="Clic para editar"
                        >
                            @{username}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '6px', opacity: 0.4 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </span>
                    )}
                </div>

                {/* ---- COLUMNA DERECHA: Info + Tarjeta de acciones ---- */}
                <div className="d-flex flex-column align-items-center">
                    {/* Nombre completo y rol */}
                    <h3 className="text-white fw-bold mb-1" style={{ letterSpacing: '0.5px' }}>German Archila</h3>
                    <span className="profile-role-badge mb-4">GERENTE</span>

                    {/* Tarjeta de acciones */}
                    <div className="profile-actions-card">
                        <button type="button" className="profile-btn-gold">
                            CARTERA
                        </button>
                        <button type="button" className="profile-btn-dark">
                            RUTA DE COBRO
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default UserProfile;
