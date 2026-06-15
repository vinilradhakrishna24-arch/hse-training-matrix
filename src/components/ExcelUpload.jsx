import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, AlertCircle } from 'lucide-react';
import { saveData, loadData } from '../store/dataStore';

export default function ExcelUpload({ onUploadSuccess }) {
  const fileInputRef = useRef(null);
  const [debugInfo, setDebugInfo] = useState('');

  const handleFileUpload = (e) => {
    setDebugInfo('');
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // Read as array of arrays to intelligently find the header row
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        
        processExcelData(rows);
      } catch (err) {
        console.error(err);
        setDebugInfo("Error reading file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processExcelData = (rows) => {
    if (rows.length === 0) {
      setDebugInfo("The Excel file appears to be empty.");
      return;
    }

    // 1. Find the header row (the row that likely contains 'Name', 'Employee', etc.)
    let headerRowIndex = -1;
    let headerRow = [];
    
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
      if (rowStr.includes('name') || rowStr.includes('emp') || rowStr.includes('role') || rowStr.includes('designation')) {
        headerRowIndex = i;
        headerRow = rows[i];
        break;
      }
    }

    if (headerRowIndex === -1) {
      // Fallback: just use the first row that has some data
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].some(cell => cell !== "")) {
          headerRowIndex = i;
          headerRow = rows[i];
          break;
        }
      }
    }

    if (headerRowIndex === -1 || headerRow.length === 0) {
      setDebugInfo("Could not find any headers or data in the file.");
      return;
    }

    // Map the columns
    const columns = headerRow.map(h => String(h).trim());
    const dataRows = rows.slice(headerRowIndex + 1);

    setDebugInfo(`Found headers: ${columns.join(', ')}`);

    let newEmployees = [];
    let newRecords = [];
    let newTrainings = [];
    let newMatrixRules = {};
    let newFollowUps = [];

    const empColumnMatchers = ['employee name', 'name', 'employee', 'emp name', 'full name', 'emp no', 'employee no'];
    const roleColumnMatchers = ['role', 'designation', 'position', 'job title'];
    const deptColumnMatchers = ['department', 'dept', 'section'];

    let nameIndex = -1;
    let roleIndex = -1;
    let deptIndex = -1;

    // Identify crucial columns
    columns.forEach((col, idx) => {
      const lowerCol = col.toLowerCase();
      if (nameIndex === -1 && empColumnMatchers.some(m => lowerCol.includes(m))) nameIndex = idx;
      if (roleIndex === -1 && roleColumnMatchers.some(m => lowerCol.includes(m))) roleIndex = idx;
      if (deptIndex === -1 && deptColumnMatchers.some(m => lowerCol.includes(m))) deptIndex = idx;
    });

    if (nameIndex === -1) {
      // If we still can't find a name column, just assume the first non-empty text column is the name
      nameIndex = 0;
    }

    let importedCount = 0;

    dataRows.forEach((row, index) => {
      const empName = String(row[nameIndex] || '').trim();
      if (!empName || empName === '') return; // Skip empty rows

      importedCount++;

      const role = roleIndex !== -1 ? String(row[roleIndex] || '').trim() || 'Employee' : 'Employee';
      const dept = deptIndex !== -1 ? String(row[deptIndex] || '').trim() || 'General' : 'General';

      // Create Employee
      let empId = Date.now() + index;
      let emp = { id: empId, name: empName, role: role, department: dept };
      newEmployees.push(emp);

      if (!newMatrixRules[emp.role]) {
        newMatrixRules[emp.role] = [];
      }

      // Process Trainings (every column that is not name/role/dept)
      columns.forEach((colName, colIdx) => {
        if (colIdx === nameIndex || colIdx === roleIndex || colIdx === deptIndex) return;
        
        const rawColName = colName;
        // Ignore empty headers or typical numbering columns
        if (!rawColName || rawColName.toLowerCase() === 's.no' || rawColName.toLowerCase() === 'sr.no') return;

        let dateCompleted = row[colIdx];
        
        // Find or create training
        let training = newTrainings.find(t => t.name.toLowerCase() === rawColName.toLowerCase());
        if (!training) {
          training = { id: Date.now() + Math.random(), name: rawColName, validityMonths: 12 };
          newTrainings.push(training);
        }
        
        if (!newMatrixRules[emp.role].includes(training.id)) {
          newMatrixRules[emp.role].push(training.id);
        }

        if (dateCompleted !== undefined && dateCompleted !== "") {
          let finalDate = dateCompleted;
          
          if (typeof dateCompleted === 'number') {
            const date = new Date(Math.round((dateCompleted - 25569)*86400*1000));
            finalDate = date.toISOString().split('T')[0];
          } else if (typeof dateCompleted === 'string') {
            const parsed = new Date(dateCompleted);
            if (!isNaN(parsed) && dateCompleted.trim() !== '' && !['missing','expired','n/a','-'].includes(dateCompleted.toLowerCase())) {
              finalDate = parsed.toISOString().split('T')[0];
            } else {
              finalDate = null;
            }
          }

          if (finalDate) {
            newRecords.push({ empId: emp.id, trainingId: training.id, dateCompleted: finalDate });
          }
        }
      });
    });

    if (importedCount === 0) {
      setDebugInfo(prev => prev + " | No valid employee rows found. Check your Name column.");
      return;
    }

    const newDataStore = {
      employees: newEmployees,
      records: newRecords,
      trainings: newTrainings,
      matrixRules: newMatrixRules,
      followUps: []
    };

    saveData(newDataStore);
    if (onUploadSuccess) onUploadSuccess();
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setDebugInfo('');
    alert(`Success! Loaded ${importedCount} employees and ${newTrainings.length} trainings.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
      <input 
        type="file" 
        accept=".xlsx, .xls" 
        onChange={handleFileUpload} 
        style={{ display: 'none' }} 
        ref={fileInputRef}
      />
      <button className="btn btn-outline" onClick={() => fileInputRef.current.click()}>
        <Upload size={18} /> Import Excel Data
      </button>
      {debugInfo && (
        <div style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', maxWidth: '300px', textAlign: 'right' }}>
          <AlertCircle size={14} /> {debugInfo}
        </div>
      )}
    </div>
  );
}
