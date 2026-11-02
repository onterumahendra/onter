# Country configuration and translations

Country JSON is split between structural configuration and human-facing text:

- `src/config/<COUNTRY>.json` contains country metadata, form structure, validation,
  option keys, and machine-readable access-guide and roadmap data.
- `src/i18n/global/<LANG>.json` contains shared text.
- `src/i18n/<COUNTRY>_<LANG>.json` contains country-specific text and overrides.

The runtime loads only the requested country config. Translation resolution merges
`global/en.json`, `global/<LANG>.json`, then `<COUNTRY>_<LANG>.json`; later values
override earlier values. Do not create a base config or put labels, descriptions,
placeholders, option labels, validation messages, or guide prose in country config.

When adding a country:

1. Add a complete, self-contained config file with stable camelCase section IDs.
2. Add the country name and all field, section, option, guide, and roadmap text to
   the country-language i18n file.
3. Use stable snake_case option keys, or standard codes where the source already
   provides them.
4. Add the country to `src/constants/countries.ts`.
5. Test the config loader, form rendering, validation, and export generation.

The one-time migration utility for the original public configs is
`scripts/migrate-configs.js`.
