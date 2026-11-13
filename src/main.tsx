import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import './styles/fonts.css'
import './styles/components.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { theme } from './theme'
import { initialLocale, i18nReady } from './i18n'
import { DEFAULT_COUNTRY } from './constants'
import { loadCountryTranslations } from './utils/i18nLoader'

await i18nReady
if (initialLocale !== 'en') {
  await loadCountryTranslations(DEFAULT_COUNTRY, initialLocale)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <MantineProvider theme={theme}>
        <HashRouter>
          <App />
        </HashRouter>
      </MantineProvider>
    </ErrorBoundary>
  </StrictMode>,
)
