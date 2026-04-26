import { getFormSections } from '../constants';
import {
  PDF_CONFIG,
  addSectionHeader,
  generateSimplePDFSection,
  generateTablePDFSection,
  generateComplexPDFSection,
  addPageNumber
} from './pdfHelpers';

/**
 * Sanitize sheet name for Excel compatibility
 */
function sanitizeSheetName(name: string, usedNames: Set<string> = new Set()): string {
  let sanitized = name.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
  sanitized = sanitized.replace(/\s+/g, ' ');
  sanitized = sanitized.substring(0, 31).trim();
  
  let finalName = sanitized;
  let counter = 1;
  while (usedNames.has(finalName)) {
    const suffix = `_${counter}`;
    const maxLength = 31 - suffix.length;
    finalName = sanitized.substring(0, maxLength) + suffix;
    counter++;
  }
  
  usedNames.add(finalName);
  return finalName;
}

/**
 * Generate Excel template as blob
 */
async function generateExcelTemplateBlob(countryCode: string): Promise<Blob> {
  // Dynamic import for XLSX
  const XLSX = await import('xlsx');
  const sections = await getFormSections(countryCode);
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();
  
  sections.forEach((section) => {
    const sheetName = sanitizeSheetName(section.section, usedNames);
    
    if (section.type === 'simple') {
      const headers = section.fields.map(f => f.label);
      const sampleRow = section.fields.map(_f => ''); // Empty sample row
      const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    } else if (section.type === 'table') {
      const headers = section.columns.map(c => c.label);
      const maxRows = section.maxRows || 10;
      
      // Create empty rows based on maxRows
      const emptyRows = Array(maxRows).fill(null).map(() => 
        section.columns.map(_c => '')
      );
      
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...emptyRows]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    } else if (section.type === 'complex') {
      // For complex types, create a sheet for each structure
      section.structure.forEach((struct, idx) => {
        const structName = struct.title || `${section.section}_${idx + 1}`;
        const complexSheetName = sanitizeSheetName(structName, usedNames);
        const headers = struct.columns.map(c => c.label);
        const maxRows = struct.maxRows || 10;
        
        // Create empty rows based on maxRows
        const emptyRows = Array(maxRows).fill(null).map(() => 
          struct.columns.map(_c => '')
        );
        
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...emptyRows]);
        XLSX.utils.book_append_sheet(workbook, worksheet, complexSheetName);
      });
    }
  });
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generate PDF template as blob
 */
async function generatePDFTemplateBlob(countryCode: string): Promise<Blob> {
  // Dynamic import for jsPDF
  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable'); // Load autotable plugin
  
  const sections = await getFormSections(countryCode);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  let isFirstPage = true;
  
  for (let index = 0; index < sections.length; index++) {
    const section = sections[index];
    
    // Add new page for each section (except first)
    if (!isFirstPage) {
      doc.addPage();
    }
    isFirstPage = false;
    
    // Start content from top
    let yPosition = PDF_CONFIG.PAGE_MARGIN + 10;
    
    // Add section header (includes logo)
    yPosition = await addSectionHeader(doc, section, yPosition);
    
    // Add template note
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    // doc.text('(Template - Fill in your information)', PDF_CONFIG.PAGE_MARGIN, yPosition);
    yPosition += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Generate section content based on type (all templates - no data)
    switch (section.type) {
      case 'simple':
        generateSimplePDFSection(doc, section, yPosition);
        break;
        
      case 'table':
        generateTablePDFSection(doc, section, yPosition);
        break;
        
      case 'complex':
        generateComplexPDFSection(doc, section, yPosition);
        break;
    }
    
    // Add page number at bottom
    addPageNumber(doc, index + 1, sections.length);
  }
  
  return doc.output('blob');
}

/**
 * Generate and download template files (Excel + PDF) as ZIP
 */
export async function downloadTemplateAsZip(countryCode: string): Promise<void> {
  try {
    // Dynamic import for JSZip
    const JSZip = await import('jszip').then(m => m.default);
    const zip = new JSZip();
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Generate Excel template blob
    const excelBlob = await generateExcelTemplateBlob(countryCode);
    
    // Generate PDF template blob
    const pdfBlob = await generatePDFTemplateBlob(countryCode);
    
    // Add files to zip
    zip.file(`Onter_Care_${countryCode}_${timestamp}.xlsx`, excelBlob);
    zip.file(`Onter_Care_${countryCode}_${timestamp}.pdf`, pdfBlob);
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Download zip file
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Onter_Care_${countryCode}_${timestamp}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error creating template package:', error);
    throw new Error('Failed to generate template package. Please try again.');
  }
}
