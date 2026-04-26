# Country Configuration Files

This directory contains JSON configuration files for different countries. Each file defines the form structure, validation rules, and country-specific settings.

## File Naming Convention

- Use ISO 3166-1 alpha-2 country codes (2 letters)
- File names should be uppercase: `IN.json`, `US.json`, `GB.json`, etc.
- See: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2

## Creating a New Country Configuration

1. Copy an existing configuration file (e.g., `US.json`) as a template
2. Rename it to your country code (e.g., `CA.json` for Canada)
3. Update the basic information:
   ```json
   {
     "countryCode": "CA",
     "countryName": "Canada",
     "currency": "CAD",
     "currencySymbol": "$"
   }
   ```
4. Customize the form sections and fields for your country
5. Update `src/utils/configLoader.ts` to add your country code to `AVAILABLE_COUNTRIES`

## Available Countries

- `IN` - India (₹ INR)
- `US` - United States ($ USD)

## Configuration Structure

Each configuration file must contain:

- `countryCode` (string) - ISO 3166-1 alpha-2 code
- `countryName` (string) - Full country name
- `currency` (string) - ISO 4217 currency code
- `currencySymbol` (string) - Currency symbol
- `formSections` (array) - Array of form section objects

## Form Section Types

### 1. Simple Form (single-page form with basic fields)
```json
{
  "section": "Personal Details",
  "type": "simple",
  "description": "Description of the section",
  "fields": [
    {
      "label": "Field Label",
      "name": "field_identifier",
      "type": "text",
      "placeholder": "Placeholder text",
      "validation": {
        "required": true,
        "pattern": "^regex$",
        "errorMessage": "Error message"
      }
    }
  ]
}
```

### 2. Table Form (repeating rows of data)
```json
{
  "section": "BANK ACCOUNTS",
  "type": "table",
  "description": "Add your bank accounts",
  "minRows": 0,
  "maxRows": 10,
  "columns": [
    {
      "label": "Bank Name",
      "name": "bank_name",
      "type": "text",
      "validation": {
        "required": true
      }
    }
  ]
}
```

### 3. Complex Form (multiple sub-sections with tables)
```json
{
  "section": "DOCUMENTS",
  "type": "complex",
  "description": "Document storage information",
  "structure": [
    {
      "type": "table",
      "title": "Locker Details",
      "maxRows": 5,
      "columns": []
    },
    {
      "type": "table",
      "title": "Document Types",
      "maxRows": 20,
      "columns": []
    }
  ]
}
```

## Field Types

- `text` - Single-line text input
- `number` - Numeric input
- `email` - Email address with validation
- `date` - Date picker
- `select` - Dropdown with predefined options
- `textarea` - Multi-line text input

## Validation Options

```json
{
  "validation": {
    "required": true,           // Field must be filled
    "pattern": "^[A-Z]{2}$",   // Regex pattern
    "minLength": 2,            // Minimum string length
    "maxLength": 100,          // Maximum string length
    "min": 0,                  // Minimum number value
    "max": 1000,               // Maximum number value
    "errorMessage": "Custom error message"
  }
}
```

## Best Practices

1. **Use descriptive field names**: `passport_no` instead of `pp`
2. **Add helpful placeholders**: Show format examples
3. **Set appropriate validation**: Prevent invalid data entry
4. **Limit table rows**: Set reasonable `maxRows` values
5. **Group related fields**: Organize sections logically
6. **Test patterns carefully**: Validate regex patterns work correctly
7. **Use clear error messages**: Help users fix validation errors

## Country-Specific Considerations

When creating a new country configuration:

- [ ] Include country-specific ID types (SSN, NIN, Aadhaar, etc.)
- [ ] Use appropriate phone number formats and patterns
- [ ] Include relevant insurance types for that country
- [ ] Adapt banking field labels (Routing Number, IFSC, Sort Code, etc.)
- [ ] Consider local regulations and required documentation
- [ ] Use appropriate currency symbols and formats
- [ ] Include country-specific service providers where relevant

## Testing Your Configuration

1. Add your JSON file to `public/configs/`
2. Update `AVAILABLE_COUNTRIES` in `src/utils/configLoader.ts`
3. Run the application: `npm run dev`
4. Select your country from the dropdown (if implemented)
5. Test all form sections for:
   - Field validation
   - Required fields
   - Pattern matching
   - Table operations (add/remove rows)
   - Data persistence

## Common Patterns

### Phone Number (US)
```json
{
  "pattern": "^\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}$",
  "placeholder": "(555) 123-4567"
}
```

### Phone Number (India)
```json
{
  "pattern": "^[0-9]{10}$",
  "placeholder": "9876543210"
}
```

### Email
```json
{
  "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
  "type": "email"
}
```

### Postal Code (US)
```json
{
  "pattern": "^[0-9]{5}(-[0-9]{4})?$",
  "placeholder": "12345 or 12345-6789"
}
```

### Postal Code (Canada)
```json
{
  "pattern": "^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$",
  "placeholder": "K1A 0B1"
}
```

## Need Help?

- Check existing configurations (`IN.json`, `US.json`) for examples
- Review the [DYNAMIC_CONFIG.md](../../DYNAMIC_CONFIG.md) documentation
- Refer to `src/constants/types.ts` for TypeScript type definitions

## File Validation

Before committing your configuration file, ensure:

1. ✅ Valid JSON syntax (use a JSON validator)
2. ✅ All required fields present
3. ✅ Regex patterns properly escaped (use double backslashes)
4. ✅ Field names use snake_case
5. ✅ Section names are clear and descriptive
6. ✅ Country code added to `AVAILABLE_COUNTRIES`
7. ✅ File tested in the application
