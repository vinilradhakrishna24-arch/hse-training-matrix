import React, { useEffect, useState } from 'react';
import { loadData, saveData } from '../store/dataStore';
import EmployeeModal from '../components/EmployeeModal';
import { Search, Filter, Plus, Edit2, Trash2 } from 'lucide-react';

export default function MedicalMatrix() {
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  const refreshData = () => {
    setData(loadData());
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (!data) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const sites = ['All', ...new Set(data.employees.map(e => e.site).filter(Boolean))];
  const roles = ['All', ...new Set(data.employees.map(e => e.role).filter(Boolean))];

  const getMedicalStatus = (emp) => {
    const med = data.medicalRecords.find(m => m.empId === emp.id);
    if (!med) return { status: 'Missing', color: 'var(--danger-bg)', border: 'var(--danger)', text: 'Missing' };

    let baseText = med.status;
    if (med.expiryDate) {
      const expDateObj = new Date(med.expiryDate);
      const expFormatted = `${String(expDateObj.getDate()).padStart(2, '0')}-${String(expDateObj.getMonth() + 1).padStart(2, '0')}-${String(expDateObj.getFullYear()).slice(2)}`;
      baseText += ` (Exp: ${expFormatted})`;
    } else if (med.initialDate) {
      const initDateObj = new Date(med.initialDate);
      const initFormatted = `${String(initDateObj.getDate()).padStart(2, '0')}-${String(initDateObj.getMonth() + 1).padStart(2, '0')}-${String(initDateObj.getFullYear()).slice(2)}`;
      baseText += ` (Init: ${initFormatted})`;
    }

    if (med.status === 'Unfit') return { status: 'Unfit', color: 'var(--danger-bg)', border: 'var(--danger)', text: baseText };
    if (med.status === 'Fit') return { status: 'Fit', color: 'var(--success-bg)', border: 'var(--success)', text: baseText };
    return { status: 'Pending', color: 'var(--warning-bg)', border: 'var(--warning)', text: baseText };
  };

  const filteredEmployees = data.employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = filterSite === 'All' || emp.site === filterSite;
    const matchesRole = filterRole === 'All' || emp.role === filterRole;
    return matchesSearch && matchesSite && matchesRole;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Medical Matrix (FTW)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track employee Fitness To Work status.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={() => { setEditingEmployeeId(null); setIsModalOpen(true); }}>
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </header>

      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', minWidth: '200px', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search employee name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
        </div>
        
        <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
          <option value="All">All Sites</option>
          {sites.filter(s => s !== 'All').map(site => <option key={site} value={site}>{site}</option>)}
        </select>

        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
          <option value="All">All Designations</option>
          {roles.filter(r => r !== 'All').map(role => <option key={role} value={role}>{role}</option>)}
        </select>
      </div>

      <div className="table-container" style={{ flex: 1, overflow: 'auto' }}>
        <table className="custom-table" style={{ whiteSpace: 'nowrap', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', position: 'sticky', left: 0, zIndex: 2, background: 'var(--bg-card)' }}>Action</th>
              <th style={{ position: 'sticky', left: '80px', zIndex: 2, background: 'var(--bg-card)' }}>Employee Name</th>
              <th>Emp. No</th>
              <th>Designation</th>
              <th>Site / Location</th>
              <th style={{ textAlign: 'center', width: '300px' }}>Medical - Fitness To Work (FTW)</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => {
              const cell = getMedicalStatus(emp);
              const med = data.medicalRecords.find(m => m.empId === emp.id);
              return (
              <tr key={emp.id}>
                <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => { setEditingEmployeeId(emp.id); setIsModalOpen(true); }} style={{ color: 'var(--accent-primary)' }} title="Edit"><Edit2 size={16} /></button>
                    <button onClick={() => {
                      if (window.confirm('Delete employee?')) {
                        const d = loadData();
                        d.employees = d.employees.filter(e => e.id !== emp.id);
                        d.medicalRecords = d.medicalRecords.filter(m => m.empId !== emp.id);
                        saveData(d); refreshData();
                      }
                    }} style={{ color: 'var(--danger)' }} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
                <td style={{ position: 'sticky', left: '80px', zIndex: 1, background: 'var(--bg-card)', fontWeight: 600 }}>{emp.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{emp.empNo || '-'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{emp.role || '-'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{emp.site || '-'}</td>
                
                <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{ background: cell.color, border: `1px solid ${cell.border}`, padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, color: cell.border || 'var(--text-muted)', flex: 1 }}>
                      {cell.text}
                    </div>
                    {med && med.certificateFile && (
                      <a href={med.certificateFile} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.4rem 0.5rem' }}>
                         View Cert
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
        {filteredEmployees.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</div>}
      </div>

      <EmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} employeeId={editingEmployeeId} onSave={refreshData} isMedicalMode={true} />
    </div>
  );
}
