import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Grid, BellRing, Settings as SettingsIcon, ShieldCheck, HeartPulse, FileBarChart } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Matrix from './pages/Matrix';
import ExpiryList from './pages/ExpiryList';
import Reports from './pages/Reports';
import MedicalMatrix from './pages/MedicalMatrix';
import Settings from './pages/Settings';
import { loadData } from './store/dataStore';

function App() {
  const data = loadData();
  const settings = data.settings || {};

  useEffect(() => {
    if (settings.font) {
      document.body.style.fontFamily = settings.font;
    }
  }, [settings.font]);

  return (
    <Router>
      <div className="layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo-container" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem', padding: '1rem 0' }}>
              {settings.logoBase64 ? (
                <img src={settings.logoBase64} alt="Logo" style={{ width: '140px', height: 'auto', maxHeight: '100px', objectFit: 'contain' }} />
              ) : (
                <ShieldCheck size={48} color="var(--accent-primary)" />
              )}
              <div className="logo-text">
                <span className="logo-title" style={{ fontSize: '1.25rem' }}>Shaher United</span>
                <span className="logo-subtitle">HSE TRAINING MATRIX</span>
              </div>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/matrix" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Grid size={20} />
              <span>Training Matrix</span>
            </NavLink>
            <NavLink to="/medical" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <HeartPulse size={20} />
              <span>Medical Matrix</span>
            </NavLink>
            <NavLink to="/expiries" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <BellRing size={20} />
              <span>Expiries & Follow-up</span>
            </NavLink>
            <NavLink to="/reports" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <FileBarChart size={20} />
              <span>Reporting Hub</span>
            </NavLink>
          </nav>
          
          <div className="sidebar-footer">
            <NavLink to="/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} style={{ width: '100%', border: 'none', background: 'transparent' }}>
              <SettingsIcon size={20} />
              <span>Settings</span>
            </NavLink>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
              SUTC Version 4.0
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <div className="page-wrapper">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/matrix" element={<Matrix />} />
              <Route path="/medical" element={<MedicalMatrix />} />
              <Route path="/expiries" element={<ExpiryList />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
