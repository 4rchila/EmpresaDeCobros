import { BrowserRouter, Routes, Route} from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import CreditorPage from './pages/creditor/creditorsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/PrendaSol" element={<DashboardPage/>}/>
        <Route path="/CreditorPage" element={<CreditorPage/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App