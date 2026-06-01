import { jsPDF } from 'jspdf';
import i18n from '../i18n';
import type { CountryFormConfig, FormSection } from '../constants/types';
import {
    addCoverPage,
    addSectionHeader,
    addBulletList,
    addInfoBox,
    addSubsection,
    addPageFooter,
    GUIDE_CONFIG
} from '../utils/accessGuidePdfHelpers';

/**
 * Access Guide Service
 * Generates comprehensive emergency access guide PDF
 */

interface AccessGuideOptions {
    formData?: Record<string, any>;
    countryConfig: CountryFormConfig;
    includeData?: boolean;
}

/**
 * Sanitize text for PDF output to prevent injection and rendering issues
 */
function sanitizeForPdf(text: string): string {
    return String(text)
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .replace(/[<>]/g, '') // Remove angle brackets
        .trim()
        .substring(0, 500); // Limit length to prevent overflow
}

/**
 * Extract emergency contacts from form data
 */
function extractEmergencyContacts(formData: Record<string, any>): string[] {
    const contacts: string[] = [];

    // Look for emergency contact sections
    Object.entries(formData).forEach(([section, data]) => {
        if (!data) return;

        // Handle table sections (data structure: { rows: [...] })
        if (data.rows && Array.isArray(data.rows)) {
            data.rows.forEach((row: any, index: number) => {
                if (row && typeof row === 'object') {
                    // Check if this looks like an emergency contact
                    const hasContactInfo = Object.keys(row).some(key => 
                        key.toLowerCase().includes('name') || 
                        key.toLowerCase().includes('phone') ||
                        key.toLowerCase().includes('contact')
                    );
                    
                    if (hasContactInfo) {
                        const contactParts: string[] = [];
                        Object.entries(row).forEach(([key, value]) => {
                            if (value && String(value).trim()) {
                                const sanitizedKey = sanitizeForPdf(String(key));
                                const sanitizedValue = sanitizeForPdf(String(value));
                                contactParts.push(`${sanitizedKey}: ${sanitizedValue}`);
                            }
                        });
                        if (contactParts.length > 0) {
                            const sanitizedSection = sanitizeForPdf(String(section));
                            contacts.push(`${sanitizedSection} #${index + 1} - ${contactParts.join(', ')}`);
                        }
                    }
                }
            });
        }

        // Handle simple sections (direct key-value pairs)
        if (!data.rows && typeof data === 'object' && !Array.isArray(data)) {
            Object.entries(data).forEach(([key, value]) => {
                if (key.toLowerCase().includes('emergency') ||
                    key.toLowerCase().includes('contact')) {
                    if (value && String(value).trim()) {
                        const sanitizedSection = sanitizeForPdf(String(section));
                        const sanitizedKey = sanitizeForPdf(String(key));
                        const sanitizedValue = sanitizeForPdf(String(value));
                        contacts.push(`${sanitizedSection} - ${sanitizedKey}: ${sanitizedValue}`);
                    }
                }
            });
        }
    });

    return contacts.length > 0 ? contacts : [i18n.t('accessGuide.defaults.noContactsFound')];
}

/**
 * Generate Quick Start section
 */
function addQuickStartSection(doc: jsPDF, countryConfig: CountryFormConfig): number {
    let y = GUIDE_CONFIG.PAGE_MARGIN + 10;

    y = addSectionHeader(doc, i18n.t('accessGuide.sectionHeaders.quickStart'), y);

    const quickStart = countryConfig.accessGuide?.quickStart || i18n.t('accessGuide.defaults.quickStart', { returnObjects: true }) as string[];

    y = addInfoBox(doc, i18n.t('accessGuide.boxTitles.criticalFirstMinutes'), quickStart, y, 'error');

    return y + 5;
}

/**
 * Generate Emergency Services section
 */
function addEmergencyServicesSection(doc: jsPDF, countryConfig: CountryFormConfig): number {
    let y = addSectionHeader(doc, i18n.t('accessGuide.sectionHeaders.emergencyServices'), GUIDE_CONFIG.PAGE_MARGIN + 10);

    const services = countryConfig.accessGuide?.emergencyServices || {
        medical: '911',
        police: '911',
        fire: '911'
    };

    const serviceList = Object.entries(services).map(([service, number]) =>
        `${service.charAt(0).toUpperCase() + service.slice(1)}: ${number}`
    );

    y = addInfoBox(doc, i18n.t('accessGuide.boxTitles.emergencyNumbers', { country: countryConfig.countryName }), serviceList, y, 'warning');

    return y + 5;
}

/**
 * Generate File Structure section
 */
function addFileStructureSection(doc: jsPDF, countryConfig: CountryFormConfig): number {
    let y = addSectionHeader(doc, i18n.t('accessGuide.sectionHeaders.fileStructure'), GUIDE_CONFIG.PAGE_MARGIN + 10);

    const fileInfo = countryConfig.accessGuide?.generalGuidance?.fileStructure || i18n.t('accessGuide.defaults.fileStructure', { returnObjects: true }) as string[];

    y = addSubsection(doc, i18n.t('accessGuide.subsections.whatsInZip'),
        i18n.t('accessGuide.descriptions.zipFileContents'), y);
    y = addBulletList(doc, fileInfo, y);
    y += 5;

    const accessInfo = countryConfig.accessGuide?.generalGuidance?.dataAccess || i18n.t('accessGuide.defaults.dataAccess', { returnObjects: true }) as string[];

    y = addSubsection(doc, i18n.t('accessGuide.subsections.howToAccess'),
        i18n.t('accessGuide.descriptions.accessSteps'), y);
    y = addBulletList(doc, accessInfo, y);

    return y + 10;
}

/**
 * Generate Section Guidance
 */
function addSectionGuidancePages(doc: jsPDF, countryConfig: CountryFormConfig): void {
    doc.addPage();
    let y = addSectionHeader(doc, i18n.t('accessGuide.sectionHeaders.sectionGuide'), GUIDE_CONFIG.PAGE_MARGIN + 10);

    y = addSubsection(doc, i18n.t('accessGuide.subsections.howToUseEachSection'),
        i18n.t('accessGuide.descriptions.sectionPurpose'), y);
    y += 5;

    // Iterate through form sections
    countryConfig.formSections.forEach((section: FormSection) => {
        const guidance = countryConfig.accessGuide?.sectionGuidance?.[section.section];

        if (!guidance) {
            // Default guidance if not configured
            if (y > doc.internal.pageSize.getHeight() - 60) {
                doc.addPage();
                y = GUIDE_CONFIG.PAGE_MARGIN + 10;
            }

            y = addSubsection(doc, `${section.section}`,
                section.description || i18n.t('accessGuide.defaults.sectionDescription'), y);
            y = addBulletList(doc, i18n.t('accessGuide.defaults.sectionBullets', { returnObjects: true }) as string[], y);
            y += 10;
            return;
        }

        // Check if we need a new page
        if (y > doc.internal.pageSize.getHeight() - 80) {
            doc.addPage();
            y = GUIDE_CONFIG.PAGE_MARGIN + 10;
        }

        // Add section with guidance
        y = addSubsection(doc, section.section, guidance.description, y);

        // Who needs this
        if (guidance.usefulFor && guidance.usefulFor.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
            doc.text(i18n.t('accessGuide.labels.whoNeedsThis'), GUIDE_CONFIG.PAGE_MARGIN + 5, y);
            y += 5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            y = addBulletList(doc, guidance.usefulFor, y, '-');
            y += 3;
        }

        // First actions
        if (guidance.firstActions && guidance.firstActions.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(i18n.t('accessGuide.labels.firstActions'), GUIDE_CONFIG.PAGE_MARGIN + 5, y);
            y += 5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            y = addBulletList(doc, guidance.firstActions, y, '-');
            y += 3;
        }

        // Critical fields
        if (guidance.criticalFields && guidance.criticalFields.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(i18n.t('accessGuide.labels.criticalFields'), GUIDE_CONFIG.PAGE_MARGIN + 5, y);
            y += 5;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            y = addBulletList(doc, guidance.criticalFields, y, '-');
            y += 3;
        }

        y += 10;
    });
}

/**
 * Generate Emergency Contacts section from actual data
 */
function addEmergencyContactsSection(doc: jsPDF, formData: Record<string, any>): void {
    doc.addPage();
    let y = addSectionHeader(doc, i18n.t('accessGuide.sectionHeaders.emergencyContacts'), GUIDE_CONFIG.PAGE_MARGIN + 10);

    const contacts = extractEmergencyContacts(formData);

    y = addInfoBox(doc, i18n.t('accessGuide.boxTitles.contactsFromData'), contacts, y, 'info');

    y += 5;
    y = addSubsection(doc, i18n.t('accessGuide.subsections.importantNotes'),
        i18n.t('accessGuide.descriptions.verifyContacts'), y);
}

/**
 * Generate Legal & Security section
 */
function addLegalSecuritySection(doc: jsPDF, countryConfig: CountryFormConfig): void {
    doc.addPage();
    let y = addSectionHeader(doc, i18n.t('accessGuide.sectionHeaders.legalSecurity'), GUIDE_CONFIG.PAGE_MARGIN + 10);

    const securityTips = countryConfig.accessGuide?.generalGuidance?.securityTips || i18n.t('accessGuide.defaults.securityTips', { returnObjects: true }) as string[];

    y = addSubsection(doc, i18n.t('accessGuide.subsections.securityBestPractices'),
        i18n.t('accessGuide.descriptions.securityGuidelines'), y);
    y = addBulletList(doc, securityTips, y);
    y += 10;

    const legalNotes = countryConfig.accessGuide?.legalNotes || i18n.t('accessGuide.defaults.legalNotes', { returnObjects: true }) as string[];

    y = addSubsection(doc, i18n.t('accessGuide.subsections.legalConsiderations', { country: countryConfig.countryName }),
        i18n.t('accessGuide.descriptions.legalNotes'), y);
    y = addBulletList(doc, legalNotes, y);

    y += 10;
    y = addInfoBox(doc, i18n.t('accessGuide.boxTitles.disclaimer'),
        i18n.t('accessGuide.defaults.disclaimer', { returnObjects: true }) as string[], y, 'warning');
}

/**
 * Generate complete Access Guide PDF
 */
export async function generateAccessGuidePDF(options: AccessGuideOptions): Promise<Blob> {
    const { formData, countryConfig, includeData = true } = options;

    // Validate inputs
    if (!countryConfig) {
        throw new Error('Country configuration is required');
    }

    // Check if access guide is enabled
    if (!countryConfig.accessGuide?.enabled) {
        throw new Error('Access guide is not enabled for this country');
    }

    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // 1. Cover Page
        await addCoverPage(doc, countryConfig.countryName);

        // 2. Quick Start (Page 2)
        doc.addPage();
        addQuickStartSection(doc, countryConfig);

        // 3. Emergency Services (Page 3)
        doc.addPage();
        addEmergencyServicesSection(doc, countryConfig);

        // 4. File Structure & Access (Page 4)
        doc.addPage();
        addFileStructureSection(doc, countryConfig);

        // 5. Section-by-Section Guidance (Multiple pages)
        addSectionGuidancePages(doc, countryConfig);

        // 6. Emergency Contacts from Data (if data provided)
        if (includeData && formData && Object.keys(formData).length > 0) {
            addEmergencyContactsSection(doc, formData);
        }

        // 7. Legal & Security (Last pages)
        addLegalSecuritySection(doc, countryConfig);

        // Add page numbers to all pages except cover
        const totalPages = doc.getNumberOfPages();
        for (let i = 2; i <= totalPages; i++) {
            doc.setPage(i);
            addPageFooter(doc, i - 1); // Exclude cover from numbering
        }

        // Generate blob
        return doc.output('blob');
    } catch (error) {
        console.error('Error generating access guide PDF:', error);
        throw new Error(`Failed to generate access guide: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Download Access Guide PDF
 */
export async function downloadAccessGuide(
    formData: Record<string, any>,
    countryConfig: CountryFormConfig
): Promise<void> {
    const blob = await generateAccessGuidePDF({
        formData,
        countryConfig,
        includeData: true
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Onter_Emergency_Access_Guide_${countryConfig.countryCode}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Delay URL cleanup to ensure download completes
    setTimeout(() => URL.revokeObjectURL(url), 100);
}
