import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { loadData, getExpiryStatus } from '../store/dataStore';

const drawTable = (page, x, y, headers, rows, colWidths, font, boldFont, fontSize) => {
  const rowHeight = 25;
  let currentY = y;

  // Draw Headers
  page.drawRectangle({
    x: x,
    y: currentY - rowHeight + 5,
    width: colWidths.reduce((a, b) => a + b, 0),
    height: rowHeight,
    color: rgb(0.95, 0.96, 0.98), // Very light gray/blue
  });

  let currentX = x;
  headers.forEach((header, i) => {
    page.drawText(header, { x: currentX + 5, y: currentY - 10, size: fontSize, font: boldFont, color: rgb(0.1, 0.15, 0.2) });
    currentX += colWidths[i];
  });

  currentY -= rowHeight;

  // Draw Rows
  rows.forEach((row) => {
    currentX = x;
    row.forEach((cell, i) => {
      // Cell border
      page.drawRectangle({
        x: currentX,
        y: currentY - rowHeight + 5,
        width: colWidths[i],
        height: rowHeight,
        borderColor: rgb(0.8, 0.85, 0.9),
        borderWidth: 1,
      });

      page.drawText(cell || '-', { x: currentX + 5, y: currentY - 10, size: fontSize, font: font, color: rgb(0.2, 0.25, 0.3) });
      currentX += colWidths[i];
    });
    currentY -= rowHeight;
  });

  return currentY;
};

export const generateISOReport = async (empId) => {
  try {
    const data = loadData();
    const emp = data.employees.find(e => e.id === empId);
    if (!emp) throw new Error("Employee not found");

    const pdfDoc = await PDFDocument.create();
    
    // Attempt to load Trebuchet MS from Windows system via backend
    let regularFont;
    let boldFont;
    try {
      const regRes = await fetch('http://localhost:3001/api/font/trebuc.ttf');
      if (!regRes.ok) throw new Error('Font not found');
      const regBytes = await regRes.arrayBuffer();
      regularFont = await pdfDoc.embedFont(regBytes);

      const boldRes = await fetch('http://localhost:3001/api/font/trebucbd.ttf');
      if (!boldRes.ok) throw new Error('Font not found');
      const boldBytes = await boldRes.arrayBuffer();
      boldFont = await pdfDoc.embedFont(boldBytes);
    } catch (err) {
      console.warn("Could not load Trebuchet MS, falling back to Helvetica", err);
      regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    const margin = 40;

    // Logo embedding (if custom logo exists)
    let logoImg = null;
    let logoDims = null;
    if (data.settings && data.settings.logoBase64) {
      try {
        const logoData = data.settings.logoBase64;
        const base64Data = logoData.split(',')[1];
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        if (logoData.includes('image/png')) {
          logoImg = await pdfDoc.embedPng(imageBytes);
        } else if (logoData.includes('image/jpeg') || logoData.includes('image/jpg')) {
          logoImg = await pdfDoc.embedJpg(imageBytes);
        }

        if (logoImg) {
          logoDims = logoImg.scaleToFit(200, 80);
          page.drawImage(logoImg, {
            x: margin,
            y: height - margin - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
          });
        }
      } catch (err) {
        console.error("Failed to embed logo", err);
      }
    }

    // Header Title vertically aligned with logo
    const titleY = logoDims ? height - margin - (logoDims.height / 2) - 5 : height - margin - 20;

    page.drawText('HSE COMPETENCY & TRAINING RECORD', {
      x: logoDims ? margin + logoDims.width + 20 : margin,
      y: titleY,
      size: 16,
      font: boldFont,
      color: rgb(0.04, 0.06, 0.12),
    });

    page.drawLine({
      start: { x: margin, y: height - margin - (logoDims ? Math.max(logoDims.height, 40) : 40) },
      end: { x: width - margin, y: height - margin - (logoDims ? Math.max(logoDims.height, 40) : 40) },
      thickness: 1.5,
      color: rgb(0.2, 0.4, 0.8),
    });

    let yOffset = height - margin - (logoDims ? Math.max(logoDims.height, 40) : 40) - 30;

    // 1. Personal Details Table
    page.drawText('1. PERSONAL & WORK DETAILS', { x: margin, y: yOffset, size: 12, font: boldFont, color: rgb(0.2, 0.4, 0.8) });
    yOffset -= 20;

    const personalHeaders = ['Detail', 'Information', 'Detail', 'Information'];
    const personalRows = [
      ['Name', emp.name, 'Employee No', emp.empNo],
      ['Designation', emp.role, 'Project No', emp.projectNo],
      ['Site/Location', emp.site, 'Contact No', emp.contactNo],
      ['Date of Birth', emp.dob, 'Resident ID', emp.residentId]
    ];
    const personalColWidths = [100, 157.64, 100, 157.64];

    yOffset = drawTable(page, margin, yOffset, personalHeaders, personalRows, personalColWidths, regularFont, boldFont, 10);

    yOffset -= 30;

    // 2. HSE Training Details Table
    page.drawText('2. HSE TRAINING DETAILS', { x: margin, y: yOffset, size: 12, font: boldFont, color: rgb(0.2, 0.4, 0.8) });
    yOffset -= 20;

    const trainingHeaders = ['Course Name', 'Initial Date', 'Expiry Date', 'Status'];
    const trainingColWidths = [200, 100, 100, 115.28];
    const trainingRows = [];
    
    const empRecords = data.records.filter(r => r.empId === emp.id);
    const filesToAppend = [];

    // Personal docs if any
    if (emp.residentIdFile) filesToAppend.push({ url: emp.residentIdFile, label: 'Resident ID Card' });
    if (emp.drivingLicenceFile) filesToAppend.push({ url: emp.drivingLicenceFile, label: 'Driving Licence' });
    if (emp.cvFile) filesToAppend.push({ url: emp.cvFile, label: 'CV' });

    data.trainings.forEach(t => {
      const rec = empRecords.find(r => r.trainingId === t.id);
      if (rec) {
        if (rec.isNotApplicable) {
          trainingRows.push([t.name, 'N/A', 'N/A', 'N/A']);
        } else {
          const statusObj = getExpiryStatus(rec);
          trainingRows.push([
            t.name,
            rec.initialDate ? new Date(rec.initialDate).toLocaleDateString('en-GB') : '-',
            rec.expiryDate ? new Date(rec.expiryDate).toLocaleDateString('en-GB') : '-',
            statusObj.status
          ]);
        }

        if (rec.certificateFile) {
          filesToAppend.push({ url: rec.certificateFile, label: t.name + ' Certificate' });
        }
      } else {
        trainingRows.push([t.name, '-', '-', 'Missing']);
      }
    });

    yOffset = drawTable(page, margin, yOffset, trainingHeaders, trainingRows, trainingColWidths, regularFont, boldFont, 10);
    
    yOffset -= 30;

    // 3. Medical Details
    const medical = data.medicalRecords.find(m => m.empId === emp.id);
    if (medical) {
      page.drawText('3. MEDICAL DETAILS (FITNESS TO WORK)', { x: margin, y: yOffset, size: 12, font: boldFont, color: rgb(0.2, 0.4, 0.8) });
      yOffset -= 20;
      
      const medicalHeaders = ['Status', 'Initial Date', 'Expiry Date'];
      const medicalColWidths = [171.76, 171.76, 171.76];
      const medicalRows = [[
        medical.status,
        medical.initialDate ? new Date(medical.initialDate).toLocaleDateString('en-GB') : '-',
        medical.expiryDate ? new Date(medical.expiryDate).toLocaleDateString('en-GB') : '-'
      ]];

      drawTable(page, margin, yOffset, medicalHeaders, medicalRows, medicalColWidths, regularFont, boldFont, 10);
      
      if (medical.certificateFile) {
        filesToAppend.push({ url: medical.certificateFile, label: 'Medical Fitness Certificate' });
      }
    }

    // Fetch and Append Files
    for (const fileObj of filesToAppend) {
      try {
        const res = await fetch(fileObj.url);
        const arrayBuffer = await res.arrayBuffer();
        const ext = fileObj.url.split('.').pop().toLowerCase();

        if (ext === 'pdf') {
          const externalPdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await pdfDoc.copyPages(externalPdf, externalPdf.getPageIndices());
          copiedPages.forEach((cp) => {
             const { width, height } = cp.getSize();
             cp.drawText(`Attachment: ${fileObj.label}`, { x: 20, y: height - 20, size: 10, font: boldFont, color: rgb(0.2, 0.4, 0.8) });
             pdfDoc.addPage(cp);
          });
        } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
          let image;
          if (ext === 'png') {
            image = await pdfDoc.embedPng(arrayBuffer);
          } else {
            image = await pdfDoc.embedJpg(arrayBuffer);
          }
          
          const imgPage = pdfDoc.addPage([595.28, 841.89]);
          const { width, height } = imgPage.getSize();
          
          imgPage.drawText(`Attachment: ${fileObj.label}`, { x: margin, y: height - margin, size: 12, font: boldFont, color: rgb(0.2, 0.4, 0.8) });
          
          const imgDims = image.scaleToFit(width - (margin * 2), height - (margin * 2) - 40);
          imgPage.drawImage(image, {
            x: width / 2 - imgDims.width / 2,
            y: height / 2 - imgDims.height / 2,
            width: imgDims.width,
            height: imgDims.height,
          });
        }
      } catch (err) {
        console.error(`Failed to append ${fileObj.label}:`, err);
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ISO_Report_${emp.empNo}_${emp.name.replace(/\s+/g, '_')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("ISO Report generation failed:", error);
    alert("Failed to generate report. See console for details.");
  }
};

export const generateExpiriesISOReport = async (expiringItems) => {
  try {
    const data = loadData();
    const pdfDoc = await PDFDocument.create();
    
    let regularFont;
    let boldFont;
    try {
      const regRes = await fetch('http://localhost:3001/api/font/trebuc.ttf');
      if (!regRes.ok) throw new Error('Font not found');
      const regBytes = await regRes.arrayBuffer();
      regularFont = await pdfDoc.embedFont(regBytes);

      const boldRes = await fetch('http://localhost:3001/api/font/trebucbd.ttf');
      if (!boldRes.ok) throw new Error('Font not found');
      const boldBytes = await boldRes.arrayBuffer();
      boldFont = await pdfDoc.embedFont(boldBytes);
    } catch (err) {
      regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    let page = pdfDoc.addPage([841.89, 595.28]); // Landscape A4
    const { width, height } = page.getSize();
    const margin = 40;

    // Logo embedding
    let logoImg = null;
    let logoDims = null;
    if (data.settings && data.settings.logoBase64) {
      try {
        const logoData = data.settings.logoBase64;
        const base64Data = logoData.split(',')[1];
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        if (logoData.includes('image/png')) {
          logoImg = await pdfDoc.embedPng(imageBytes);
        } else if (logoData.includes('image/jpeg') || logoData.includes('image/jpg')) {
          logoImg = await pdfDoc.embedJpg(imageBytes);
        }

        if (logoImg) {
          logoDims = logoImg.scaleToFit(200, 80);
          page.drawImage(logoImg, {
            x: margin,
            y: height - margin - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
          });
        }
      } catch (err) {
        console.error("Failed to embed logo", err);
      }
    }

    const titleY = logoDims ? height - margin - (logoDims.height / 2) - 5 : height - margin - 20;

    page.drawText('EXPIRIES & FOLLOW-UP RECORD', {
      x: logoDims ? margin + logoDims.width + 20 : margin,
      y: titleY,
      size: 16,
      font: boldFont,
      color: rgb(0.04, 0.06, 0.12),
    });

    page.drawLine({
      start: { x: margin, y: height - margin - (logoDims ? Math.max(logoDims.height, 40) : 40) },
      end: { x: width - margin, y: height - margin - (logoDims ? Math.max(logoDims.height, 40) : 40) },
      thickness: 1.5,
      color: rgb(0.2, 0.4, 0.8),
    });

    let yOffset = height - margin - (logoDims ? Math.max(logoDims.height, 40) : 40) - 30;

    const headers = ['Employee Name', 'Emp No', 'Site / Region', 'Item Name', 'Expiry Date', 'Status'];
    const colWidths = [150, 80, 120, 200, 90, 121.89];
    
    const rows = expiringItems.map(item => [
      item.empName,
      item.empNo || '-',
      item.site || '-',
      item.itemName,
      item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-GB') : '-',
      item.status
    ]);

    yOffset = drawTable(page, margin, yOffset, headers, rows, colWidths, regularFont, boldFont, 10);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ISO_Expiries_Report.pdf`;
    a.click();
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("ISO Expiries Report generation failed:", error);
    alert("Failed to generate report. See console for details.");
  }
};
