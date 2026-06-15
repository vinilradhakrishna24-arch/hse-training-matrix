// Default fixed trainings
export const FIXED_TRAININGS = [
  { id: 't1', name: 'HSE INDUCTION - HSEI' },
  { id: 't2', name: 'RISK ASSESSMENT - RA' },
  { id: 't3', name: 'SSR' },
  { id: 't4', name: 'Fire Warden FW' },
  { id: 't5', name: 'First Aider - AHAF' },
  { id: 't6', name: 'Advance First Aider' },
  { id: 't7', name: 'WAH' },
  { id: 't8', name: 'IOSH MS' }
];

const INITIAL_DATA = {
  employees: [], // { id, name, empNo, projectNo, role, site, dob, residentId, residentExpiry, contactNo, email, residentIdFile, drivingLicenceFile, cvFile }
  records: [], // { empId, trainingId, initialDate, expiryDate, isNotApplicable, certificateFile }
  medicalRecords: [], // { empId, status: 'Fit'|'Unfit'|'Pending', initialDate, expiryDate, certificateFile }
  trainings: FIXED_TRAININGS,
  matrixRules: {}, 
  followUps: [],
  settings: {
    logoBase64: '',
    font: 'Trebuchet MS'
  }
};

export const loadData = () => {
  const data = localStorage.getItem('trainingMatrixData');
  if (data) {
    const parsed = JSON.parse(data);
    // Ensure all fixed trainings exist. But don't overwrite if user added new ones!
    const existingIds = parsed.trainings.map(t => t.id);
    FIXED_TRAININGS.forEach(ft => {
      if (!existingIds.includes(ft.id)) {
        parsed.trainings.push(ft);
      }
    });

    if (!parsed.medicalRecords) parsed.medicalRecords = [];
    if (!parsed.settings) parsed.settings = { logoBase64: '', font: 'Trebuchet MS' };

    // Backwards compatibility migration for records
    parsed.records = parsed.records.map(r => {
      if (r.dateCompleted !== undefined) {
        return {
          empId: r.empId,
          trainingId: r.trainingId,
          initialDate: r.dateCompleted,
          expiryDate: '', // Can't know explicit expiry from old records, assume valid forever unless edited
          isNotApplicable: false
        };
      }
      return r;
    });
    
    return parsed;
  }
  return INITIAL_DATA;
};

export const saveData = (data) => {
  localStorage.setItem('trainingMatrixData', JSON.stringify(data));
};

export const getExpiryStatus = (record) => {
  if (!record) return { status: 'Missing', daysRemaining: 0 };
  if (record.isNotApplicable) return { status: 'Not Applicable', daysRemaining: 0 };
  if (!record.initialDate && !record.expiryDate) return { status: 'Missing', daysRemaining: 0 };

  // If there's an initial date but no explicit expiry date, it never expires!
  if (!record.expiryDate) {
    return { status: 'Valid', daysRemaining: Infinity }; // Valid forever
  }

  const expiryDate = new Date(record.expiryDate);
  if (isNaN(expiryDate)) return { status: 'Missing', daysRemaining: 0 };

  const today = new Date();
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: 'Expired', daysRemaining: diffDays };
  if (diffDays <= 30) return { status: 'Expiring Soon', daysRemaining: diffDays };
  return { status: 'Valid', daysRemaining: diffDays };
};

export const getResidentExpiryStatus = (residentExpiry) => {
  if (!residentExpiry) return { status: 'Missing', daysRemaining: 0 };
  
  const expiryDate = new Date(residentExpiry);
  if (isNaN(expiryDate)) return { status: 'Missing', daysRemaining: 0 };

  const today = new Date();
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: 'Expired', daysRemaining: diffDays };
  if (diffDays <= 30) return { status: 'Expiring Soon', daysRemaining: diffDays };
  return { status: 'Valid', daysRemaining: diffDays };
};
