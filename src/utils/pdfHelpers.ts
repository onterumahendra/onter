/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FormSection, SimpleSection, TableSection, ComplexSection } from '../constants/types';
import { publicAsset } from './paths';
import { loadPdfImage, rasterizePdfImage, resolveCountryCode } from './pdfImageHelpers';
import { brand } from '../branding';
import { hexToRgb } from '../branding/colors';
import i18n from '../i18n';

/**
 * Shared PDF utility constants and functions
 */

// Type for row data in PDFs
interface PDFRowData {
  [key: string]: string | number | boolean | null;
}

export const PDF_CONFIG = {
  LOGO_PATH: publicAsset(brand.logoAsset),
  PAGE_MARGIN: 10,
  LOGO_HEIGHT: 7, // ~20px in PDF units (mm)
  THEME_COLOR: hexToRgb(brand.primaryPalette[5]),
  HEADER_TEXT_COLOR: [255, 255, 255] as [number, number, number],
  FONT_SIZE: 9,
  CELL_PADDING: 3,
  TABLE_THEME: 'grid' as const,
  HEADER_FONT_STYLE: 'bold' as const,
  FONT_FAMILY: brand.rtlPdfFont?.family ?? 'helvetica',
  FONT_BOLD: 'bold' as const,
  FONT_NORMAL: 'normal' as const,
} as const;

export async function addSectionHeader(
  doc: jsPDF,
  section: FormSection,
  yPosition: number,
  country?: string | null
): Promise<number> {
  const isRtl = doc.getR2L();
  const pageWidth = doc.internal.pageSize.getWidth();
  const headingX = isRtl ? pageWidth - PDF_CONFIG.PAGE_MARGIN : PDF_CONFIG.PAGE_MARGIN;
  doc.setFontSize(16);
  doc.setFont(PDF_CONFIG.FONT_FAMILY, PDF_CONFIG.FONT_BOLD);
  doc.text(section.section, headingX, yPosition, { align: isRtl ? 'right' : 'left' });
  
  // Place the brand mark opposite the heading in the reading direction.
  try {
    const logoImg = await loadPdfImage(PDF_CONFIG.LOGO_PATH);
    const imgWidth = logoImg.naturalWidth;
    const imgHeight = logoImg.naturalHeight;
    const logoWidth = (PDF_CONFIG.LOGO_HEIGHT * imgWidth) / imgHeight;
    const countryCode = resolveCountryCode(country);
    const flagPath = countryCode ? publicAsset(`flags/${countryCode}.svg`) : null;
    const flagImg = flagPath ? await loadPdfImage(flagPath).catch(error => {
      console.warn('Failed to add country flag to section header:', error);
      return null;
    }) : null;
    const flagHeight = flagImg ? PDF_CONFIG.LOGO_HEIGHT : 0;
    const flagWidth = flagImg
      ? (flagHeight * flagImg.naturalWidth) / flagImg.naturalHeight
      : 0;
    const gap = flagImg ? 5 : 0;
    const separatorWidth = flagImg ? 3 : 0;
    const totalWidth = logoWidth + gap + separatorWidth + flagWidth;
    const logoX = isRtl
      ? PDF_CONFIG.PAGE_MARGIN
      : pageWidth - totalWidth - PDF_CONFIG.PAGE_MARGIN;
    const logoY = yPosition - PDF_CONFIG.LOGO_HEIGHT + 2; // Align with text baseline
    
    doc.addImage(
      logoImg,
      'PNG',
      logoX,
      logoY,
      logoWidth,
      PDF_CONFIG.LOGO_HEIGHT
    );

    if (flagImg && flagWidth > 0) {
      const separatorX = logoX + logoWidth + gap / 2;
      const groupHeight = Math.max(PDF_CONFIG.LOGO_HEIGHT, flagHeight);
      const separatorHeight = Math.min(PDF_CONFIG.LOGO_HEIGHT, flagHeight) * 0.6;
      const separatorY = logoY + (groupHeight - separatorHeight) / 2;
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.2);
      doc.line(separatorX, separatorY, separatorX, separatorY + separatorHeight);

      const flagCanvas = rasterizePdfImage(flagImg);
      doc.addImage(
        flagCanvas,
        'PNG',
        logoX + logoWidth + gap + separatorWidth,
        logoY,
        flagWidth,
        flagHeight
      );
    }
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
  const isRtl = doc.getR2L();
  
  // Calculate equal width for 2 columns (50% each)
  const tablePageWidth = doc.internal.pageSize.getWidth();
  const availableWidth = tablePageWidth - (2 * PDF_CONFIG.PAGE_MARGIN);
  const columnWidth = availableWidth / 2;
  
  autoTable(doc, {
    startY: yPosition,
    head: [[i18n.t(isRtl ? 'pdf.value' : 'pdf.field'), i18n.t(isRtl ? 'pdf.field' : 'pdf.value')]],
    body: isRtl ? tableData.map((row) => row.slice().reverse()) : tableData,
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
      lineColor: PDF_CONFIG.THEME_COLOR,
      halign: isRtl ? 'right' : 'left',
    }
  });
}

/**
 * Generate PDF section for table layout with Smart Row Display
 * Template: Shows all maxRows (full capacity)
 * Data Export: Shows actual data + 2 buffer rows (compact)
 */
export function generateTablePDFSection(
  doc: jsPDF,
  section: TableSection,
  yPosition: number,
  data?: PDFRowData[]
): void {
  const isRtl = doc.getR2L();
  const columns = isRtl ? [...section.columns].reverse() : section.columns;
  const headers = columns.map(col => col.label);
  const maxRows = section.maxRows || 10;
  const minRows = section.minRows || 1;
  
  let rows = data || [];
  const isTemplate = !data || rows.length === 0;
  
  // Smart Row Display Logic
  if (isTemplate) {
    // TEMPLATE: Show all maxRows for full visibility
    const emptyRowCount = Math.max(maxRows, minRows);
    rows = Array(emptyRowCount).fill(null).map(() => 
      section.columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {})
    );
  } else {
    // DATA EXPORT: Show actual data + 2 buffer rows (compact view)
    const bufferRows = 2;
    const targetRows = Math.min(rows.length + bufferRows, maxRows);
    
    if (rows.length < targetRows) {
      const emptyRowsNeeded = targetRows - rows.length;
      const emptyRows = Array(emptyRowsNeeded).fill(null).map(() => 
        section.columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {})
      );
      rows = [...rows, ...emptyRows];
    }
  }
  
  const tableData = rows.map(row => 
    columns.map(col => row[col.name] || '')
  );
  
  // Calculate equal width for all columns
  const tablePageWidth = doc.internal.pageSize.getWidth();
  const availableWidth = tablePageWidth - (2 * PDF_CONFIG.PAGE_MARGIN);
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
      lineColor: PDF_CONFIG.THEME_COLOR,
      halign: isRtl ? 'right' : 'left',
    }
  });
}

/**
 * Generate PDF section for complex layout with Smart Row Display
 * Template: Shows all maxRows (full capacity)
 * Data Export: Shows actual data + 2 buffer rows (compact)
 */
export function generateComplexPDFSection(
  doc: jsPDF,
  section: ComplexSection,
  startY: number,
  data?: Record<string, PDFRowData[]>
): void {
  let yPosition = startY;
  
  section.structure.forEach((struct, idx) => {
    // Add sub-section title
    doc.setFontSize(12);
    doc.setFont(PDF_CONFIG.FONT_FAMILY, PDF_CONFIG.FONT_BOLD);
    const isRtl = doc.getR2L();
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleX = isRtl ? pageWidth - PDF_CONFIG.PAGE_MARGIN : PDF_CONFIG.PAGE_MARGIN;
    doc.text(struct.title, titleX, yPosition, { align: isRtl ? 'right' : 'left' });
    yPosition += 8;
    
    const columns = isRtl ? [...struct.columns].reverse() : struct.columns;
    const headers = columns.map(col => col.label);
    const maxRows = struct.maxRows || 10;
    const minRows = struct.minRows || 1;
    
    // Get data for this subsection
    let rows = data?.[struct.title] || [];
    const isTemplate = !data || rows.length === 0;
    
    // Smart Row Display Logic
    if (isTemplate) {
      // TEMPLATE: Show all maxRows for full visibility
      const emptyRowCount = Math.max(maxRows, minRows);
      rows = Array(emptyRowCount).fill(null).map(() => 
        struct.columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {})
      );
    } else {
      // DATA EXPORT: Show actual data + 2 buffer rows (compact view)
      const bufferRows = 2;
      const targetRows = Math.min(rows.length + bufferRows, maxRows);
      
      if (rows.length < targetRows) {
        const emptyRowsNeeded = targetRows - rows.length;
        const emptyRows = Array(emptyRowsNeeded).fill(null).map(() => 
          struct.columns.reduce((acc, col) => ({ ...acc, [col.name]: '' }), {})
        );
        rows = [...rows, ...emptyRows];
      }
    }
    
    const tableData = rows.map(row => 
      columns.map(col => row[col.name] || '')
    );
    
    // Calculate equal width for all columns
    const tablePageWidth = doc.internal.pageSize.getWidth();
    const availableWidth = tablePageWidth - (2 * PDF_CONFIG.PAGE_MARGIN);
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
        lineColor: PDF_CONFIG.THEME_COLOR,
        halign: isRtl ? 'right' : 'left',
      }
    });
    
    // @ts-expect-error - autoTable adds finalY to doc at runtime
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
    i18n.t('pdf.page', { current: pageNum, total: totalPages }),
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);
}
