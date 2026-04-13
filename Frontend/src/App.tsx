import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import CreditorPage from './pages/creditor/creditorsPage'
import LoanPage from './pages/loan/loans'
import NewAdvisor from './pages/advisor/advisorPage'
import UserProfile from './pages/user/userProfile'
import PortafolioPage from './pages/user/portafolioPage'

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
      </Routes>
    </BrowserRouter>
  )
}

export default App