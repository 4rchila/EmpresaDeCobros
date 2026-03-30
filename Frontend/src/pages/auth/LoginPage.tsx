import './login.css'
import logo from '../../assets/logoFinal.png'
import finance from '../../assets/imagenFinance.png'
function LoginPage() {
  return (
    <div className="vh-100 d-flex">

      {/* Panel izquierdo */}
      <div className="d-flex flex-column align-items-center justify-content-center flex-fill"
           style={{ background: '#F2EDE4' }}>
        <div className="text-center mb-4">
          <img src={logo} alt="logoMomentaneo" className='logo-img'/>
          <h2 style={{ letterSpacing: '3px', color: '#1a2332', fontWeight: 700, fontFamily: "Segoe UI"}}>PRENDA SOL</h2>
          <div style={{ letterSpacing: '2px', color: '#1a2332', fontSize: '13px', fontFamily: "Segoe"}}>S. A</div>
          <div style={{ letterSpacing: '3px', color: '#C9A84C', fontSize: '11px' }}>FINANCE</div>
        </div>
        {/* Aquí puedes poner tu imagen financiera */}
        <img src={finance} alt="imagenContenedor" className='finance-img' />
      </div>

      {/* Panel derecho */}
      <div className="d-flex flex-column align-items-center justify-content-center flex-fill right-panel"
           style={{ background: '#1a2332' }}>

        <div className="p-4 login-card shadow-lg">
        {/* Campo Usuario */}
        <div style={{ width: '100%', maxWidth: '300px', marginBottom: '1.5rem' }}>
          <p style={{ color: '#fff', letterSpacing: '1px', marginBottom: '10px' }}>Usuario</p>
          <div className="d-flex align-items-center"
               style={{ background: '#f5f5f5', borderRadius: '50px', padding: '6px 16px 6px 6px', gap: '12px' }}>
            {/* Ícono usuario */}
            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
                 style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1a2332' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#ffffff"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <input className="input-custom"/>
          </div>
        </div>

        {/* Campo Contraseña */}
        <div style={{ width: '100%', maxWidth: '300px', marginBottom: '2rem' }}>
          <p style={{ color: '#fff', letterSpacing: '1px', marginBottom: '10px' }}>Contraseña</p>
          <div className="d-flex align-items-center"
               style={{ background: '#f5f5f5', borderRadius: '50px', padding: '6px 6px 6px 16px', gap: '12px' }}>
            <input type="password" className="input-custom" />
            {/* Ícono candado */}
            <div className="d-flex align-items-center justify-content-center flex-shrink-0"
                 style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1a2332' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" fill="#ffffff"/>
                <path d="M8 11V7a4 4 0 018 0v4" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Botón */}
        <div style={{ width: '100%', maxWidth: '300px' }}>
          <button className="btn-dora-login w-100">
            ENTRAR
          </button>
        </div>
       </div>
      </div>
    </div>
  )
}

export default LoginPage