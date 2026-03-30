import './dashboard.css';

function Dashboard() {
  return (
    <div className="vh-100 d-flex overflow-hidden" style={{ backgroundColor: '#1a2332' }}>
      
      {/* ================= PANEL IZQUIERDO (SIDEBAR FIJO) ================= */}
      <div className="sidebar d-flex flex-column flex-shrink-0 p-3">
        {/* Usuario Info */}
        <div className="d-flex align-items-center mb-4 mt-2 px-2">
          <div className="user-avatar d-flex align-items-center justify-content-center rounded-circle me-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="#1a2332"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#1a2332" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <h4 className="text-white mb-0 fw-bold" style={{ letterSpacing: '1px' }}>Usuario</h4>
        </div>

        {/* Menú de Navegación */}
        <div className="nav flex-column gap-3 px-2 mt-4">
          <button className="nav-btn active">INICIO</button>
          <button className="nav-btn">CLIENTES</button>
          <button className="nav-btn">PRESTAMOS</button>
          <button className="nav-btn">PAGOS</button>
          <button className="nav-btn">REPORTES</button>
          <button className="nav-btn">BITACORA SISTEMA</button>
        </div>
      </div>

      {/* ================= PANEL DERECHO (CONTENIDO PRINCIPAL) ================= */}
      <div className="d-flex flex-column flex-fill w-100">
        
        {/* Navbar Superior Fijo */}
        <div className="top-navbar d-flex align-items-center justify-content-between px-5">
          <div className="flex-fill d-flex justify-content-center">
            <div className="search-bar">
              <input type="text" placeholder="Buscar por cliente" className="text-center fw-bold text-dark w-100" />
            </div>
          </div>
          <div className="notification-bell ms-3 text-white">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
             </svg>
          </div>
        </div>

        {/* Área de Contenido con Scroll */}
        <div className="content-area flex-fill overflow-auto p-4">
          
          {/* ---- SECCIÓN 1: Monto, Clientes Atrasados y Ruta ---- */}
          <div className="dashboard-card bg-light p-4 mb-4">
            <div className="row g-4">
              <div className="col-md-5 d-flex flex-column gap-4">
                {/* Monto Recaudado */}
                <div className="dark-box d-flex flex-column align-items-center justify-content-center p-4">
                  <div className="gold-badge mb-3">Monto Recaudado</div>
                  <div className="gold-pill w-100 d-flex align-items-center justify-content-center gap-2">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                        <circle cx="12" cy="12" r="2"></circle>
                     </svg>
                     <span className="fw-bold">Q 12,589.00</span>
                  </div>
                </div>
                {/* Clientes Atrasados */}
                <div className="dark-box flex-fill d-flex flex-column align-items-center p-4">
                  <div className="grey-badge mb-3">Clientes Atrasados</div>
                  <div className="grey-box w-100 flex-fill"></div>
                </div>
              </div>
              {/* Ruta del Dia */}
              <div className="col-md-7">
                <div className="dark-box h-100 d-flex flex-column align-items-center p-4">
                  <div className="grey-badge mb-4">Ruta del Dia</div>
                  {/* Espacio para el contenido de la ruta */}
                </div>
              </div>
            </div>
          </div>

          {/* ---- SECCIÓN 2: KPIs y Pendientes ---- */}
          <div className="dashboard-card bg-light p-4 mb-4">
            {/* Top 3 Cards */}
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="gold-box h-100 d-flex flex-column align-items-center justify-content-center p-4">
                  <h6 className="fw-bold mb-1">Capital Recaudado</h6>
                  <h5 className="fw-bold mb-0">Q 1200.00</h5>
                </div>
              </div>
              <div className="col-md-4">
                <div className="dark-box text-white h-100 d-flex flex-column align-items-center justify-content-center p-4">
                  <h6 className="fw-bold mb-1 text-center">Mora Recaudada</h6>
                  <h5 className="fw-bold mb-0">Q 250.00</h5>
                </div>
              </div>
              <div className="col-md-4">
                <div className="dark-box text-white h-100 d-flex flex-column align-items-center justify-content-center p-4">
                  <h6 className="fw-bold mb-1 text-center">Ganancia Recaudada</h6>
                  <h5 className="fw-bold mb-0">Q 600.00</h5>
                </div>
              </div>
            </div>
            
            {/* Pendientes Container */}
            <div className="dark-box p-4">
              <div className="row g-4 h-100">
                <div className="col-md-4">
                  <div className="grey-box h-100 d-flex flex-column align-items-center p-3" style={{ minHeight: '200px' }}>
                     <div className="dark-badge text-white">Pendiente Precalificacion</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="grey-box h-100 d-flex flex-column align-items-center p-3" style={{ minHeight: '200px' }}>
                     <div className="dark-badge text-white">Pendiente Aprobacion</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="gold-box h-100 d-flex flex-column align-items-center p-3" style={{ minHeight: '200px' }}>
                     <div className="dark-badge text-white">Pendiente Desembolso</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---- SECCIÓN 3: Gráficas ---- */}
          <div className="dashboard-card bg-light p-4 mb-4">
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                 <div className="gold-box text-white d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                    Grafica
                 </div>
              </div>
              <div className="col-md-6">
                 <div className="dark-box text-white d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                    Grafica
                 </div>
              </div>
            </div>
            <div className="dark-box text-white d-flex align-items-center justify-content-center w-100" style={{ height: '250px' }}>
                Grafica
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;