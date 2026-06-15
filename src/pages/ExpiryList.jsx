import React, { useEffect, useState } from 'react';
import { loadData, getExpiryStatus } from '../store/dataStore';
import { BellRing, Mail, MessageCircle, AlertTriangle, Download } from 'lucide-react';
import { generateExpiriesISOReport } from '../utils/pdfReportUtils';

export default function ExpiryList() {
  const [data, setData] = useState(null);
  const [filterType, setFilterType] = useState('Course'); // 'Course' or 'Resident'
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');

  useEffect(() => {
    setData(loadData());
  }, []);

  if (!data) return <div style={{ padding: '2rem' }}>Loading...</div>;

  let expiringItems = [];

  if (filterType === 'Course') {
    data.records.forEach(r => {
      const statusObj = getExpiryStatus(r);
      if (statusObj.status === 'Expiring Soon' || statusObj.status === 'Expired') {
        const emp = data.employees.find(e => e.id === r.empId);
        const tr = data.trainings.find(t => t.id === r.trainingId);
        if (emp && tr) {
          expiringItems.push({
            id: `course-${emp.id}-${tr.id}`,
            empName: emp.name,
            empNo: emp.empNo,
            itemName: tr.name,
            courseId: tr.id,
            itemType: 'Course',
            expiryDate: r.expiryDate,
            status: statusObj.status,
            contactNo: emp.contactNo,
            email: emp.email,
            site: emp.site
          });
        }
      }
    });
  } else if (filterType === 'Resident') {
    const today = new Date();
    data.employees.forEach(emp => {
      if (emp.residentExpiry) {
        const expDate = new Date(emp.residentExpiry);
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          expiringItems.push({
            id: `resident-${emp.id}`,
            empName: emp.name,
            empNo: emp.empNo,
            itemName: 'Resident ID Card',
            itemType: 'Document',
            expiryDate: emp.residentExpiry,
            status: diffDays < 0 ? 'Expired' : 'Expiring Soon',
            contactNo: emp.contactNo,
            email: emp.email,
            site: emp.site
          });
        }
      }
    });
  }

  // Apply secondary filters
  expiringItems = expiringItems.filter(item => {
    if (filterRegion !== 'All' && item.site !== filterRegion) return false;
    if (filterMonth !== 'All') {
      if (!item.expiryDate) return false;
      const m = new Date(item.expiryDate).getMonth() + 1;
      if (m !== parseInt(filterMonth)) return false;
    }
    if (filterType === 'Course' && filterCourse !== 'All' && item.courseId !== filterCourse) return false;
    return true;
  });

  const regions = ['All', ...new Set(data.employees.map(e => e.site).filter(Boolean))];

  // Sort: Expired first, then earliest expiry
  expiringItems.sort((a, b) => {
    if (a.status === 'Expired' && b.status !== 'Expired') return -1;
    if (a.status !== 'Expired' && b.status === 'Expired') return 1;
    return new Date(a.expiryDate) - new Date(b.expiryDate);
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Expiries & Follow-up</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track and manage upcoming expirations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => generateExpiriesISOReport(expiringItems)}>
          <Download size={18} /> Download ISO PDF
        </button>
      </header>

      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button 
          className={`btn ${filterType === 'Course' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setFilterType('Course')}
        >
          HSE Course Expiries
        </button>
        <button 
          className={`btn ${filterType === 'Resident' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setFilterType('Resident'); setFilterCourse('All'); }}
        >
          Resident ID Expiries
        </button>

        <div style={{ flex: 1 }}></div>

        <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          {regions.map(r => <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>)}
        </select>

        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
          <option value="All">All Months</option>
          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
             <option key={i+1} value={i+1}>{m}</option>
          ))}
        </select>

        {filterType === 'Course' && (
          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
            <option value="All">All Courses</option>
            {data.trainings.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      <div className="table-container" style={{ flex: 1, overflow: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Emp. No</th>
              <th>{filterType === 'Course' ? 'Course Name' : 'Document Type'}</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expiringItems.map(item => {
              const formattedDate = new Date(item.expiryDate).toLocaleDateString('en-GB');
              
              const isExpired = item.status === 'Expired';
              
              // Formatting for WhatsApp and Email
              const waText = encodeURIComponent(`Hello ${item.empName},\nThis is a reminder that your ${item.itemName} ${isExpired ? 'expired' : 'is expiring'} on ${formattedDate}. Please arrange for renewal.`);
              const waLink = item.contactNo ? `https://wa.me/${item.contactNo.replace(/[^0-9]/g, '')}?text=${waText}` : '#';
              
              const mailSubject = encodeURIComponent(`Expiry Notice: ${item.itemName}`);
              const mailBody = encodeURIComponent(`Hello ${item.empName},\n\nThis is a formal reminder that your ${item.itemName} ${isExpired ? 'expired' : 'is expiring'} on ${formattedDate}.\n\nPlease arrange for renewal as soon as possible.\n\nThank you.`);
              const emailLink = item.email ? `mailto:${item.email}?subject=${mailSubject}&body=${mailBody}` : '#';

              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.empName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{item.empNo}</td>
                  <td>{item.itemName}</td>
                  <td style={{ fontWeight: 500 }}>{formattedDate}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: isExpired ? 'var(--danger-bg)' : 'var(--warning-bg)',
                      color: isExpired ? 'var(--danger)' : 'var(--warning)'
                    }}>
                      <AlertTriangle size={12} /> {item.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', color: '#16a34a', borderColor: '#16a34a' }} title="Send WhatsApp" onClick={(e) => { if (!item.contactNo) { e.preventDefault(); alert('No contact number available for this employee.'); }}}>
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                      <a href={emailLink} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem' }} title="Send Email" onClick={(e) => { if (!item.email) { e.preventDefault(); alert('No email address available for this employee.'); }}}>
                        <Mail size={14} /> Email
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {expiringItems.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <BellRing size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No expirations coming up in the next 30 days!</p>
          </div>
        )}
      </div>
    </div>
  );
}
