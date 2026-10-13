import { getFormSections } from '../constants';
import DOMPurify from 'dompurify';

// Type for values that can be sanitized
type SanitizableValue = string | number | boolean | null | undefined;

// Sanitize input to prevent XSS
function sanitizeInput(value: SanitizableValue): string | number | boolean {
  if (typeof value === 'string') {
    return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/**
 * Sanitize sheet name for Excel compatibility
 * - Remove special characters not allowed in Excel sheet names
 * - Limit to 31 characters
 * - Prevent duplicates by tracking used names
 */
function sanitizeSheetName(name: string, usedNames: Set<string> = new Set()): string {
  // Remove special characters: Excel doesn't allow: \ / ? * [ ] :
  // We'll keep only alphanumeric, spaces, underscores, and hyphens
  let sanitized = name.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
  
  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Limit to 31 characters
  sanitized = sanitized.substring(0, 31).trim();
  
  // Handle duplicates by appending a number
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
 * Generate a sample Excel file with all form sections as sheets
 */
export async function generateSampleExcel(countryCode: string): Promise<void> {
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
      const sampleRow = section.columns.map(_c => ''); // Empty sample row
      const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    } else if (section.type === 'complex') {
      // For complex types, create a sheet for each structure
      section.structure.forEach((struct, idx) => {
        const structName = struct.title || `${section.section}_${idx + 1}`;
        const complexSheetName = sanitizeSheetName(structName, usedNames);
        const headers = struct.columns.map(c => c.label);
        const sampleRow = struct.columns.map(_c => '');
        const worksheet = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
        XLSX.utils.book_append_sheet(workbook, worksheet, complexSheetName);
      });
    }
  });
  
  const fileName = `Onter_Care_${countryCode}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Import Excel file and convert to form data structure
 * Maps sheet names back to actual section names
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function importExcel(file: File, countryCode: string): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const run = async () => {
      try {
        const XLSX = await import('xlsx');
        const sections = await getFormSections(countryCode);
        const usedNames = new Set<string>();

        const sheetToSectionMap = new Map<string, string>();
        const sectionStructureMap = new Map<string, any>();
        const complexStructureMap = new Map<string, any>();

        sections.forEach((section) => {
          const sheetName = sanitizeSheetName(section.section, usedNames);
          sheetToSectionMap.set(sheetName, section.section);
          sectionStructureMap.set(section.section, section);

          if (section.type === 'complex') {
            section.structure.forEach((struct, idx) => {
              const structName = struct.title || `${section.section}_${idx + 1}`;
              const complexSheetName = sanitizeSheetName(structName, usedNames);
              const complexKey = `${section.section}:::${struct.title}`;
              sheetToSectionMap.set(complexSheetName, complexKey);
              complexStructureMap.set(complexKey, struct);
            });
          }
        });

        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const formData: Record<string, any> = {};

            workbook.SheetNames.forEach((sheetName) => {
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                defval: '',
                raw: false,
              });

              const sanitizedData = jsonData.map((row) =>
                Object.fromEntries(
                  Object.entries(row as Record<string, any>).map(([k, v]) => [
                    k,
                    sanitizeInput(v),
                  ])
                )
              );

              const nonEmptyRows = sanitizedData.filter((row) => {
                return Object.values(row).some((value) => value !== '' && value !== null && value !== undefined);
              });

              const mappingKey = sheetToSectionMap.get(sheetName);

              if (mappingKey && nonEmptyRows.length > 0) {
                if (mappingKey.includes(':::')) {
                  const [sectionName, structTitle] = mappingKey.split(':::');
                  if (!formData[sectionName]) {
                    formData[sectionName] = {};
                  }

                  const struct = complexStructureMap.get(mappingKey);
                  if (struct && struct.columns) {
                    const convertedRows = nonEmptyRows.map((row) => {
                      const convertedRow: Record<string, any> = {};
                      struct.columns.forEach((col: any) => {
                        if (row[col.label] !== undefined) {
                          convertedRow[col.name] = row[col.label];
                        }
                      });
                      return convertedRow;
                    });
                    formData[sectionName][structTitle] = convertedRows;
                  } else {
                    formData[sectionName][structTitle] = nonEmptyRows;
                  }
                } else {
                  const section = sectionStructureMap.get(mappingKey);

                  if (section?.type === 'simple') {
                    const firstRow = nonEmptyRows[0];
                    const sectionData: Record<string, any> = {};

                    section.fields.forEach((field: any) => {
                      if (firstRow[field.label] !== undefined) {
                        sectionData[field.name] = firstRow[field.label];
                      }
                    });

                    formData[mappingKey] = sectionData;
                  } else if (section?.type === 'table') {
                    const convertedRows = nonEmptyRows.map((row) => {
                      const convertedRow: Record<string, any> = {};
                      section.columns.forEach((col: any) => {
                        if (row[col.label] !== undefined) {
                          convertedRow[col.name] = row[col.label];
                        }
                      });
                      return convertedRow;
                    });

                    formData[mappingKey] = { rows: convertedRows };
                  }
                }
              }
            });

            resolve(formData);
          } catch {
            reject(new Error('Failed to parse Excel file. Please ensure it\'s a valid Excel file.'));
          }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      } catch {
        reject(new Error('Failed to load form configuration'));
      }
    };

    void run();
  });
}

/**
 * Export current form data to Excel file
 */
export async function exportToExcel(
  formData: Record<string, any>,
  countryCode: string
): Promise<void> {
  // Dynamic import for XLSX
  const XLSX = await import('xlsx');
  const sections = await getFormSections(countryCode);
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();
  
  sections.forEach((section) => {
    const sheetName = sanitizeSheetName(section.section, usedNames);
    const sectionData = formData[section.section];
    
    if (!sectionData) return;
    
    if (section.type === 'simple') {
      // Convert simple fields to single row
      const headers = section.fields.map(f => f.label);
      const values = section.fields.map(f => sectionData[f.name] || '');
      const worksheet = XLSX.utils.aoa_to_sheet([headers, values]);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    } else if (section.type === 'table') {
      // Convert table data to multiple rows
      const rows = sectionData.rows || [];
      if (rows.length > 0) {
        // Create headers array
        const headers = section.columns.map((c: any) => c.label);
        // Map data rows: each row is an array of values in same order as headers
        const dataRows = rows.map((row: any) => 
          section.columns.map((col: any) => row[col.name] || '')
        );
        // Use aoa_to_sheet for explicit control: [headers, row1, row2, ...]
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      } else {
        // Empty table - just headers
        const headers = section.columns.map((c: any) => c.label);
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    } else if (section.type === 'complex') {
      // For complex types, export each structure separately
      section.structure.forEach((struct, idx) => {
        const structName = struct.title || `${section.section}_${idx + 1}`;
        const complexSheetName = sanitizeSheetName(structName, usedNames);
        const structData = sectionData[struct.title] || [];
        
        if (structData.length > 0) {
          // Create headers array
          const headers = struct.columns.map((c: any) => c.label);
          // Map data rows: each row is an array of values in same order as headers
          const dataRows = structData.map((row: any) => 
            struct.columns.map((col: any) => row[col.name] || '')
          );
          // Use aoa_to_sheet for explicit control: [headers, row1, row2, ...]
          const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
          XLSX.utils.book_append_sheet(workbook, worksheet, complexSheetName);
        } else {
          const headers = struct.columns.map((c: any) => c.label);
          const worksheet = XLSX.utils.aoa_to_sheet([headers]);
          XLSX.utils.book_append_sheet(workbook, worksheet, complexSheetName);
        }
      });
    }
  });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const fileName = `Onter_Care_${countryCode}_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
