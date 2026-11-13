
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
- **Country-specific sessions:** Each country's progress is saved separately and can be resumed when that country is selected
- **Auto-delete:** Saved sessions are cleared after 24 hours for privacy
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

Country structure and presentation text are stored separately:

```json
{
  "countryCode": "CA",
  "formSections": [
    { "id": "personalDetails", "type": "simple", "fields": [] }
  ]
}
```

Country structure belongs in `src/config/<COUNTRY>.json`. Shared copy belongs in
`src/i18n/global/<LANG>.json`; country-specific copy belongs in
`src/i18n/<COUNTRY>_<LANG>.json`. The loader resolves country-language text,
then global-language text, then global English. Keep display strings out of
country config files. See [src/config/README.md](src/config/README.md) for the
full structure and contribution guidance.

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

## White-label and language configuration

Each deployment selects one registered brand profile. To add a partner:

1. Add its logo, favicon, and social-preview image to `public/`. Use filenames
   that identify the partner, for example `partner-logo.png`,
   `partner-favicon.ico`, and `partner-social.png`. Asset paths in the profile
   are relative to `public/` (write `partner-logo.png`, not `public/partner-logo.png`).
   Use a PNG or JPEG logo if it must also appear in PDF exports.
2. Add a profile in `src/branding/profiles.ts` and register it in
   `brandProfiles` using a short, unique `id` such as `partner-name`. The profile
   ID is the value passed to dev/build commands. Set:
   - `name`, `appTitle`, `description`, and `tagline` for app and page metadata.
   - `siteUrl` to the partner's canonical public URL and `sourceUrl` (optional)
     to the source-code URL. The social-preview URL is built from `siteUrl` and
     `socialImageAsset`.
   - `logoAsset`, `faviconAsset`, and `socialImageAsset` to the filenames in
     `public/`. `logoAsset` is used in the app and PDF exports.
   - `fontFamily` to the desired CSS font stack.
   - `filePrefix`, `accessGuideFilePrefix`, and `recoveryRoadmapFilePrefix` to
     the prefixes used for downloaded exports.
   - `primaryPalette` and `accentPalette` as ten six-digit hex colors each,
     ordered from lightest (index 0) to darkest (index 9). Index 5 is the main
     theme color; indices 6 and 7 are used for hover/active states.
   - `rtlPdfFont` only if RTL PDF exports are needed; provide a font family and
     regular/bold TTF asset filenames in `public/`.
3. Run or build with that profile ID:

   ```sh
   npm run dev --brand=partner-name
   npm run build --brand=partner-name
   ```

   The npm `--brand` option selects the profile for both dev and build. You can
   also set `VITE_BRAND_ID=partner-name` in the environment or a Vite env file.
   The default profile is `onter`; an unknown ID fails rather than silently
   falling back to it.

Languages are user-selectable only when a global translation file exists in
`src/i18n/global/`. Country-specific translations can override global strings.
Add a complete global translation file before making a locale available; add
country-language files in `src/i18n/` to localize country-specific form content.
The document direction is derived from its BCP 47 language/script code. RTL PDF
exports additionally require regular and bold TTF font assets configured on the
brand profile. They fail explicitly when those fonts are missing.

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

### Running Tests and Coverage

Use the Vitest-based test runner for local verification and coverage checks:

```bash
npm run test
npm run test:coverage
```

The coverage command generates a terminal summary and an HTML report at:

```text
coverage/index.html
```

Open that file in a browser to inspect coverage by file and line.

---

## 🌍 Multi-Country Support

```text
src/
├── components/        # Reusable UI components
├── constants/         # Configuration constants and shared types
├── hooks/             # Custom React hooks
├── services/          # Business logic services
│   └── accessGuideService.ts  # Emergency Access Guide PDF generation
├── config/            # Self-contained country structural configs
├── i18n/              # Shared and country-specific translations
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
└── ...               # Static images, fonts, and other public assets
```

### Dynamic Configuration System

Onter uses JSON structural configs and i18next resources:

**Locations**:
- `src/config/<COUNTRY_CODE>.json`
- `src/i18n/global/<LANG>.json`
- `src/i18n/<COUNTRY_CODE>_<LANG>.json`

**Available Countries**:
- 🇮🇳 **IN** - India (₹ INR)
- 🇺🇸 **US** - United States ($ USD)
- 🇨🇦 **CA** - Canada (C$ CAD)
- **GB** - Great Britain (£ GBP; England, Scotland, and Wales)
- **AU** - Australia ($ AUD)
- **NZ** - New Zealand ($ NZD)
- **IE** - Ireland (€ EUR; Republic of Ireland)
- **SG** - Singapore ($ SGD)
- **HK** - Hong Kong (HK$ HKD)
- **JP** - Japan (¥ JPY)
- **KR** - South Korea (₩ KRW)

### Adding a New Country

1. Add a self-contained `src/config/<CODE>.json` with structural and validation data.
2. Add country-specific display text to `src/i18n/<CODE>_en.json`.
3. Use stable section IDs and machine-readable option keys that match the i18n keys.
4. Update `AVAILABLE_COUNTRIES` in `src/constants/countries.ts`.
5. Test the form and exports for that country.

See [DYNAMIC_CONFIG.md](DYNAMIC_CONFIG.md) for detailed documentation.

---

## 🔒 Security & Privacy

- **Client-side only:** All data stays on your device
- **No servers:** No data transmission to external servers
- **Auto-delete:** Country-specific form sessions are stored locally in your browser and automatically cleared after 24 hours for additional privacy protection.
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
- [src/config/README.md](src/config/README.md) - Country config and i18n contribution guide
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

We especially welcome contributions for new country configurations! See [src/config/README.md](src/config/README.md) for guidelines.

---

## 📧 Support

- Open an issue on GitHub
- Check documentation

**Built with ❤️ for secure personal information management**
