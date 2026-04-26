import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FormSection, SimpleSection, TableSection, ComplexSection } from '../constants/types';
import { publicAsset } from './paths';

/**
 * Shared PDF utility constants and functions
 */

export const PDF_CONFIG = {
  LOGO_PATH: publicAsset('logo.png'),
  PAGE_MARGIN: 10,
  LOGO_WIDTH: 40,
  THEME_COLOR: [37, 99, 235] as [number, number, number],
  HEADER_TEXT_COLOR: [255, 255, 255] as [number, number, number],
  FONT_SIZE: 9,
  CELL_PADDING: 3,
  TABLE_THEME: 'grid' as const,
  HEADER_FONT_STYLE: 'bold' as const,
  FONT_FAMILY: 'helvetica' as const, // Note: Custom fonts require addFont() setup
  FONT_BOLD: 'bold' as const,
  FONT_NORMAL: 'normal' as const,
} as const;

/**
 * Add section header to the page
 */
async function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export async function addSectionHeader(
  doc: jsPDF,
  section: FormSection,
  yPosition: number
): Promise<number> {
  // Add section heading on the left
  doc.setFontSize(16);
  doc.setFont(PDF_CONFIG.FONT_FAMILY, PDF_CONFIG.FONT_BOLD);
  doc.text(section.section, PDF_CONFIG.PAGE_MARGIN, yPosition);
  
  // Add logo on the right at the same Y position
  try {
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoX = pageWidth - PDF_CONFIG.LOGO_WIDTH - PDF_CONFIG.PAGE_MARGIN;
    const { width: imgWidth, height: imgHeight } = await loadImageDimensions(PDF_CONFIG.LOGO_PATH);
    const logoHeight = (PDF_CONFIG.LOGO_WIDTH * imgHeight) / imgWidth;
    const logoY = yPosition - logoHeight + 2; // Align with text baseline
    
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = PDF_CONFIG.LOGO_PATH;
    doc.addImage(
      logoImg,
      'PNG',
      logoX,
      logoY,
      PDF_CONFIG.LOGO_WIDTH,
      logoHeight
    );
  } catch (error) {
    console.warn('Failed to add logo to section header:', error);
    // Continue without logo if it fails
  }
  
  yPosition += 5; // Reduced gap
  
  return yPosition;
}

/**
 * Generate PDF section for simple field layout
 * @param isTemplate - If true, generates empty template; if false, fills with data
 */
export function generateSimplePDFSection(
  doc: jsPDF,
  section: SimpleSection,
  yPosition: number,
  data?: Record<string, any>
): void {
  const tableData = section.fields.map(field => [
    field.label,
    data?.[field.name] || ''
  ]);
  
  // Calculate equal width for 2 columns (50% each)
  const pageWidth = doc.internal.pageSize.getWidth();
  const availableWidth = pageWidth - (2 * PDF_CONFIG.PAGE_MARGIN);
  const columnWidth = availableWidth / 2;
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Field', 'Value']],
    body: tableData,
    theme: PDF_CONFIG.TABLE_THEME,
    headStyles: {
      fillColor: PDF_CONFIG.THEME_COLOR,
      textColor: PDF_CONFIG.HEADER_TEXT_COLOR,
      fontStyle: PDF_CONFIG.HEADER_FONT_STYLE
    },
    columnStyles: {
      0: { cellWidth: columnWidth },
      1: { cellWidth: columnWidth }
    },
    margin: { left: PDF_CONFIG.PAGE_MARGIN, right: PDF_CONFIG.PAGE_MARGIN },
    styles: {
      fontSize: PDF_CONFIG.FONT_SIZE,
      cellPadding: PDF_CONFIG.CELL_PADDING,
      lineColor: PDF_CONFIG.THEME_COLOR
    }
  });
}

/**
 * Generate PDF section for table layout
 * @param isTemplate - If true, generates empty template; if false, fills with data
 */
export function generateTablePDFSection(
  doc: jsPDF,
  section: TableSection,
  yPosition: number,
  data?: any[]
): void {
  const headers = section.columns.map(col => col.label);
  const maxRows = section.maxRows || 10;
  const minRows = section.minRows || 1;
  
  let rows = data || [];
  
  // If no data or generating template, create empty rows based on maxRows
  if (rows.length === 0) {
    const emptyRowCount = Math.max(maxRows, minRows);
    rows = Array(emptyRowCount).fill(null).map(() => 
      section.columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {})
    );
  } else if (rows.length < maxRows) {
    // Add empty rows to reach maxRows when data is provided but incomplete
    const emptyRowsNeeded = maxRows - rows.length;
    const emptyRows = Array(emptyRowsNeeded).fill(null).map(() => 
      section.columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {})
    );
    rows = [...rows, ...emptyRows];
  }
  
  const tableData = rows.map(row => 
    section.columns.map(col => row[col.name] || '')
  );
  
  // Calculate equal width for all columns
  const pageWidth = doc.internal.pageSize.getWidth();
  const availableWidth = pageWidth - (2 * PDF_CONFIG.PAGE_MARGIN);
  const columnWidth = availableWidth / section.columns.length;
  
  // Create column styles with equal widths
  const columnStyles = section.columns.reduce((acc, _, idx) => {
    acc[idx] = { cellWidth: columnWidth };
    return acc;
  }, {} as Record<number, { cellWidth: number }>);
  
  autoTable(doc, {
    startY: yPosition,
    head: [headers],
    body: tableData,
    theme: PDF_CONFIG.TABLE_THEME,
    headStyles: {
      fillColor: PDF_CONFIG.THEME_COLOR,
      textColor: PDF_CONFIG.HEADER_TEXT_COLOR,
      fontStyle: PDF_CONFIG.HEADER_FONT_STYLE
    },
    columnStyles,
    margin: { left: PDF_CONFIG.PAGE_MARGIN, right: PDF_CONFIG.PAGE_MARGIN },
    styles: {
      fontSize: PDF_CONFIG.FONT_SIZE,
      cellPadding: PDF_CONFIG.CELL_PADDING,
      lineColor: PDF_CONFIG.THEME_COLOR
    }
  });
}

/**
 * Generate PDF section for complex layout
 * @param isTemplate - If true, generates empty template; if false, fills with data
 */
export function generateComplexPDFSection(
  doc: jsPDF,
  section: ComplexSection,
  startY: number,
  data?: Record<string, any[]>
): void {
  let yPosition = startY;
  
  section.structure.forEach((struct, idx) => {
    // Add sub-section title
    doc.setFontSize(12);
    doc.setFont(PDF_CONFIG.FONT_FAMILY, PDF_CONFIG.FONT_BOLD);
    doc.text(struct.title, PDF_CONFIG.PAGE_MARGIN, yPosition);
    yPosition += 8;
    
    const headers = struct.columns.map(col => col.label);
    const maxRows = struct.maxRows || 10;
    const minRows = struct.minRows || 1;
    
    // Get data for this subsection
    let rows = data?.[struct.title] || [];
    
    // If no data, create empty rows based on maxRows
    if (rows.length === 0) {
      const emptyRowCount = Math.max(maxRows, minRows);
      rows = Array(emptyRowCount).fill(null).map(() => 
        struct.columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {})
      );
    } else if (rows.length < maxRows) {
      // Add empty rows to reach maxRows
      const emptyRowsNeeded = maxRows - rows.length;
      const emptyRows = Array(emptyRowsNeeded).fill(null).map(() => 
        struct.columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {})
      );
      rows = [...rows, ...emptyRows];
    }
    
    const tableData = rows.map(row => 
      struct.columns.map(col => row[col.name] || '')
    );
    
    // Calculate equal width for all columns
    const pageWidth = doc.internal.pageSize.getWidth();
    const availableWidth = pageWidth - (2 * PDF_CONFIG.PAGE_MARGIN);
    const columnWidth = availableWidth / struct.columns.length;
    
    // Create column styles with equal widths
    const columnStyles = struct.columns.reduce((acc, _, idx) => {
      acc[idx] = { cellWidth: columnWidth };
      return acc;
    }, {} as Record<number, { cellWidth: number }>);
    
    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: tableData,
      theme: PDF_CONFIG.TABLE_THEME,
      headStyles: {
        fillColor: PDF_CONFIG.THEME_COLOR,
        textColor: PDF_CONFIG.HEADER_TEXT_COLOR,
        fontStyle: PDF_CONFIG.HEADER_FONT_STYLE
      },
      columnStyles,
      margin: { left: PDF_CONFIG.PAGE_MARGIN, right: PDF_CONFIG.PAGE_MARGIN },
      styles: {
        fontSize: PDF_CONFIG.FONT_SIZE,
        cellPadding: PDF_CONFIG.CELL_PADDING,
        lineColor: PDF_CONFIG.THEME_COLOR
      }
    });
    
    // @ts-ignore - autoTable adds finalY to doc
    yPosition = doc.lastAutoTable.finalY + 10;
    
    // Add new page if not the last subsection and space is running out
    if (idx < section.structure.length - 1 && yPosition > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      yPosition = PDF_CONFIG.PAGE_MARGIN + 10;
    }
  });
}

/**
 * Add page number footer to PDF
 */
export function addPageNumber(doc: jsPDF, pageNum: number, totalPages: number): void {
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Page ${pageNum} of ${totalPages}`,
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);
}
