import React, { useEffect, useState } from 'react';
import { loadData, saveData, getExpiryStatus } from '../store/dataStore';
import EmployeeModal from '../components/EmployeeModal';
import { Search, Filter, Plus, Edit2, Trash2, FolderPlus } from 'lucide-react';

export default function Matrix() {
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSite, setFilterSite] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
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

  const getCellStatus = (emp, trainingId) => {
    const record = data.records.find(r => r.empId === emp.id && r.trainingId === trainingId);
    if (!record) return { status: 'Missing', color: 'var(--danger-bg)', border: 'var(--danger)', text: 'Missing' };

    const status = getExpiryStatus(record);

    if (status.status === 'Not Applicable') return { status: 'Not Applicable', color: '#f1f5f9', border: '#cbd5e1', text: 'N/A' };
    if (status.status === 'Missing') return { status: 'Missing', color: 'var(--danger-bg)', border: 'var(--danger)', text: 'Missing' };

    const initDateObj = new Date(record.initialDate);
    const initFormatted = `${String(initDateObj.getDate()).padStart(2, '0')}-${String(initDateObj.getMonth() + 1).padStart(2, '0')}-${String(initDateObj.getFullYear()).slice(2)}`;

    if (status.status === 'Expired' || status.status === 'Expiring Soon' || record.expiryDate) {
      const expDateObj = new Date(record.expiryDate);
      const expFormatted = `${String(expDateObj.getDate()).padStart(2, '0')}-${String(expDateObj.getMonth() + 1).padStart(2, '0')}-${String(expDateObj.getFullYear()).slice(2)}`;
      if (status.status === 'Expired') return { status: 'Expired', color: 'var(--danger-bg)', border: 'var(--danger)', text: `Expired (${expFormatted})` };
      if (status.status === 'Expiring Soon') return { status: 'Expiring Soon', color: 'var(--warning-bg)', border: 'var(--warning)', text: `Exp: ${expFormatted}` };
      return { status: 'Valid', color: 'var(--success-bg)', border: 'var(--success)', text: `Valid (Exp: ${expFormatted})` };
    }
    
    return { status: 'Valid', color: 'var(--success-bg)', border: 'var(--success)', text: `Valid (Init: ${initFormatted})` };
  };

  const filteredEmployees = data.employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = filterSite === 'All' || emp.site === filterSite;
    const matchesRole = filterRole === 'All' || emp.role === filterRole;
    return matchesSearch && matchesSite && matchesRole;
  });

  const visibleTrainings = filterCourse === 'All' 
    ? data.trainings 
    : data.trainings.filter(t => t.id === filterCourse);

  const handleDeleteCourse = () => {
    const courseName = window.prompt("Enter the exact name of the course you want to delete:");
    if (!courseName) return;
    
    const currentData = loadData();
    const course = currentData.trainings.find(t => t.name.toLowerCase() === courseName.trim().toLowerCase());
    if (course) {
      if (window.confirm(`Are you sure you want to permanently delete "${course.name}"?`)) {
        currentData.trainings = currentData.trainings.filter(t => t.id !== course.id);
        currentData.records = currentData.records.filter(r => r.trainingId !== course.id);
        saveData(currentData);
        if (filterCourse === course.id) setFilterCourse('All');
        refreshData();
      }
    } else {
      alert("Course not found. Please type the exact name.");
    }
  };

  const handleAddCourse = () => {
    const courseName = window.prompt("Enter the name of the new training course:");
    if (courseName && courseName.trim() !== "") {
      const currentData = loadData();
      if (!currentData.trainings.find(t => t.name.toLowerCase() === courseName.trim().toLowerCase())) {
        currentData.trainings.push({ id: Date.now().toString(), name: courseName.trim() });
        saveData(currentData);
        refreshData();
      } else {
        alert("A course with this name already exists.");
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Training Matrix</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Cross-reference of employees and their required training status.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={handleAddCourse}>
            <FolderPlus size={18} /> Add Course
          </button>
          <button className="btn btn-outline" onClick={handleDeleteCourse} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
            <Trash2 size={18} /> Delete Course
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingEmployeeId(null); setIsModalOpen(true); }}>
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </header>

      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search employee name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
          </div>
          
          <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
            <option value="All">All Sites</option>
            {sites.filter(s => s !== 'All').map(site => <option key={site} value={site}>{site}</option>)}
          </select>

          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
            <option value="All">All Designations</option>
            {roles.filter(r => r !== 'All').map(role => <option key={role} value={role}>{role}</option>)}
          </select>

          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
            <option value="All">All Courses</option>
            {data.trainings.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--success)' }}></div> Valid
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--warning)' }}></div> Expiring Soon
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--danger)' }}></div> Expired / Missing
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#cbd5e1' }}></div> N/A
          </span>
        </div>
      </div>

      <div className="table-container" style={{ flex: 1, overflow: 'auto' }}>
        <table className="custom-table" style={{ whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, zIndex: 2, background: 'var(--bg-card)' }}>Action</th>
              <th style={{ position: 'sticky', left: '80px', zIndex: 2, background: 'var(--bg-card)' }}>Employee Name</th>
              <th>Emp. No</th>
              <th>Designation</th>
              <th>Site / Location</th>
              {visibleTrainings.map(t => (
                <th key={t.id} style={{ textAlign: 'center', padding: '0.75rem 1rem' }}>
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id}>
                <td style={{ position: 'sticky', left: 0, zIndex: 1, background: 'var(--bg-card)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => { setEditingEmployeeId(emp.id); setIsModalOpen(true); }} style={{ color: 'var(--accent-primary)' }} title="Edit"><Edit2 size={16} /></button>
                    <button onClick={() => {
                      if (window.confirm('Delete employee?')) {
                        const d = loadData();
                        d.employees = d.employees.filter(e => e.id !== emp.id);
                        d.records = d.records.filter(r => r.empId !== emp.id);
                        saveData(d); refreshData();
                      }
                    }} style={{ color: 'var(--danger)' }} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
                <td style={{ position: 'sticky', left: '80px', zIndex: 1, background: 'var(--bg-card)', fontWeight: 600 }}>{emp.name}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{emp.empNo || '-'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{emp.role || '-'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{emp.site || '-'}</td>
                
                {visibleTrainings.map(t => {
                  const cell = getCellStatus(emp, t.id);
                  return (
                    <td key={t.id} style={{ textAlign: 'center', padding: '0.5rem' }}>
                      <div style={{ background: cell.color, border: `1px solid ${cell.border}`, padding: '0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, color: cell.border || 'var(--text-muted)' }}>
                        {cell.text}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEmployees.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</div>}
      </div>

      <EmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} employeeId={editingEmployeeId} onSave={refreshData} />
    </div>
  );
}
