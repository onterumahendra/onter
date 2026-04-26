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
 * PDF Service for generating form data as PDF
 * Each section appears on a separate page with logo on top right
 */
/**
 * Generate PDF from form data
 * @param formData - Form data object
 * @param countryCode - Country code for form configuration
 * @param completedSteps - Set of completed step indices
 * @param skippedSteps - Set of skipped step indices
 * @returns Blob of the generated PDF
 */
export async function generateFormPDF(
  formData: Record<string, any>,
  countryCode: string,
  _completedSteps: Set<number> = new Set(),
  skippedSteps: Set<number> = new Set()
): Promise<Blob> {
  try {
    // Dynamic import for jsPDF
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable'); // Load autotable plugin
    
    const sections = await getFormSections(countryCode);
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Remove the default first page, we'll add pages manually
    let isFirstPage = true;
    
    for (let index = 0; index < sections.length; index++) {
      const section = sections[index];
      const sectionData = formData[section.section];
      const isSkipped = skippedSteps.has(index);
      
      // Add new page for each section (except first)
      if (!isFirstPage) {
        doc.addPage();
      }
      isFirstPage = false;
      
      // Start content from top
      let yPosition = PDF_CONFIG.PAGE_MARGIN + 10;
      
      // Add section header (includes logo)
      yPosition = await addSectionHeader(doc, section, yPosition);
      
      // Add skipped indicator if section was skipped
      if (isSkipped) {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'italic');
        doc.text('(Section Skipped - Showing Empty Fields)', PDF_CONFIG.PAGE_MARGIN, yPosition);
        yPosition += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      }
      
      // Generate section content based on type
      switch (section.type) {
        case 'simple':
          generateSimplePDFSection(
            doc,
            section,
            yPosition,
            isSkipped ? undefined : (sectionData || {})
          );
          break;
          
        case 'table':
          generateTablePDFSection(
            doc,
            section,
            yPosition,
            isSkipped ? undefined : (sectionData?.rows || [])
          );
          break;
          
        case 'complex':
          generateComplexPDFSection(
            doc,
            section,
            yPosition,
            isSkipped ? undefined : (sectionData || {})
          );
          break;
      }
      
      // Add page number at bottom
      addPageNumber(doc, index + 1, sections.length);
    }
    
    // Return PDF as blob
    return doc.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

/**
 * Download PDF file
 */
export function downloadPDF(blob: Blob, countryCode: string): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `Onter_Care_${countryCode}_${timestamp}.pdf`;
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
