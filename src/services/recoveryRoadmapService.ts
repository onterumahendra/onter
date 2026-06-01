import { jsPDF } from 'jspdf';
import { addPageFooter, GUIDE_CONFIG } from '../utils/accessGuidePdfHelpers';
import type { CountryFormConfig } from '../constants/types';

/**
 * Recovery Roadmap PDF Service
 * Generates a phase-based family recovery guide PDF from the recoveryRoadmap config.
 *
 * Safe rendering rules enforced throughout:
 *  - NO Unicode symbols (no ✗ ✓ • — etc.) — Helvetica cannot render them
 *  - All text passes through safe() before rendering
 *  - Backgrounds/boxes drawn BEFORE text, never after
 *  - Dynamic row heights for all wrapped content
 */

const M = GUIDE_CONFIG.PAGE_MARGIN; // 15mm

const PHASE_COLORS: Record<string, [number, number, number]> = {
    CRITICAL: [220, 38, 38],
    HIGH:     [217, 119, 6],
    MEDIUM:   [37, 99, 235],
    LOW:      [34, 197, 94],
};

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Replace common Unicode punctuation with ASCII equivalents, then strip
 * any remaining non-ASCII. This prevents Helvetica from rendering garbage
 * AND avoids silent double-spaces where symbols were removed.
 */
function safe(text: unknown): string {
    return String(text ?? '')
        .replace(/\u2014|\u2013/g, ' - ')   // em-dash, en-dash
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\u20B9/g, 'Rs.')
        .replace(/[^\x20-\x7E]/g, '');       // strip remaining non-ASCII
}

function pW(doc: jsPDF): number { return doc.internal.pageSize.getWidth(); }
function pH(doc: jsPDF): number { return doc.internal.pageSize.getHeight(); }
function cW(doc: jsPDF): number { return pW(doc) - 2 * M; }

/** Word-wrap text, stripping non-ASCII first */
function wrapText(doc: jsPDF, text: unknown, maxWidth: number): string[] {
    return doc.splitTextToSize(safe(text), maxWidth);
}

/**
 * Ensure there is at least `needed` mm before the bottom margin.
 * If not, add a new page and return the reset y position.
 */
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
    if (y + needed > pH(doc) - 22) {
        doc.addPage();
        return M + 10;
    }
    return y;
}

// ─── Cover page ───────────────────────────────────────────────────────────────

async function addCoverPage(doc: jsPDF, countryName: string): Promise<void> {
    const w = pW(doc);
    const h = pH(doc);

    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, w, h, 'F');

    // Top stripe
    doc.setFillColor(...GUIDE_CONFIG.THEME_COLOR);
    doc.rect(0, 0, w, 8, 'F');

    let y = h / 2 - 58;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(...GUIDE_CONFIG.THEME_COLOR);
    doc.text('Family Recovery Roadmap', w / 2, y, { align: 'center' });
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_SECONDARY);
    doc.text(`${safe(countryName)} -- What To Do and When`, w / 2, y, { align: 'center' });
    y += 22;

    // Phase timeline strips
    const phaseStrips = [
        { label: 'Day 1-30',   color: PHASE_COLORS.CRITICAL,     title: 'SURVIVE' },
        { label: 'Day 30-90',  color: PHASE_COLORS.HIGH,          title: 'CLAIM'   },
        { label: 'Month 3-6',  color: GUIDE_CONFIG.THEME_COLOR,   title: 'SETTLE'  },
        { label: 'Month 6-12', color: GUIDE_CONFIG.SUCCESS_COLOR, title: 'REBUILD' },
    ];
    const stripW = (w - 2 * M) / phaseStrips.length;
    phaseStrips.forEach((p, i) => {
        const x = M + i * stripW;
        doc.setFillColor(...p.color);
        doc.rect(x, y, stripW - 2, 20, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(p.title, x + (stripW - 2) / 2, y + 8, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(p.label, x + (stripW - 2) / 2, y + 14, { align: 'center' });
    });
    y += 28;

    // How-to box
    const boxX = M + 10;
    const boxW = w - 2 * M - 20;
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(...GUIDE_CONFIG.THEME_COLOR);
    doc.setLineWidth(0.4);
    doc.roundedRect(boxX, y, boxW, 28, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...GUIDE_CONFIG.THEME_COLOR);
    doc.text('HOW TO USE THIS GUIDE', w / 2, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
    doc.text('Follow the four phases in order. Each phase has key actions,', w / 2, y + 16, { align: 'center' });
    doc.text('a documents checklist, contacts, mistakes to avoid, and deadlines.', w / 2, y + 22, { align: 'center' });

    // Footer
    const currentDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    doc.setFontSize(8);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_SECONDARY);
    doc.text(`Generated: ${currentDate}`, w / 2, h - 22, { align: 'center' });
    doc.text('Guidance only. Consult a qualified lawyer for legal matters.', w / 2, h - 16, { align: 'center' });
}

// ─── Phase header banner ──────────────────────────────────────────────────────

function addPhaseHeader(
    doc: jsPDF,
    phase: number,
    title: string,
    timeframe: string,
    priority: string,
    focus: string,
): number {
    const w = pW(doc);
    let y = M + 8;
    const color = PHASE_COLORS[priority] ?? GUIDE_CONFIG.THEME_COLOR;

    // Banner background
    doc.setFillColor(...color);
    doc.rect(M, y, w - 2 * M, 18, 'F');

    // Circle badge — baseline = circleCenter + capHeight/2 (10pt: cap≈2.53mm, half≈1.26mm)
    doc.setFillColor(255, 255, 255);
    doc.circle(M + 10, y + 9, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...color);
    doc.text(String(phase), M + 10, y + 10.3, { align: 'center' });

    // Phase title and timeframe
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(safe(`Phase ${phase}: ${title}`), M + 22, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(safe(timeframe), M + 22, y + 15);
    y += 22;

    // Focus strip
    doc.setFillColor(241, 245, 249);
    doc.rect(M, y, w - 2 * M, 9, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_SECONDARY);
    const focusLines = wrapText(doc, `Focus: ${focus}`, w - 2 * M - 10);
    doc.text(focusLines[0], M + 4, y + 6);

    return y + 13;
}

// ─── Key Actions ─────────────────────────────────────────────────────────────

function addKeyActions(doc: jsPDF, actions: any[], startY: number): number {
    let y = startY;
    const actionTextW = cW(doc) - 16;

    y = ensureSpace(doc, y, 18);
    doc.setFillColor(...GUIDE_CONFIG.HEADER_BG);
    doc.rect(M, y, cW(doc), 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
    doc.text('KEY ACTIONS', M + 3, y + 5.5);
    y += 11;

    for (const item of actions) {
        // Set font BEFORE splitTextToSize — jsPDF uses current font metrics for wrapping
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const actionLines = wrapText(doc, item.action, actionTextW);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        const whyLines: string[] = item.why ? wrapText(doc, `Why: ${item.why}`, cW(doc) - 22) : [];
        const whyBoxH = whyLines.length > 0 ? whyLines.length * 4.2 + 6 : 0;
        const totalH = actionLines.length * 4.5 + whyBoxH + 12;

        y = ensureSpace(doc, y, totalH);

        // Step circle badge — baseline = circleCenter + capHeight/2 (7.5pt: cap≈1.89mm, half≈0.95mm)
        doc.setFillColor(...GUIDE_CONFIG.THEME_COLOR);
        doc.circle(M + 5, y + 3, 4, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text(String(item.step), M + 5, y + 3.95, { align: 'center' });

        // Action text — font already set to bold 9 above (matches wrapText call)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text(actionLines, M + 13, y + 3);
        y += actionLines.length * 4.5 + 2;

        // Why box — background drawn BEFORE text; font already set to italic 8 above
        if (whyLines.length > 0) {
            doc.setFillColor(241, 245, 249);
            doc.rect(M + 13, y, cW(doc) - 13, whyBoxH, 'F');
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(...GUIDE_CONFIG.TEXT_SECONDARY);
            doc.text(whyLines, M + 16, y + 4);
            y += whyBoxH + 2;
        }

        // Priority pill
        const pColor: [number, number, number] =
            item.priority === 'HIGH'   ? PHASE_COLORS.HIGH :
            item.priority === 'MEDIUM' ? GUIDE_CONFIG.THEME_COLOR :
            GUIDE_CONFIG.SUCCESS_COLOR;
        doc.setFillColor(...pColor);
        doc.roundedRect(M + 13, y, 22, 4.5, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(255, 255, 255);
        doc.text(safe(item.priority), M + 24, y + 3.2, { align: 'center' });
        y += 8;
    }

    return y + 4;
}

// ─── Documents Checklist ─────────────────────────────────────────────────────

function addDocumentChecklist(doc: jsPDF, documents: string[], startY: number): number {
    let y = startY;
    const textW = cW(doc) - 14;

    y = ensureSpace(doc, y, 18);
    doc.setFillColor(...GUIDE_CONFIG.HEADER_BG);
    doc.rect(M, y, cW(doc), 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
    doc.text('DOCUMENTS CHECKLIST', M + 3, y + 5.5);
    y += 11;

    for (const item of documents) {
        // Set font BEFORE splitTextToSize
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const lines = wrapText(doc, item, textW);
        const rowH = lines.length * 4.5 + 3;
        y = ensureSpace(doc, y, rowH);

        // Checkbox square
        doc.setDrawColor(160, 160, 160);
        doc.setLineWidth(0.25);
        doc.rect(M + 2, y - 2.5, 3.5, 3.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text(lines, M + 9, y);
        y += rowH;
    }

    return y + 5;
}

// ─── Contacts Table ───────────────────────────────────────────────────────────

function addContactsTable(doc: jsPDF, contacts: any[], startY: number): number {
    let y = startY;
    const totalW = cW(doc);
    // Column widths — entity + number + use = totalW (180mm at default margin)
    const entityW = 62;
    const numberW = 32;
    const useW = totalW - entityW - numberW;

    y = ensureSpace(doc, y, 22);
    doc.setFillColor(...GUIDE_CONFIG.HEADER_BG);
    doc.rect(M, y, totalW, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
    doc.text('KEY CONTACTS', M + 3, y + 5.5);
    y += 11;

    // Column header row — background drawn BEFORE text
    doc.setFillColor(226, 232, 240);
    doc.rect(M, y, totalW, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
    doc.text('Institution',  M + 2,                y + 4.5);
    doc.text('Helpline',     M + entityW + 2,       y + 4.5);
    doc.text('Use',          M + entityW + numberW + 2, y + 4.5);
    y += 8;

    for (let i = 0; i < contacts.length; i++) {
        const c = contacts[i];
        // Set font BEFORE splitTextToSize
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const entityLines = wrapText(doc, c.entity, entityW - 4);
        const useLines    = wrapText(doc, c.use || c.portal || '', useW - 4);
        const rowH = Math.max(entityLines.length, useLines.length) * 4.5 + 5;

        y = ensureSpace(doc, y, rowH);

        // Alternating row background — drawn BEFORE text
        if (i % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(M, y, totalW, rowH, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text(entityLines,                M + 2,                y + 4);
        doc.text(safe(c.number || 'Portal'), M + entityW + 2,      y + 4);
        doc.text(useLines,                   M + entityW + numberW + 2, y + 4);
        y += rowH;
    }

    return y + 5;
}

// ─── Mistakes Section ─────────────────────────────────────────────────────────
// Per-row styling only — NO bounding box around variable-height content.
// The original bounding-box approach was fundamentally broken:
//   1. Box drawn AFTER text → coordinates wrong if checkPageBreak fired mid-section
//   2. Used Unicode "✗" → Helvetica renders it as garbage character "'"

function addMistakesSection(doc: jsPDF, mistakes: string[], startY: number): number {
    let y = startY;
    const textW = cW(doc) - 16;

    y = ensureSpace(doc, y, 18);

    // Section header — drawn BEFORE items
    doc.setFillColor(254, 226, 226);
    doc.rect(M, y, cW(doc), 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...GUIDE_CONFIG.ACCENT_COLOR);
    doc.text('MISTAKES TO AVOID', M + 3, y + 5.5);
    y += 10;

    for (let i = 0; i < mistakes.length; i++) {
        // Set font BEFORE splitTextToSize
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const lines = wrapText(doc, mistakes[i], textW);
        const rowH = lines.length * 4.5 + 6;
        y = ensureSpace(doc, y, rowH);

        // Row background — drawn BEFORE text
        if (i % 2 === 0) {
            doc.setFillColor(255, 241, 241);
            doc.rect(M, y, cW(doc), rowH, 'F');
        }

        // Left accent bar — drawn BEFORE text
        doc.setFillColor(...GUIDE_CONFIG.ACCENT_COLOR);
        doc.rect(M, y, 2, rowH, 'F');

        // Plain ASCII marker instead of Unicode "✗"
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...GUIDE_CONFIG.ACCENT_COLOR);
        doc.text('!', M + 6, y + 4.5);

        // Mistake text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(153, 27, 27);
        doc.text(lines, M + 12, y + 4.5);

        y += rowH;
    }

    return y + 6;
}

// ─── Legal Deadlines ─────────────────────────────────────────────────────────

function addDeadlinesSection(doc: jsPDF, deadlines: any[], startY: number): number {
    let y = startY;

    y = ensureSpace(doc, y, 18);

    // Section header — drawn BEFORE items
    doc.setFillColor(254, 249, 195);
    doc.rect(M, y, cW(doc), 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(146, 64, 14);
    doc.text('LEGAL DEADLINES', M + 3, y + 5.5);
    y += 10;

    for (const d of deadlines) {
        // Set font BEFORE splitTextToSize (consequence is rendered at normal 8)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const consequenceLines = wrapText(doc, `Consequence: ${d.consequence}`, cW(doc) - 10);
        const rowH = consequenceLines.length * 4.2 + 18;
        y = ensureSpace(doc, y, rowH);

        // Row background — drawn BEFORE text
        doc.setFillColor(255, 253, 235);
        doc.rect(M, y, cW(doc), rowH, 'F');
        doc.setFillColor(...GUIDE_CONFIG.WARNING_COLOR);
        doc.rect(M, y, 2, rowH, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text(safe(d.item), M + 6, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(146, 64, 14);
        doc.text(safe(`Deadline: ${d.deadline}`), M + 6, y + 11);

        doc.setTextColor(153, 27, 27);
        doc.text(consequenceLines, M + 6, y + 16);

        y += rowH + 3;
    }

    return y + 4;
}

// ─── Legal Framework page ─────────────────────────────────────────────────────

function addLegalFrameworkPage(doc: jsPDF, legalFramework: string[]): void {
    doc.addPage();
    let y = M + 8;

    doc.setFillColor(...GUIDE_CONFIG.HEADER_BG);
    doc.rect(M, y, cW(doc), 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
    doc.text('Applicable Legal Framework', M + 4, y + 7);
    y += 14;

    for (const law of legalFramework) {
        y = ensureSpace(doc, y, 8);
        // Set font BEFORE splitTextToSize
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const lines = wrapText(doc, `- ${law}`, cW(doc) - 8);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text(lines, M + 4, y);
        y += lines.length * 5 + 2;
    }

    y = ensureSpace(doc, y + 8, 20);
    doc.setFillColor(254, 226, 226);
    doc.rect(M, y, cW(doc), 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GUIDE_CONFIG.ACCENT_COLOR);
    doc.text('Disclaimer', M + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    doc.text('This document is a guidance tool only and does not constitute legal advice.', M + 4, y + 11);
    doc.text('Consult a qualified lawyer, CA, or financial advisor for your situation.', M + 4, y + 15);
}

// ─── Quick Reference page ─────────────────────────────────────────────────────

function addQuickReferencePage(doc: jsPDF, quickRef: Record<string, any>): void {
    doc.addPage();
    let y = M + 8;

    // Page header — background drawn BEFORE text
    doc.setFillColor(...GUIDE_CONFIG.THEME_COLOR);
    doc.rect(M, y, cW(doc), 11, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text('QUICK REFERENCE', M + 4, y + 7.5);
    y += 15;

    // ── Legal Heir vs Succession Certificate ──
    if (quickRef.legalHeirCertificate && quickRef.successionCertificate) {
        y = ensureSpace(doc, y, 60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text('Legal Heir Certificate vs Succession Certificate', M, y);
        y += 6;

        const halfW = (cW(doc) - 4) / 2;
        const lhc = quickRef.legalHeirCertificate;
        const sc  = quickRef.successionCertificate;
        const rx  = M + halfW + 4;

        // Boxes drawn BEFORE text
        doc.setFillColor(240, 253, 244);
        doc.rect(M, y, halfW, 50, 'F');
        doc.setFillColor(239, 246, 255);
        doc.rect(rx, y, halfW, 50, 'F');

        // LHC text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(21, 128, 61);
        doc.text('Legal Heir Certificate', M + 3, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text(safe(`Issued by: ${lhc.issuedBy}`), M + 3, y + 13);
        doc.text(safe(`Time: ${lhc.timeToObtain} | Cost: ${lhc.cost}`), M + 3, y + 18);
        const lhcUse = Array.isArray(lhc.usedFor) ? lhc.usedFor.join(', ') : String(lhc.usedFor);
        const lhcUseLines = wrapText(doc, `Use for: ${lhcUse}`, halfW - 6);
        doc.text(lhcUseLines, M + 3, y + 23);
        doc.setTextColor(153, 27, 27);
        const lhcNotLines = wrapText(doc, `Not for: ${lhc.notSuitableFor}`, halfW - 6);
        doc.text(lhcNotLines, M + 3, y + 23 + lhcUseLines.length * 4.5 + 2);

        // SC text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...GUIDE_CONFIG.THEME_COLOR);
        doc.text('Succession Certificate', rx + 3, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text(safe(`Issued by: ${sc.issuedBy}`), rx + 3, y + 13);
        doc.text(safe(`Time: ${sc.timeToObtain}`), rx + 3, y + 18);
        doc.text(safe(`Cost: ${sc.cost}`), rx + 3, y + 23);
        const scUse = Array.isArray(sc.usedFor) ? sc.usedFor.join(', ') : String(sc.usedFor);
        const scUseLines = wrapText(doc, `Use for: ${scUse}`, halfW - 6);
        doc.text(scUseLines, rx + 3, y + 28);
        doc.setTextColor(153, 27, 27);
        const scNotLines = wrapText(doc, `Not for: ${sc.notSuitableFor}`, halfW - 6);
        doc.text(scNotLines, rx + 3, y + 28 + scUseLines.length * 4.5 + 2);

        y += 56;
    }

    // ── IRDAI Claim Timeline ──
    if (quickRef.irdaiClaimTimeline) {
        y = ensureSpace(doc, y, 40);
        const t = quickRef.irdaiClaimTimeline;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text('Insurance Claim Timeline (IRDAI Mandate)', M, y);
        y += 5;

        // Box drawn BEFORE text
        doc.setFillColor(254, 249, 195);
        doc.rect(M, y, cW(doc), 30, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text(safe(`Standard settlement: ${t.standardSettlement}`), M + 4, y + 7);
        doc.text(safe(`If investigation needed: ${t.ifInvestigationNeeded}`), M + 4, y + 13);
        doc.text(safe(`Maximum allowed: ${t.maximumAllowed}`), M + 4, y + 19);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(153, 27, 27);
        doc.text(safe(`Penalty for delay: ${t.penaltyForDelay}`), M + 4, y + 25);
        y += 36;
    }

    // ── EPF Claims Checklist ──
    if (quickRef.epfClaimsChecklist) {
        y = ensureSpace(doc, y, 42);
        const e = quickRef.epfClaimsChecklist;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text('EPF Claims -- File All THREE Forms Together', M, y);
        y += 5;

        // Box drawn BEFORE text
        doc.setFillColor(239, 246, 255);
        doc.rect(M, y, cW(doc), 36, 'F');

        const formRows = [
            { label: 'Form 20',  text: e.form20,  color: GUIDE_CONFIG.THEME_COLOR as [number, number, number] },
            { label: 'Form 10D', text: e.form10D, color: GUIDE_CONFIG.THEME_COLOR as [number, number, number] },
            { label: 'Form 5IF', text: e.form5IF, color: [153, 27, 27]              as [number, number, number] },
        ];
        formRows.forEach((row, idx) => {
            const ry = y + 7 + idx * 9;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(...row.color);
            doc.text(row.label, M + 4, ry);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            const rowLines = wrapText(doc, `-- ${row.text}`, cW(doc) - 32);
            doc.text(rowLines[0], M + 30, ry);
        });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_SECONDARY);
        doc.text(safe(`Helpline: ${e.helpline} | ${e.portal}`), M + 4, y + 32);
        y += 42;
    }

    // ── Probate ──
    if (quickRef.probate) {
        y = ensureSpace(doc, y, 30);
        const p = quickRef.probate;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text('Probate of Will', M, y);
        y += 5;

        // Box drawn BEFORE text
        doc.setFillColor(241, 245, 249);
        doc.rect(M, y, cW(doc), 24, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_PRIMARY);
        doc.text(safe(`Issued by: ${p.issuedBy}`), M + 4, y + 6);
        doc.setTextColor(153, 27, 27);
        const mandatoryLines = wrapText(doc, `Mandatory in: ${p.mandatory}`, cW(doc) - 8);
        doc.text(mandatoryLines, M + 4, y + 12);
        doc.setTextColor(...GUIDE_CONFIG.TEXT_SECONDARY);
        doc.text(safe(`Time to obtain: ${p.timeToObtain}`), M + 4, y + 12 + mandatoryLines.length * 4.5 + 2);
        y += 30;
    }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export interface RecoveryRoadmapOptions {
    countryConfig: CountryFormConfig;
}

export async function generateRecoveryRoadmapPDF(options: RecoveryRoadmapOptions): Promise<Blob> {
    const { countryConfig } = options;
    const roadmap = (countryConfig as any).recoveryRoadmap;

    if (!roadmap?.enabled) {
        throw new Error('Recovery roadmap is not enabled for this country');
    }

    try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // 1. Cover
        await addCoverPage(doc, countryConfig.countryName);

        // 2. Legal framework
        if (Array.isArray(roadmap.legalFramework) && roadmap.legalFramework.length) {
            addLegalFrameworkPage(doc, roadmap.legalFramework);
        }

        // 3. One section per phase
        const phases: any[] = roadmap.phases ?? [];
        for (const phase of phases) {
            doc.addPage();
            let y = addPhaseHeader(
                doc, phase.phase, phase.title,
                phase.timeframe, phase.priority, phase.focus,
            );
            if (phase.keyActions?.length)        y = addKeyActions(doc, phase.keyActions, y);
            if (phase.mustHaveDocuments?.length)  y = addDocumentChecklist(doc, phase.mustHaveDocuments, y);
            if (phase.keyContacts?.length)        y = addContactsTable(doc, phase.keyContacts, y);
            if (phase.criticalMistakes?.length)   y = addMistakesSection(doc, phase.criticalMistakes, y);
            if (phase.legalDeadlines?.length)     addDeadlinesSection(doc, phase.legalDeadlines, y);
        }

        // 4. Quick Reference
        if (roadmap.quickReference) {
            addQuickReferencePage(doc, roadmap.quickReference);
        }

        // Add page numbers (skip cover = page 1)
        const totalPages = doc.getNumberOfPages();
        for (let i = 2; i <= totalPages; i++) {
            doc.setPage(i);
            addPageFooter(doc, i - 1);
        }

        return doc.output('blob');
    } catch (error) {
        console.error('Error generating recovery roadmap PDF:', error);
        throw new Error(
            `Failed to generate recovery roadmap: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
    }
}
