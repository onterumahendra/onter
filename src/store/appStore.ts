/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { saveData, getData, deleteData } from '../utils/indexedDB';
import { DEFAULT_COUNTRY, getCountryCodes } from '../constants/countries';

const LEGACY_FORM_DATA_KEY = 'formData';
const APP_METADATA_KEY = 'appMeta';

interface PersistedCountryData {
  formData: Record<string, any>;
  currentStep: number;
}

function countryDataKey(country: string): string {
  return `countryData:${country}`;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(value: string): unknown {
  return JSON.parse(value) as unknown;
}

function parseMetadata(value: string | null): unknown {
  if (!value) return null;
  try {
    return parseJson(value);
  } catch (error) {
    console.error('Failed to parse saved metadata:', error);
    return null;
  }
}

function resolveCountry(metadata: unknown): string | null {
  if (isRecord(metadata) && typeof metadata.selectedCountry === 'string') {
    return getCountryCodes().includes(metadata.selectedCountry)
      ? metadata.selectedCountry
      : null;
  }
  return DEFAULT_COUNTRY;
}

function parsePersistedCountryData(value: unknown): PersistedCountryData | null {
  if (!isRecord(value) || !isRecord(value.formData)) return null;

  return {
    formData: value.formData,
    currentStep: Number.isInteger(value.currentStep) && value.currentStep >= 0
      ? value.currentStep
      : 0,
  };
}

interface AppState {
  // State
  selectedCountry: string;
  currentStep: number;
  formData: Record<string, any>;
  isImportMode: boolean;
  lastSaveTime: number | null;
  isDataLoaded: boolean;
  
  // Actions
  setCountry: (country: string) => void;
  setStep: (step: number) => void;
  updateFormData: (section: string, data: any) => void;
  setImportMode: (isImport: boolean) => void;
  saveToIndexedDB: () => Promise<void>;
  loadFromIndexedDB: (country?: string) => Promise<boolean>;
  initializeFromStorage: () => Promise<void>;
  clearData: () => Promise<void>;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      selectedCountry: DEFAULT_COUNTRY,
      currentStep: 0,
      formData: {},
      isImportMode: false,
      lastSaveTime: null,
      isDataLoaded: false,
      
      // Actions
      setCountry: (country) => {
        if (!getCountryCodes().includes(country)) {
          console.error(`Cannot select unsupported country: ${country}`);
          return;
        }

        if (country !== get().selectedCountry) {
          set({
            selectedCountry: country,
            formData: {},
            currentStep: 0,
            lastSaveTime: null,
            isDataLoaded: false,
          });
        }
      },
      
      setStep: (step) => set({ currentStep: step }),
      
      updateFormData: (section, data) => {
        set((state) => ({
          formData: { ...state.formData, [section]: data }
        }));
        // Auto-save is handled by debounce in FormStepper
      },
      
      setImportMode: (isImport) => set({ isImportMode: isImport }),
      
      saveToIndexedDB: async () => {
        const { formData, selectedCountry, currentStep } = get();
        
        // Skip if no data to save
        if (Object.keys(formData).length === 0) {
          return;
        }
        
        try {
          await saveData(
            countryDataKey(selectedCountry),
            JSON.stringify({ formData, currentStep } satisfies PersistedCountryData)
          );
          await saveData(APP_METADATA_KEY, JSON.stringify({ selectedCountry }));
          set({ lastSaveTime: Date.now() });
        } catch (error) {
          console.error('Failed to save data:', error);
        }
      },
      
      loadFromIndexedDB: async (country = get().selectedCountry) => {
        if (!getCountryCodes().includes(country)) {
          console.error(`Cannot load data for unsupported country: ${country}`);
          return false;
        }

        try {
          let storedData = await getData(countryDataKey(country));
          let persistedData: PersistedCountryData | null = null;

          if (storedData) {
            persistedData = parsePersistedCountryData(parseJson(storedData));
            if (!persistedData) {
              throw new Error(`Invalid saved data for ${country}`);
            }
          } else {
            const legacyData = await getData(LEGACY_FORM_DATA_KEY);
            if (legacyData) {
              const metadataValue = await getData(APP_METADATA_KEY);
              const metadata = parseMetadata(metadataValue);

              if (resolveCountry(metadata) === country) {
                const legacyFormData = parseJson(legacyData);
                if (!isRecord(legacyFormData)) {
                  throw new Error(`Invalid legacy saved data for ${country}`);
                }

                const legacyStep = isRecord(metadata) ? metadata.currentStep : 0;
                persistedData = {
                  formData: legacyFormData,
                  currentStep: Number.isInteger(legacyStep) && legacyStep >= 0
                    ? legacyStep
                    : 0,
                };
                storedData = JSON.stringify(persistedData);
                await saveData(countryDataKey(country), storedData);

                try {
                  await deleteData(LEGACY_FORM_DATA_KEY);
                } catch (error) {
                  console.error('Failed to remove migrated legacy data:', error);
                }
              }
            }
          }

          const formData = persistedData?.formData ?? {};
          const hasData = Object.keys(formData).length > 0;
          if (get().selectedCountry === country) {
            set({
              formData: hasData ? formData : {},
              currentStep: hasData ? persistedData?.currentStep ?? 0 : 0,
              lastSaveTime: null,
              isDataLoaded: true,
            });
          }
          return hasData;
        } catch (error) {
          console.error('Failed to load data:', error);
          if (get().selectedCountry === country) {
            set({
              formData: {},
              currentStep: 0,
              lastSaveTime: null,
              isDataLoaded: true,
            });
          }
          return false;
        }
      },
      
      initializeFromStorage: async () => {
        // Auto-load data on app initialization
        try {
          const initialCountry = get().selectedCountry;
          const metadataValue = await getData(APP_METADATA_KEY);
          const metadata = parseMetadata(metadataValue);
          const country = get().selectedCountry === initialCountry
            ? resolveCountry(metadata) ?? DEFAULT_COUNTRY
            : get().selectedCountry;

          if (get().selectedCountry !== country) {
            set({
              selectedCountry: country,
              formData: {},
              currentStep: 0,
              lastSaveTime: null,
              isDataLoaded: false,
            });
          }

          await get().loadFromIndexedDB(country);
        } catch (error) {
          console.error('Failed to initialize from storage:', error);
        }
      },
      
      clearData: async () => {
        try {
          const country = get().selectedCountry;
          const idsToDelete = [countryDataKey(country)];
          const legacyData = await getData(LEGACY_FORM_DATA_KEY);

          if (legacyData) {
            const metadataValue = await getData(APP_METADATA_KEY);
            const metadata = parseMetadata(metadataValue);
            if (resolveCountry(metadata) === country) {
              idsToDelete.push(LEGACY_FORM_DATA_KEY);
            }
          }

          await deleteData(...idsToDelete);
          set({ 
            formData: {}, 
            currentStep: 0,
            lastSaveTime: null,
            isDataLoaded: false
          });
        } catch (error) {
          console.error('Failed to clear data:', error);
          throw error;
        }
      },
      
      reset: () => {
        set({
          selectedCountry: DEFAULT_COUNTRY,
          currentStep: 0,
          formData: {},
          isImportMode: false,
          lastSaveTime: null,
          isDataLoaded: false
        });
      }
    }),
    { name: 'AppStore' }
  )
);

