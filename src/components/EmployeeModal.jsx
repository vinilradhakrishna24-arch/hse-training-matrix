import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Upload, FileText, Eye, Trash2 } from 'lucide-react';
import { loadData, saveData } from '../store/dataStore';

export default function EmployeeModal({ isOpen, onClose, employeeId, onSave, isMedicalMode = false }) {
  const [formData, setFormData] = useState({
    name: '', empNo: '', projectNo: 'TN 58/2023', role: '', site: '', dob: '', 
    residentId: '', residentExpiry: '', contactNo: '', email: '',
    residentIdFile: '', drivingLicenceFile: '', cvFile: ''
  });
  
  const [medicalData, setMedicalData] = useState({
    status: 'Pending', initialDate: '', expiryDate: '', certificateFile: ''
  });

  const [trainingsList, setTrainingsList] = useState([]);
  const [trainingRecords, setTrainingRecords] = useState({});
  const [uploadingField, setUploadingField] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const data = loadData();
      setTrainingsList(data.trainings);

      if (employeeId) {
        const emp = data.employees.find(e => e.id === employeeId);
        if (emp) {
          setFormData({
            name: emp.name || '', empNo: emp.empNo || '', projectNo: emp.projectNo || 'TN 58/2023', 
            role: emp.role || '', site: emp.site || '', dob: emp.dob || '', 
            residentId: emp.residentId || '', residentExpiry: emp.residentExpiry || '', 
            contactNo: emp.contactNo || '', email: emp.email || '',
            residentIdFile: emp.residentIdFile || '', drivingLicenceFile: emp.drivingLicenceFile || '', cvFile: emp.cvFile || ''
          });

          const empRecords = data.records.filter(r => r.empId === employeeId);
          const trData = {};
          empRecords.forEach(r => {
            trData[r.trainingId] = {
              isNotApplicable: r.isNotApplicable || false,
              initialDate: r.initialDate || '',
              expiryDate: r.expiryDate || '',
              certificateFile: r.certificateFile || ''
            };
          });
          setTrainingRecords(trData);
          const empMed = data.medicalRecords.find(m => m.empId === employeeId);
          if (empMed) {
            setMedicalData({
              status: empMed.status || 'Pending',
              initialDate: empMed.initialDate || '',
              expiryDate: empMed.expiryDate || '',
              certificateFile: empMed.certificateFile || ''
            });
          } else {
            setMedicalData({ status: 'Pending', initialDate: '', expiryDate: '', certificateFile: '' });
          }
        }
      } else {
        setFormData({
          name: '', empNo: '', projectNo: 'TN 58/2023', role: '', site: '', dob: '', 
          residentId: '', residentExpiry: '', contactNo: '', email: '',
          residentIdFile: '', drivingLicenceFile: '', cvFile: ''
        });
        setMedicalData({ status: 'Pending', initialDate: '', expiryDate: '', certificateFile: '' });
        setTrainingRecords({});
      }
    }
  }, [isOpen, employeeId]);

  if (!isOpen) return null;

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTrainingRecordChange = (tId, field, value) => {
    setTrainingRecords(prev => {
      const current = prev[tId] || { isNotApplicable: false, initialDate: '', expiryDate: '', certificateFile: '' };
      return { ...prev, [tId]: { ...current, [field]: value } };
    });
  };

  const handleFileUpload = async (e, field, isTraining = false, tId = null, isMedical = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploaderId = isTraining ? `training-${tId}` : (isMedical ? 'medical' : field);
    setUploadingField(uploaderId);

    const formDataObj = new FormData();
    formDataObj.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj
      });
      const data = await res.json();
      
      if (data.filePath) {
        if (isTraining) {
          handleTrainingRecordChange(tId, 'certificateFile', data.filePath);
        } else if (isMedical) {
          setMedicalData(prev => ({ ...prev, [field]: data.filePath }));
        } else {
          setFormData(prev => ({ ...prev, [field]: data.filePath }));
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('File upload failed. Ensure the server is running.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = loadData();
    let empId = employeeId;

    if (!empId) {
      empId = Date.now().toString();
      data.employees.push({ id: empId, ...formData });
    } else {
      const idx = data.employees.findIndex(e => e.id === empId);
      if (idx !== -1) {
        data.employees[idx] = { id: empId, ...formData };
      }
    }

    data.records = data.records.filter(r => r.empId !== empId);
    Object.keys(trainingRecords).forEach(tId => {
      const tr = trainingRecords[tId];
      if (tr.isNotApplicable || tr.initialDate || tr.expiryDate || tr.certificateFile) {
        data.records.push({
          empId: empId,
          trainingId: tId,
          isNotApplicable: tr.isNotApplicable,
          initialDate: tr.isNotApplicable ? '' : tr.initialDate,
          expiryDate: tr.isNotApplicable ? '' : tr.expiryDate,
          certificateFile: tr.isNotApplicable ? '' : tr.certificateFile
        });
      }
    });

    data.medicalRecords = data.medicalRecords.filter(m => m.empId !== empId);
    data.medicalRecords.push({
      empId: empId,
      ...medicalData
    });

    saveData(data);
    onSave();
    onClose();
  };

  const FileUploader = ({ label, field, value, isTraining = false, tId = null, isMedical = false }) => {
    const fileInputRef = useRef(null);
    const isUploading = uploadingField === (isTraining ? `training-${tId}` : (isMedical ? 'medical' : field));

    return (
      <div className="input-group">
        {label && <label>{label}</label>}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input 
            type="file" 
            accept=".pdf,.jpg,.jpeg,.png"
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={(e) => handleFileUpload(e, field, isTraining, tId, isMedical)} 
          />
          <button 
            type="button" 
            className="btn btn-outline" 
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
            onClick={() => fileInputRef.current.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : <><Upload size={14} /> Upload</>}
          </button>
          
          {value && (
            <a href={value} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}>
              <Eye size={14} /> View
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={overlayStyle}>
      <div className="glass-card animate-fade-in" style={modalStyle}>
        <div style={headerStyle}>
          <h2>{employeeId ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button type="button" onClick={onClose} style={closeButtonStyle}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* Personal & Work Details */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Personal & Work Details</h3>
            <div style={gridStyle}>
              <div className="input-group"><label>Employee Name *</label><input required type="text" name="name" value={formData.name} onChange={handleInputChange} /></div>
              <div className="input-group"><label>Employee No *</label><input required type="text" name="empNo" value={formData.empNo} onChange={handleInputChange} /></div>
              <div className="input-group"><label>Project No</label><input type="text" name="projectNo" value={formData.projectNo} onChange={handleInputChange} /></div>
              <div className="input-group"><label>Designation *</label><input required type="text" name="role" value={formData.role} onChange={handleInputChange} /></div>
              <div className="input-group"><label>Site / Location</label><input type="text" name="site" value={formData.site} onChange={handleInputChange} /></div>
              <div className="input-group"><label>Date of Birth</label><input type="date" name="dob" value={formData.dob} onChange={handleInputChange} /></div>
              <div className="input-group"><label>Age</label><input type="text" disabled value={calculateAge(formData.dob)} style={{ backgroundColor: '#f1f5f9' }} /></div>
              <div className="input-group"><label>Resident Id No</label><input type="text" name="residentId" value={formData.residentId} onChange={handleInputChange} /></div>
              <div className="input-group"><label>Resident Expiry Date</label><input type="date" name="residentExpiry" value={formData.residentExpiry} onChange={handleInputChange} /></div>
              <div className="input-group"><label>Contact No</label><input type="tel" name="contactNo" value={formData.contactNo} onChange={handleInputChange} /></div>
              <div className="input-group"><label>Email id</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} /></div>
            </div>
            
            <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>Personal Documents</h4>
            <div style={gridStyle}>
              <FileUploader label="Resident ID Card" field="residentIdFile" value={formData.residentIdFile} />
              <FileUploader label="Driving Licence" field="drivingLicenceFile" value={formData.drivingLicenceFile} />
              <FileUploader label="CV" field="cvFile" value={formData.cvFile} />
            </div>
          </div>

          {/* Training Details - Hidden in Medical Mode */}
          {!isMedicalMode && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>HSE Training Details</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Check "N/A" if not applicable. Leave Expiry Date blank if the course has no expiration.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {trainingsList.map(t => {
                const tr = trainingRecords[t.id] || { isNotApplicable: false, initialDate: '', expiryDate: '', certificateFile: '' };
                return (
                  <div key={t.id} style={{ ...trainingRowStyle, flexWrap: 'wrap' }}>
                    <div style={{ width: '100%', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>{t.name}</div>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', width: '100%', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', marginTop: '1.5rem' }}>
                        <input type="checkbox" checked={tr.isNotApplicable} onChange={(e) => handleTrainingRecordChange(t.id, 'isNotApplicable', e.target.checked)} /> N/A
                      </label>

                      <div className="input-group" style={{ minWidth: '140px', flex: 1, opacity: tr.isNotApplicable ? 0.4 : 1, pointerEvents: tr.isNotApplicable ? 'none' : 'auto' }}>
                        <label>Initial Date</label>
                        <input type="date" title="Initial Date" value={tr.initialDate} onChange={(e) => handleTrainingRecordChange(t.id, 'initialDate', e.target.value)} />
                      </div>

                      <div className="input-group" style={{ minWidth: '140px', flex: 1, opacity: tr.isNotApplicable ? 0.4 : 1, pointerEvents: tr.isNotApplicable ? 'none' : 'auto' }}>
                        <label>Expiry Date</label>
                        <input type="date" title="Expiry Date" value={tr.expiryDate} onChange={(e) => handleTrainingRecordChange(t.id, 'expiryDate', e.target.value)} />
                      </div>

                      <div style={{ flex: 1, minWidth: '200px', opacity: tr.isNotApplicable ? 0.4 : 1, pointerEvents: tr.isNotApplicable ? 'none' : 'auto' }}>
                        <FileUploader label="Certificate" field="certificateFile" value={tr.certificateFile} isTraining={true} tId={t.id} />
                      </div>

                      <div style={{ marginTop: '1.5rem' }}>
                        <button type="button" className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => {
                          handleTrainingRecordChange(t.id, 'initialDate', '');
                          handleTrainingRecordChange(t.id, 'expiryDate', '');
                          handleTrainingRecordChange(t.id, 'certificateFile', '');
                          handleTrainingRecordChange(t.id, 'isNotApplicable', false);
                        }}>
                          <Trash2 size={14} /> Clear
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Medical Details (Fitness To Work)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ ...trainingRowStyle, flexWrap: 'wrap' }}>
                <div style={{ width: '100%', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Medical - FTW</div>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', width: '100%', flexWrap: 'wrap' }}>
                  <div className="input-group" style={{ minWidth: '140px', flex: 1 }}>
                    <label>Status</label>
                    <select value={medicalData.status} onChange={(e) => setMedicalData(prev => ({...prev, status: e.target.value}))} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}>
                      <option value="Pending">Pending</option>
                      <option value="Fit">Fit</option>
                      <option value="Unfit">Unfit</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ minWidth: '140px', flex: 1 }}>
                    <label>Initial Date</label>
                    <input type="date" title="Initial Date" value={medicalData.initialDate} onChange={(e) => setMedicalData(prev => ({...prev, initialDate: e.target.value}))} />
                  </div>

                  <div className="input-group" style={{ minWidth: '140px', flex: 1 }}>
                    <label>Expiry Date</label>
                    <input type="date" title="Expiry Date" value={medicalData.expiryDate} onChange={(e) => setMedicalData(prev => ({...prev, expiryDate: e.target.value}))} />
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <FileUploader label="Medical Certificate" field="certificateFile" value={medicalData.certificateFile} isMedical={true} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={footerStyle}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={18} /> Save Employee</button>
          </div>
        </form>
      </div>

      <style>{`
        .input-group { display: flex; flex-direction: column; gap: 0.25rem; }
        .input-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
        .input-group input:not([type="file"]):not([type="checkbox"]) {
          padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);
          border: 1px solid var(--border-color); font-family: inherit;
          font-size: 0.95rem; color: var(--text-primary);
        }
        .input-group input:focus { outline: none; border-color: var(--accent-primary); box-shadow: 0 0 0 2px rgba(37,99,235,0.2); }
      `}</style>
    </div>
  );
}

const trainingRowStyle = {
  display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem',
  backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)'
};
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center',
  alignItems: 'center', zIndex: 100, padding: '1rem', backdropFilter: 'blur(4px)'
};
const modalStyle = { width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' };
const closeButtonStyle = { color: 'var(--text-muted)', transition: 'color 0.2s' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '2rem' };
const sectionStyle = { backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' };
const sectionTitleStyle = { fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', display: 'inline-block' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' };
const footerStyle = { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' };
