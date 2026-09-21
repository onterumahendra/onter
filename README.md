
git clone https://github.com/onterumahendra/onter.git

[![Trust & verify: Source code on GitHub](https://img.shields.io/badge/GitHub-Trust%20%26%20Verify-blue?logo=github)](https://github.com/onterumahendra/onter)

# Onter — Family Legacy Organizer

> Onter helps families stay prepared by organizing essential personal, financial, insurance, legal, and digital information in one secure place—without ever sending sensitive data to servers.

---

## Who Onter Helps

- Families preparing for emergencies
- Primary earners organizing responsibilities
- Parents protecting dependents
- Professionals managing financial continuity
- People supporting aging parents

---

## Why Onter Exists

When a key family member passes away unexpectedly, surviving dependents face emotional and practical chaos. Records are scattered across devices, accounts, and papers. Onter provides a single, secure, up-to-date reference for your most important information—built for privacy, trust, and family continuity.

**But having the data isn't enough.** Families need to know *what to do* with it during emergencies. That's why Onter includes an **Emergency Access Guide**—a comprehensive PDF that walks your loved ones through every step, from opening files to contacting the right people, with country-specific emergency numbers and legal guidance.

---

## Why Open Source?

- **Transparency:** Anyone can review the code.
- **Privacy verification:** Trust, but verify—no hidden data flows.
- **Community contribution:** Improve and adapt Onter together.
- **Trust without blind faith:** You control your data.

---

## 🌟 Features

- **Emergency-ready organization:** Capture critical details for family, dependents, advisors, and estate handlers
- **Emergency Access Guide (NEW):** Comprehensive PDF guide explaining how to use your exported data during emergencies
- **Global form framework:** Configurable country-specific workflows (India, USA, Canada, more)
- **Client-side privacy:** All storage is local in your browser
- **Exportable package:** Download a comprehensive data bundle (Excel + PDF + Access Guide) for safe handover
- **Auto-save & auto-delete:** Progress is saved, and data is cleared after 24 hours for privacy
- **Responsive design:** Desktop and mobile
- **Step-by-step forms:** Guided, easy-to-use wizard
- **Validation:** Built-in checks for accuracy

---

## 📋 Emergency Access Guide

**The Problem:** Families often have emergency data but don't know what to do with it during crises.

**The Solution:** Onter automatically generates a comprehensive, step-by-step Emergency Access Guide PDF that explains exactly how to use your exported data when it matters most.

### What's Included in the Access Guide

#### 📘 Cover Page
- Professional design with security warnings
- Date stamp for version tracking
- Clear emergency classification

#### 🚨 Quick Start Section
- Country-specific emergency numbers (911, 108, etc.)
- Critical first 30 minutes actions
- File extraction and access instructions
- Immediate contact guidance

#### 📁 File Structure Explanation
- What's in your ZIP file (Excel, PDFs, Guide)
- How to open and extract files
- Secure storage recommendations
- Cloud backup best practices

#### 📚 Section-by-Section Guidance
For each form section, the guide provides:
- **Icon** for quick visual recognition
- **Description** of what's inside
- **Who Needs This** (e.g., doctors, lawyers, banks)
- **First Actions** to take immediately
- **Critical Fields** to prioritize

**Example Sections Covered:**
- 🇺🇸 **US:** Personal Details, Emergency Contacts, Insurance, Bank Details, Document Locations
- 🇮🇳 **India:** Personal Details, Mediclaim, Insurance, Bank Details, EPF/PPF/NPS, Deposits, Loans, Property, Digital Assets (15 sections!)

#### 👥 Emergency Contacts
- Extracted directly from your form data
- Highlighted for immediate access
- Contact validation reminders

#### ⚖️ Legal & Security Notes
- Country-specific legal considerations
- Estate planning guidance
- Succession laws and timelines
- Data security best practices
- Professional disclaimers

### Access Guide Benefits

✅ **Peace of Mind** - Families know exactly what to do  
✅ **Faster Emergency Response** - No time wasted figuring out the data  
✅ **Reduced Errors** - Clear instructions prevent mistakes  
✅ **Country-Specific Guidance** - Tailored emergency numbers and legal info  
✅ **Actionable Intelligence** - "Do this first" approach  
✅ **Professional Grade** - Scannable format with icons and clear hierarchy

### Configuration

Access guides are configurable per country in `public/configs/<COUNTRY>.json`:

```json
{
  "accessGuide": {
    "enabled": true,
    "quickStart": ["Emergency instructions..."],
    "emergencyServices": {
      "medical": "911",
      "police": "911"
    },
    "sectionGuidance": {
      "Personal Details": {
        "icon": "👤",
        "description": "Identity information...",
        "usefulFor": ["Medical professionals", "Legal representatives"],
        "firstActions": ["Verify documents...", "Contact emergency contacts..."],
        "criticalFields": ["SSN", "Blood Group"]
      }
    },
    "legalNotes": ["Legal disclaimers..."],
    "generalGuidance": {
      "fileStructure": ["What's in your ZIP..."],
      "dataAccess": ["How to extract files..."],
      "securityTips": ["Keep documents secure..."]
    }
  }
}
```

### Export Package

When you export your data, you receive a complete emergency kit:

```
Onter_Care_US_2026-05-22.zip
├── Onter_Care_US_2026-05-22.xlsx      # Editable data
├── Onter_Care_US_2026-05-22.pdf       # Print-ready form
└── Onter_Emergency_Access_Guide_US.pdf      # Step-by-step instructions
```

---

## Live Demo

[https://onterumahendra.github.io/onter/](https://onterumahendra.github.io/onter/)

---

## 📁 Form Sections

- Personal Details
- Emergency Contacts
- Insurance details
- Bank Accounts
- Properties
- Investments
- Loans
- Documents
- Advisors
- Credentials
- And more...

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Modern web browser

### Installation

```bash
git clone https://github.com/onterumahendra/onter.git
cd onter
npm install
npm run dev
```

---

## 🌍 Multi-Country Support

```text
src/
├── components/        # Reusable UI components
├── constants/         # Configuration constants and shared types
├── hooks/             # Custom React hooks
├── services/          # Business logic services
│   └── accessGuideService.ts  # Emergency Access Guide PDF generation
├── store/             # Zustand state management
├── utils/             # Utility functions
│   ├── excel.ts       # Excel generation
│   ├── pdfService.ts  # Form PDF generation
│   ├── pdfHelpers.ts  # PDF utilities for forms
│   ├── accessGuidePdfHelpers.ts  # PDF utilities for access guide
│   ├── indexedDB.ts   # Local storage
│   ├── configLoader.ts  # Dynamic country config loader
│   └── zipService.ts  # ZIP package generation (Excel + PDFs + Guide)
├── App.tsx            # Main application root component
├── FormStepper.tsx    # Multi-step form wizard
└── main.tsx           # Application entry point

public/
└── configs/           # Country-specific JSON configurations
    ├── IN.json        # India configuration (with access guide)
    ├── US.json        # United States configuration (with access guide)
    └── README.md      # Configuration guide
```

### Dynamic Configuration System

Onter uses a JSON-based configuration system for easy internationalization:

**Location**: `public/configs/<COUNTRY_CODE>.json`

**Available Countries**:
- 🇮🇳 **IN** - India (₹ INR)
- 🇺🇸 **US** - United States ($ USD)
- 🇨🇦 **CA** - Canada (C$ CAD)

### Adding a New Country

1. Create `public/configs/<CODE>.json` (see [configs/README.md](public/configs/README.md))
2. Define country-specific form sections and validation
3. Configure the **Emergency Access Guide** with country-specific emergency numbers, legal notes, and section guidance
4. Update `AVAILABLE_COUNTRIES` in `src/utils/configLoader.ts`
5. Test thoroughly, including PDF exports and access guide generation!

See [DYNAMIC_CONFIG.md](DYNAMIC_CONFIG.md) for detailed documentation.

---

## 🔒 Security & Privacy

- **Client-side only:** All data stays on your device
- **No servers:** No data transmission to external servers
- **Auto-delete:** Form data is stored locally in your browser and automatically cleared after 24 hours for additional privacy protection.
- **Open source:** Transparent code you can audit

---

## Roadmap

- ✅ **Emergency Access Guide** - Comprehensive PDF guide for families (COMPLETED)
- More country packs
- Family sharing workflows
- ~~Secure PDF emergency pack~~ (COMPLETED - now includes Excel, PDF, and Access Guide)
- Dead man's switch (optional)
- Executor checklist automation
- Multi-language support within countries
- Digital vault integration

---

## 📝 License

MIT License

---

## Built for trust, privacy, and family continuity.

---

## 📖 Documentation

- [DYNAMIC_CONFIG.md](DYNAMIC_CONFIG.md) - Configuration system guide
- [public/configs/README.md](public/configs/README.md) - Country config creation (includes Access Guide setup)
- [MIGRATION.md](MIGRATION.md) - Migration guide (if applicable)
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Feature status

---

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run type-check   # TypeScript type checking
```

### Code Quality

- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting (recommended)

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding New Countries

We especially welcome contributions for new country configurations! See [public/configs/README.md](public/configs/README.md) for guidelines.

---

## 📧 Support

- Open an issue on GitHub
- Check documentation

**Built with ❤️ for secure personal information management**
