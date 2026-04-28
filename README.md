
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

---

## Why Open Source?

- **Transparency:** Anyone can review the code.
- **Privacy verification:** Trust, but verify—no hidden data flows.
- **Community contribution:** Improve and adapt Onter together.
- **Trust without blind faith:** You control your data.

---

## 🌟 Features

- **Emergency-ready organization:** Capture critical details for family, dependents, advisors, and estate handlers
- **Global form framework:** Configurable country-specific workflows (India, USA, more)
- **Client-side privacy:** All storage is local in your browser
- **Exportable package:** Download a comprehensive data bundle for safe handover
- **Auto-save & auto-delete:** Progress is saved, and data is cleared after 24 hours for privacy
- **Responsive design:** Desktop and mobile
- **Step-by-step forms:** Guided, easy-to-use wizard
- **Validation:** Built-in checks for accuracy

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
├── store/             # Zustand state management
├── utils/             # Utility functions (Excel, IndexedDB, configLoader, PDF)
├── App.tsx            # Main application root component
├── FormStepper.tsx    # Multi-step form wizard
└── main.tsx           # Application entry point

public/
└── configs/           # Country-specific JSON configurations
    ├── IN.json        # India configuration
    ├── US.json        # United States configuration
    └── README.md      # Configuration guide
```

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

---

## 🔒 Security & Privacy

- **Client-side only:** All data stays on your device
- **No servers:** No data transmission to external servers
- **Auto-delete:** Form data is stored locally in your browser and automatically cleared after 24 hours for additional privacy protection.
- **Open source:** Transparent code you can audit

---

## Roadmap

- More country packs
- Family sharing workflows
- Secure PDF emergency pack
- Dead man’s switch (optional)
- Executor checklist automation

---

## 📝 License

MIT License

---

## Built for trust, privacy, and family continuity.

---

## 📖 Documentation

- [DYNAMIC_CONFIG.md](DYNAMIC_CONFIG.md) - Configuration system guide
- [public/configs/README.md](public/configs/README.md) - Country config creation
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
