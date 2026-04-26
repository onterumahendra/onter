/**
 * Generate Excel file as blob (with dynamic imports)
 */
async function generateExcelBlob(
  formData: Record<string, any>,
  countryCode: string,
  skippedSteps: Set<number> = new Set()
): Promise<Blob> {
  // Dynamic import for XLSX
  const XLSX = await import('xlsx');
  const sections = await import('../constants').then(m => m.getFormSections(countryCode));
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();
  
  // Helper function to sanitize sheet names
  const sanitizeSheetName = (name: string): string => {
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
  };
  
  sections.forEach((section, index) => {
    const sheetName = sanitizeSheetName(section.section);
    const sectionData = formData[section.section];
    const isSkipped = skippedSteps.has(index);
    
    if (section.type === 'simple') {
      const headers = section.fields.map(f => f.label);
      const values = section.fields.map(f => 
        isSkipped ? '' : (sectionData?.[f.name] || '')
      );
      const worksheet = XLSX.utils.aoa_to_sheet([headers, values]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
    } else if (section.type === 'table') {
      const headers = section.columns.map(c => c.label);
      const maxRows = section.maxRows || 10;
      let rows = isSkipped ? [] : (sectionData?.rows || []);
      
      // Fill up to maxRows with entered data first, then empty rows
      if (rows.length < maxRows) {
        const emptyRowsNeeded = maxRows - rows.length;
        const emptyRows = Array(emptyRowsNeeded).fill(null).map(() => 
          section.columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {})
        );
        rows = [...rows, ...emptyRows];
      }
      
      if (rows.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      } else {
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
      
    } else if (section.type === 'complex') {
      section.structure.forEach((struct, idx) => {
        const structName = struct.title || `${section.section}_${idx + 1}`;
        const complexSheetName = sanitizeSheetName(structName);
        const maxRows = struct.maxRows || 10;
        let structData = isSkipped ? [] : (sectionData?.[struct.title] || []);
        
        // Fill up to maxRows with entered data first, then empty rows
        if (structData.length < maxRows) {
          const emptyRowsNeeded = maxRows - structData.length;
          const emptyRows = Array(emptyRowsNeeded).fill(null).map(() => 
            struct.columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {})
          );
          structData = [...structData, ...emptyRows];
        }
        
        if (structData.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(structData);
          XLSX.utils.book_append_sheet(workbook, worksheet, complexSheetName);
        } else {
          const headers = struct.columns.map(c => c.label);
          const worksheet = XLSX.utils.aoa_to_sheet([headers]);
          XLSX.utils.book_append_sheet(workbook, worksheet, complexSheetName);
        }
      });
    }
  });
  
  // Convert workbook to blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Generate and download ZIP file containing both Excel and PDF
 * @param formData - Form data object
 * @param countryCode - Country code
 * @param completedSteps - Set of completed step indices
 * @param skippedSteps - Set of skipped step indices
 */
export async function downloadFormAsZip(
  formData: Record<string, any>,
  countryCode: string,
  completedSteps: Set<number> = new Set(),
  skippedSteps: Set<number> = new Set()
): Promise<void> {
  try {
    // Dynamic imports for heavy libraries
    const [JSZip, { generateFormPDF }] = await Promise.all([
      import('jszip').then(m => m.default),
      import('./pdfService')
    ]);
    
    const zip = new JSZip();
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Generate Excel blob with skipped sections handled
    const excelBlob = await generateExcelBlob(formData, countryCode, skippedSteps);
    
    // Generate PDF blob with skipped sections handled
    const pdfBlob = await generateFormPDF(formData, countryCode, completedSteps, skippedSteps);
    
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
    console.error('Error creating zip file:', error);
    throw new Error('Failed to create export package. Please try again.');
  }
}
