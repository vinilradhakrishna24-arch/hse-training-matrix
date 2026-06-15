import React, { useEffect, useState } from 'react';
import { loadData } from '../store/dataStore';
import { exportMatrixToExcel, exportMedicalMatrixToExcel } from '../utils/exportUtils';
import { generateISOReport } from '../utils/pdfReportUtils';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';

export default function Reports() {
  const [data, setData] = useState(null);
  
  // Filters for Filtered Report
  const [filterSite, setFilterSite] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  
  // Selection for ISO Report
  const [selectedEmpId, setSelectedEmpId] = useState('');

  useEffect(() => {
    setData(loadData());
  }, []);

  if (!data) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const sites = ['All', ...new Set(data.employees.map(e => e.site).filter(Boolean))];
  const roles = ['All', ...new Set(data.employees.map(e => e.role).filter(Boolean))];

  const handleFilteredExport = () => {
    const filteredEmployees = data.employees.filter(emp => {
      const matchesSite = filterSite === 'All' || emp.site === filterSite;
      const matchesRole = filterRole === 'All' || emp.role === filterRole;
      return matchesSite && matchesRole;
    });
    exportMatrixToExcel(filteredEmployees, data.trainings, data.records);
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Reporting Hub</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Generate official ISO-compliant reports and data exports.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* 1. Full Training Matrix */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-md)' }}>
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Full Training Matrix</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Excel export of all employees and HSE courses.</p>
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'auto' }}
            onClick={() => exportMatrixToExcel(data.employees, data.trainings, data.records)}
          >
            <Download size={18} /> Download Excel
          </button>
        </div>

        {/* 2. Medical Matrix */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)', borderRadius: 'var(--radius-md)' }}>
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Medical Matrix (FTW)</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Excel export of all Fitness To Work statuses.</p>
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'auto', background: 'var(--success)' }}
            onClick={() => exportMedicalMatrixToExcel(data.employees, data.medicalRecords)}
          >
            <Download size={18} /> Download Excel
          </button>
        </div>

        {/* 3. Filtered Matrix */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(217, 119, 6, 0.1)', color: 'var(--warning)', borderRadius: 'var(--radius-md)' }}>
              <Filter size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Filtered Training Matrix</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Download specific site/designation data.</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <option value="All">All Sites</option>
              {sites.filter(s => s !== 'All').map(site => <option key={site} value={site}>{site}</option>)}
            </select>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <option value="All">All Designations</option>
              {roles.filter(r => r !== 'All').map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'auto', background: 'var(--warning)', color: 'white' }}
            onClick={handleFilteredExport}
          >
            <Download size={18} /> Download Filtered Excel
          </button>
        </div>

        {/* 4. Individual ISO Report */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)' }}>
              <FileText size={32} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Individual ISO Report</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>PDF report with all certificates appended.</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <option value="">-- Select Employee --</option>
              {data.employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.empNo})</option>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: 'auto', background: 'var(--danger)', opacity: selectedEmpId ? 1 : 0.5, pointerEvents: selectedEmpId ? 'auto' : 'none' }}
            onClick={() => generateISOReport(selectedEmpId)}
          >
            <Download size={18} /> Generate PDF Report
          </button>
        </div>

      </div>
    </div>
  );
}
