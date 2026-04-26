# Onter — Legacy Information Organizer

A privacy-first client-side React app designed to help individuals compile essential personal, financial, insurance, legal, and digital information in one organized package for family members and trusted executors.

Onter is built for people who want to prepare for unexpected events, avoid the chaos of scattered documents, and share a ready-to-use legacy bundle without ever uploading sensitive data to servers.

## 🌟 Features

- **Emergency-ready organization**: Capture critical details for family, dependents, advisors, and estate handlers
- **Global form framework**: Configurable country-specific workflows with support for India, USA, and more
- **Client-side privacy first**: All storage is local in the browser, no external servers or databases
- **Exportable package**: Download a comprehensive data bundle for safe handover
- **Auto-save**: Keep progress intact while adding information
- **Responsive design**: Accessible on desktop and mobile devices
- **Step-by-step forms**: Guided, easy-to-use wizard for structured entry
- **Validation and completeness**: Built-in checks help ensure data is accurate and up to date

## Why Onter?

When the primary breadwinner or a key family member passes away unexpectedly, surviving dependents often face emotional stress and practical chaos. Important records are scattered across devices, accounts, physical papers, and online services, and families need a trusted place to find everything quickly.

Onter solves that problem with a secure, offline-first approach. It helps people build a single, up-to-date reference of their most important information, especially for regional financial and legal instruments such as EPF, NPS, PPF, LIC, demat accounts, Aadhaar-linked services, and other country-specific needs.

## What makes Onter different?

- **Fully client-side**: No data is transmitted to third-party servers
- **Privacy-first by design**: Ideal for sensitive legacy planning and estate preparation
- **Flexible global model**: Country configurations let you adapt the app to regional requirements
- **Export and share**: Create a ready-made package for family members or executors to use during a crisis

## 📁 Form Sections

The application helps you organize:

- **Personal Details**: ID numbers, contact information, utilities
- **Emergency Contacts**: Important people to reach in emergencies
- **Insurance details**: Life, health, and other insurance policies
- **Bank Accounts**: Banking information and account details
- **Properties**: Real estate and property holdings
- **Investments**: Shares, bonds, deposits, and savings
- **Loans**: Active loans and liabilities
- **Documents**: Location of important documents and records
- **Advisors**: Contact details for legal, financial advisors
- **Credentials**: Important website logins (stored securely)
- **And more...**

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Modern web browser with IndexedDB support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd onter

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🌍 Multi-Country Support

### Dynamic Configuration System

Onter uses a JSON-based configuration system for easy internationalization:

**Location**: `public/configs/<COUNTRY_CODE>.json`

**Available Countries**:
- 🇮🇳 **IN** - India (₹ INR)
- 🇺🇸 **US** - United States ($ USD)

### Adding a New Country

1. Create `public/configs/<CODE>.json` (see [configs/README.md](public/configs/README.md))
2. Define country-specific form sections and validation
3. Update `AVAILABLE_COUNTRIES` in `src/utils/configLoader.ts`
4. Test thoroughly!

See [DYNAMIC_CONFIG.md](DYNAMIC_CONFIG.md) for detailed documentation.

## 🏗️ Architecture

### Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server  
- **Mantine UI** - Component library
- **Zustand** - State management
- **IndexedDB** - Client-side database
- **XLSX** - Excel export/import
- **jsPDF** - PDF generation

### Project Structure

```
src/
├── components/         # Reusable UI components
├── constants/         # Configuration and types
├── hooks/            # Custom React hooks
├── store/            # Zustand state management
├── utils/            # Utilities (excel, indexedDB, configLoader, pdf)
├── App.tsx           # Main app component
├── FormStepper.tsx   # Multi-step form wizard
└── main.tsx          # Application entry point

public/
└── configs/          # Country-specific JSON configurations
    ├── IN.json       # India
    ├── US.json       # United States
    └── README.md     # Configuration guide
```

## 🔒 Security & Privacy

- **Client-side only**: All data stays on your device
- **IndexedDB storage**: Data stored in your browser's IndexedDB database
- **No servers**: No data transmission to external servers
- **Auto-delete**: Data automatically deleted after 24 hours
- **Data export**: Export your data anytime
- **Open source**: Transparent code you can audit

## 📖 Documentation

- [DYNAMIC_CONFIG.md](DYNAMIC_CONFIG.md) - Configuration system guide
- [public/configs/README.md](public/configs/README.md) - Country config creation
- [MIGRATION.md](MIGRATION.md) - Migration guide (if applicable)
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Feature status

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

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding New Countries

We especially welcome contributions for new country configurations! See [public/configs/README.md](public/configs/README.md) for guidelines.

## 📝 License

[Add your license here]

## 🙏 Acknowledgments

- Mantine UI team for the excellent component library
- React and Vite communities
- All contributors

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the code examples

---

**Built with ❤️ for secure personal information management**
