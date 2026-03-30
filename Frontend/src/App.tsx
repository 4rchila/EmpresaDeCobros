import { BrowserRouter, Routes, Route} from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage/>}/>
        <Route path='/PrendaSol' element={<DashboardPage/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App