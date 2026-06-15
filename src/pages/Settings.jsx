import React, { useState, useEffect } from 'react';
import { loadData, saveData } from '../store/dataStore';
import { Image, Type, Save } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({ logoBase64: '', font: 'Trebuchet MS' });

  useEffect(() => {
    const data = loadData();
    if (data.settings) {
      setSettings(data.settings);
    }
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logoBase64: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const data = loadData();
    data.settings = settings;
    saveData(data);
    alert('Settings saved! Reload the page to see changes across the app.');
    window.location.reload();
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Application Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Customize the dashboard appearance and branding.</p>
      </header>

      <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Logo Upload */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><Image size={20} /> Custom Logo</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Upload your company logo (e.g., Shaher United). This will appear in the sidebar and on PDF reports.</p>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '100px', height: '100px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc' }}>
              {settings.logoBase64 ? <img src={settings.logoBase64} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <span style={{ color: 'var(--text-muted)' }}>No Logo</span>}
            </div>
            <div>
              <input type="file" id="logo-upload" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              <button className="btn btn-outline" onClick={() => document.getElementById('logo-upload').click()}>
                Upload Logo Image
              </button>
              {settings.logoBase64 && (
                <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', marginLeft: '0.5rem' }} onClick={() => setSettings(prev => ({...prev, logoBase64: ''}))}>
                  Clear Logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Font Change */}
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><Type size={20} /> Application Font</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Select the primary font used throughout the application.</p>
          
          <select 
            value={settings.font} 
            onChange={(e) => setSettings(prev => ({...prev, font: e.target.value}))}
            style={{ padding: '0.75rem', width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
          >
            <option value="Trebuchet MS">Trebuchet MS (Default)</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Inter, sans-serif">Inter</option>
            <option value="Roboto, sans-serif">Roboto</option>
            <option value="Times New Roman, serif">Times New Roman</option>
          </select>
        </div>

        <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={18} /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
