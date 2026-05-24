import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import CreditorPage from './pages/creditor/creditorsPage'
import LoanPage from './pages/loan/loans'
import NewAdvisor from './pages/advisor/advisorPage'
import UserProfile from './pages/user/userProfile'
import PortafolioPage from './pages/user/portafolioPage'
import PaymentsPage from './pages/payment/payments'
import VaultPage from './pages/vault/vault'
import ReportsPage from './pages/report/reports'
import LogsPage from './pages/log/logs'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/PrendaSol" element={<DashboardPage />} />
        <Route path="/CreditorPage" element={<CreditorPage />} />
        <Route path="/LoansPage" element={<LoanPage />} />
        <Route path="/AdvisorPage" element={<NewAdvisor />} />
        <Route path="/UserProfile" element={<UserProfile />} />
        <Route path="/PortafolioPage" element={<PortafolioPage />} />
        <Route path="/PaymentsPage" element={<PaymentsPage />} />
        <Route path="/VaultPage" element={<VaultPage />} />
        <Route path="/ReportsPage" element={<ReportsPage />} />
        <Route path="/LogsPage" element={<LogsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App