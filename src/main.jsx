import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/global.css'
import './styles/shadcn-theme.css'
import App from './App.jsx'
import CompradorPage from './pages/CompradorPage';
import VendedorPage from './pages/VendedorPage';
import CadastroPage from './pages/CadastroPage';
import DashboardGestaoPage from './pages/DashboardGestaoPage';
import Landpage from './pages/Landpage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Landpage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/app/comprador" element={<CompradorPage />} />
        <Route path="/app/vendedor" element={<VendedorPage />} />
        <Route path="/app/gestao" element={<DashboardGestaoPage />} />
      </Routes>
    </Router>
  </StrictMode>,
)
