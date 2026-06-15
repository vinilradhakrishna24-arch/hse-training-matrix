import * as XLSX from 'xlsx';

export const exportMatrixToExcel = (employees, trainings, records) => {
  const wsData = [
    [
      'Employee Name', 'Emp No', 'Project No', 'Designation', 'Site/Location',
      'Date of Birth', 'Age', 'Resident ID', 'ID Expiry', 'Contact No', 'Email',
      ...trainings.map(t => t.name)
    ]
  ];

  const calculateAge = (dobString) => {
    if (!dobString) return '-';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  employees.forEach(emp => {
    const row = [
      emp.name || '-',
      emp.empNo || '-',
      emp.projectNo || '-',
      emp.role || '-',
      emp.site || '-',
      emp.dob || '-',
      calculateAge(emp.dob),
      emp.residentId || '-',
      emp.residentExpiry || '-',
      emp.contactNo || '-',
      emp.email || '-',
    ];

    trainings.forEach(t => {
      const rec = records.find(r => r.empId === emp.id && r.trainingId === t.id);
      if (!rec) {
        row.push('Missing');
      } else if (rec.isNotApplicable) {
        row.push('N/A');
      } else {
        let text = '';
        if (rec.initialDate) text += `Init: ${rec.initialDate} `;
        if (rec.expiryDate) text += `Exp: ${rec.expiryDate}`;
        row.push(text.trim() || 'Missing');
      }
    });

    wsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Training Matrix");
  XLSX.writeFile(wb, "HSE_Training_Matrix.xlsx");
};

export const exportMedicalMatrixToExcel = (employees, medicalRecords) => {
  const wsData = [
    [
      'Employee Name', 'Emp No', 'Project No', 'Designation', 'Site/Location',
      'Date of Birth', 'Age', 'Resident ID', 'ID Expiry', 'Contact No', 'Email',
      'Medical - FTW Status', 'Initial Date', 'Expiry Date'
    ]
  ];

  const calculateAge = (dobString) => {
    if (!dobString) return '-';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  employees.forEach(emp => {
    const med = medicalRecords.find(m => m.empId === emp.id);
    wsData.push([
      emp.name || '-',
      emp.empNo || '-',
      emp.projectNo || '-',
      emp.role || '-',
      emp.site || '-',
      emp.dob || '-',
      calculateAge(emp.dob),
      emp.residentId || '-',
      emp.residentExpiry || '-',
      emp.contactNo || '-',
      emp.email || '-',
      med ? med.status : 'Missing',
      med && med.initialDate ? med.initialDate : '-',
      med && med.expiryDate ? med.expiryDate : '-'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Medical Matrix");
  XLSX.writeFile(wb, "HSE_Medical_Matrix.xlsx");
};
