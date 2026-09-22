import { jsPDF } from 'jspdf';
import { publicAsset } from './paths';
import { loadPdfImage, rasterizePdfImage, resolveCountryCode } from './pdfImageHelpers';

/**
 * Access Guide PDF Helper Functions
 * Utilities for generating the Emergency Access Guide PDF
 */

export const GUIDE_CONFIG = {
    LOGO_PATH: publicAsset('logo.png'),
    PAGE_MARGIN: 15,
    LOGO_HEIGHT: 15,
    THEME_COLOR: [37, 99, 235] as [number, number, number],
    ACCENT_COLOR: [239, 68, 68] as [number, number, number], // Red for urgent items
    SUCCESS_COLOR: [34, 197, 94] as [number, number, number], // Green for success
    WARNING_COLOR: [234, 179, 8] as [number, number, number], // Yellow for warnings
    TEXT_PRIMARY: [30, 41, 59] as [number, number, number], // slate-800
    TEXT_SECONDARY: [100, 116, 139] as [number, number, number], // slate-500
    HEADER_BG: [241, 245, 249] as [number, number, number], // slate-100
} as const;

/**
 * Load an image with timeout and return only after it is ready for jsPDF.
 */
/**
 * Add a creative cover page
 */
export async function addCoverPage(doc: jsPDF, country: string): Promise<void> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add subtle background gradient effect (simulated with rectangles)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Add decorative top bar
    doc.setFillColor(...GUIDE_CONFIG.THEME_COLOR);
    doc.rect(0, 0, pageWidth, 8, 'F');

    // Center content vertically
    let yPos = pageHeight / 2 - 40;

    // Add logo
    try {
        const logoImg = await loadPdfImage(GUIDE_CONFIG.LOGO_PATH);
        const imgWidth = logoImg.naturalWidth;
        const imgHeight = logoImg.naturalHeight;
        const logoHeight = 25;
        const logoWidth = (logoHeight * imgWidth) / imgHeight;
        const countryCode = resolveCountryCode(country);
        const flagPath = countryCode ? publicAsset(`flags/${countryCode}.svg`) : null;
        const flagImg = flagPath ? await loadPdfImage(flagPath).catch(error => {
            console.warn('Failed to add country flag to cover page:', error);
            return null;
        }) : null;
        const flagHeight = flagImg ? 25 : 0;
        const flagWidth = flagImg && flagImg.naturalHeight > 0
            ? (flagHeight * flagImg.naturalWidth) / flagImg.naturalHeight
            : 0;
        const gap = flagImg ? 8 : 0;
        const logoX = (pageWidth - logoWidth - gap - flagWidth) / 2;

        doc.addImage(logoImg, 'PNG', logoX, yPos, logoWidth, logoHeight);
        if (flagImg && flagWidth > 0) {
            const separatorX = logoX + logoWidth + gap / 2;
            const groupHeight = Math.max(logoHeight, flagHeight);
            const separatorHeight = Math.min(logoHeight, flagHeight) * 0.6;
            const separatorY = yPos + (groupHeight - separatorHeight) / 2;
            doc.setDrawColor(...GUIDE_CONFIG.TEXT_SECONDARY);
            doc.setLineWidth(0.3);
            doc.line(separatorX, separatorY, separatorX, separatorY + separatorHeight);

            const flagCanvas = rasterizePdfImage(flagImg);
            doc.addImage(flagCanvas, 'PNG', logoX + logoWidth + gap, yPos, flagWidth, flagHeight);
        }
        yPos += logoHeight + 20;
    } catch (error) {
        console.warn('Failed to add logo to cover page:', error);
        yPos += 10;
    }

    // Main title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(...GUIDE_CONFIG.THEME_COLOR);
    doc.text('Emergency Access Guide', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Subtitle
    doc.setFontSize(16);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_SECONDARY);
    doc.text(`How to Use Your ${country} Emergency Kit`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 25;

    // Important notice box
    const boxWidth = pageWidth - 60;
    const boxX = 30;
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(...GUIDE_CONFIG.ACCENT_COLOR);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX, yPos, boxWidth, 30, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GUIDE_CONFIG.ACCENT_COLOR);
    doc.text('KEEP THIS GUIDE SECURE', pageWidth / 2, yPos + 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
    doc.text('This document contains sensitive information.', pageWidth / 2, yPos + 17, { align: 'center' });
    doc.text('Share only with trusted family members and legal representatives.', pageWidth / 2, yPos + 23, { align: 'center' });

    yPos += 45;

    // Generated date
    doc.setFontSize(10);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_SECONDARY);
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`Generated: ${currentDate}`, pageWidth / 2, yPos, { align: 'center' });

    // Footer note
    doc.setFontSize(8);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_SECONDARY);
    doc.text('In case of emergency, start with the "Quick Start" section on the next page.', pageWidth / 2, pageHeight - 20, { align: 'center' });
}

/**
 * Add section header
 */
export function addSectionHeader(
    doc: jsPDF,
    title: string,
    yPosition: number
): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Background bar
    doc.setFillColor(...GUIDE_CONFIG.HEADER_BG);
    doc.rect(GUIDE_CONFIG.PAGE_MARGIN, yPosition - 5, pageWidth - 2 * GUIDE_CONFIG.PAGE_MARGIN, 12, 'F');

    // Title only (no icon)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
    doc.text(title, GUIDE_CONFIG.PAGE_MARGIN + 3, yPosition + 3);

    return yPosition + 15;
}

/**
 * Add bullet points
 */
export function addBulletList(
    doc: jsPDF,
    items: string[],
    yPosition: number,
    icon: string = '-'
): number {
    let y = yPosition;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 2 * GUIDE_CONFIG.PAGE_MARGIN - 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);

    items.forEach(item => {
        // Check if we need a new page
        if (y > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            y = GUIDE_CONFIG.PAGE_MARGIN + 10;
        }

        // Add bullet icon
        doc.text(icon, GUIDE_CONFIG.PAGE_MARGIN + 3, y);

        // Add text with word wrap
        const lines = doc.splitTextToSize(item, maxWidth);
        doc.text(lines, GUIDE_CONFIG.PAGE_MARGIN + 10, y);
        y += lines.length * 5 + 3;
    });

    return y;
}

/**
 * Add info box (highlighted information)
 */
export function addInfoBox(
    doc: jsPDF,
    title: string,
    content: string[],
    yPosition: number,
    type: 'info' | 'warning' | 'success' | 'error' = 'info'
): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const boxWidth = pageWidth - 2 * GUIDE_CONFIG.PAGE_MARGIN;
    const boxX = GUIDE_CONFIG.PAGE_MARGIN;

    // Determine colors based on type
    let bgColor: [number, number, number];
    let borderColor: [number, number, number];

    switch (type) {
        case 'warning':
            bgColor = [254, 252, 232]; // yellow-50
            borderColor = GUIDE_CONFIG.WARNING_COLOR;
            break;
        case 'error':
            bgColor = [254, 242, 242]; // red-50
            borderColor = GUIDE_CONFIG.ACCENT_COLOR;
            break;
        case 'success':
            bgColor = [240, 253, 244]; // green-50
            borderColor = GUIDE_CONFIG.SUCCESS_COLOR;
            break;
        default: // info
            bgColor = [239, 246, 255]; // blue-50
            borderColor = GUIDE_CONFIG.THEME_COLOR;
    }

    // Calculate box height
    const estimatedHeight = 10 + content.length * 6;

    // Check if we need a new page
    if (yPosition + estimatedHeight > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPosition = GUIDE_CONFIG.PAGE_MARGIN + 10;
    }

    // Draw box
    doc.setFillColor(...bgColor);
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX, yPosition, boxWidth, estimatedHeight, 2, 2, 'FD');

    // Add title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...borderColor);
    doc.text(title, boxX + 5, yPosition + 7);

    // Add content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);

    let contentY = yPosition + 13;
    content.forEach(line => {
        const lines = doc.splitTextToSize(line, boxWidth - 15);
        doc.text(lines, boxX + 7, contentY);
        contentY += lines.length * 4;
    });

    return yPosition + estimatedHeight + 8;
}

/**
 * Add subsection with description
 */
export function addSubsection(
    doc: jsPDF,
    title: string,
    description: string,
    yPosition: number
): number {
    let y = yPosition;

    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = GUIDE_CONFIG.PAGE_MARGIN + 10;
    }

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
    doc.text(title, GUIDE_CONFIG.PAGE_MARGIN + 3, y);
    y += 7;

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_SECONDARY);
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 2 * GUIDE_CONFIG.PAGE_MARGIN - 6;
    const lines = doc.splitTextToSize(description, maxWidth);
    doc.text(lines, GUIDE_CONFIG.PAGE_MARGIN + 3, y);
    y += lines.length * 4 + 5;

    return y;
}

/**
 * Add page footer with page numbers
 */
export function addPageFooter(doc: jsPDF, pageNum: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Footer line
    doc.setDrawColor(...GUIDE_CONFIG.TEXT_SECONDARY);
    doc.setLineWidth(0.1);
    doc.line(GUIDE_CONFIG.PAGE_MARGIN, pageHeight - 15, pageWidth - GUIDE_CONFIG.PAGE_MARGIN, pageHeight - 15);

    // Page number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_SECONDARY);
    doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Footer text
    doc.text('Emergency Access Guide - Keep Secure', GUIDE_CONFIG.PAGE_MARGIN, pageHeight - 10);
}
