import React, { useEffect, useState } from 'react';
import { loadData, getExpiryStatus, FIXED_TRAININGS } from '../store/dataStore';

import { Users, BookOpen, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [dataCache, setDataCache] = useState(null);

  useEffect(() => {
    const data = loadData();
    setDataCache(data);
    
    // Calculate KPIs
    let totalEmployees = data.employees.length;
    let totalRequiredTrainings = 0;
    let validTrainings = 0;
    let expiredTrainings = 0;
    
    data.employees.forEach(emp => {
      // All 8 fixed trainings are required
      const required = FIXED_TRAININGS.map(t => t.id);
      totalRequiredTrainings += required.length;
      
      required.forEach(tId => {
        const record = data.records.find(r => r.empId === emp.id && r.trainingId === tId);
        if (!record) {
          expiredTrainings++; // Missing is effectively non-compliant
        } else {
          const trainingInfo = FIXED_TRAININGS.find(t => t.id === tId);
          const status = getExpiryStatus(record.dateCompleted, trainingInfo.validityMonths);
          if (status.status === 'Valid' || status.status === 'Expiring Soon') {
            validTrainings++;
          } else {
            expiredTrainings++;
          }
        }
      });
    });

    const complianceRate = totalRequiredTrainings ? Math.round((validTrainings / totalRequiredTrainings) * 100) : 0;

    setStats({
      totalEmployees,
      complianceRate,
      expiredTrainings,
      totalTrainings: FIXED_TRAININGS.length
    });
  }, []);

  if (!stats) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const donutData = {
    labels: ['Compliant', 'Non-Compliant'],
    datasets: [{
      data: [stats.complianceRate, 100 - stats.complianceRate],
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderColor: ['rgba(16, 185, 129, 1)', 'rgba(239, 68, 68, 1)'],
      borderWidth: 1,
    }]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8' } }
    }
  };



  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>HSE Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Overview of employee training and compliance matrix.</p>
        </div>

      </header>

      <div style={gridStyle}>
        <div className="glass-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <p style={labelStyle}>Total Employees</p>
              <h2 style={valueStyle}>{stats.totalEmployees}</h2>
            </div>
            <div style={{ ...iconBoxStyle, background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)' }}>
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <p style={labelStyle}>Available Trainings</p>
              <h2 style={valueStyle}>{stats.totalTrainings}</h2>
            </div>
            <div style={{ ...iconBoxStyle, background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>
              <BookOpen size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <p style={labelStyle}>Overall Compliance</p>
              <h2 style={{ ...valueStyle, color: stats.complianceRate >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                {stats.complianceRate}%
              </h2>
            </div>
            <div style={{ ...iconBoxStyle, background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <p style={labelStyle}>Missing / Expired</p>
              <h2 style={{ ...valueStyle, color: stats.expiredTrainings > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
                {stats.expiredTrainings}
              </h2>
            </div>
            <div style={{ ...iconBoxStyle, background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
              <AlertTriangle size={24} className={stats.expiredTrainings > 0 ? 'pulse-danger' : ''} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', height: '300px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Compliance Rate</h3>
          <div style={{ height: '220px' }}>
            <Doughnut data={donutData} options={donutOptions} />
          </div>
        </div>
        
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
           <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Welcome to the HSE Training Matrix</h3>
           <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
             This unified dashboard helps track mandatory HSE courses against specific employee roles to ensure absolute compliance.
           </p>
           <ul style={{ color: 'var(--text-secondary)', listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
             <li>Monitor Expiring Certificates</li>
             <li>Follow up via WhatsApp & Email</li>
             <li>Add Data Manually</li>
           </ul>
           <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => window.location.href='/matrix'}>
             View Matrix Grid
           </button>
        </div>
      </div>
    </div>
  );
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1.5rem'
};

const cardStyle = {
  padding: '1.5rem',
};

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
};

const labelStyle = {
  color: 'var(--text-secondary)',
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: '0.5rem'
};

const valueStyle = {
  fontSize: '2rem',
  lineHeight: 1
};

const iconBoxStyle = {
  width: '48px',
  height: '48px',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
