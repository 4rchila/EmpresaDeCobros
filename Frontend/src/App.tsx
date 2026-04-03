import { BrowserRouter, Routes, Route} from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import NewUserReport from './pages/creditor/newUserReport'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/PrendaSol" element={<DashboardPage/>}/>
        <Route path="/newUser" element={<NewUserReport/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App