import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { saveData, getData, clearAllData } from '../utils/indexedDB';
import { DEFAULT_COUNTRY } from '../constants/countries';

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
  loadFromIndexedDB: () => Promise<boolean>;
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
      setCountry: (country) => set({ selectedCountry: country }),
      
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
          // Save directly without encryption
          await saveData('formData', JSON.stringify(formData));
          // Also save metadata (country and step)
          await saveData('appMeta', JSON.stringify({ selectedCountry, currentStep }));
          set({ lastSaveTime: Date.now() });
        } catch (error) {
          console.error('Failed to save data:', error);
        }
      },
      
      loadFromIndexedDB: async () => {
        try {
          const storedData = await getData('formData');
          if (!storedData) {
            return false;
          }
          
          // Load directly without decryption
          set({ formData: JSON.parse(storedData), isDataLoaded: true });
          return true;
        } catch (error) {
          console.error('Failed to load data:', error);
          return false;
        }
      },
      
      initializeFromStorage: async () => {
        // Auto-load data on app initialization
        try {
          const storedData = await getData('formData');
          if (storedData) {
            const formData = JSON.parse(storedData);
            // Also restore country and step if available
            const metaData = await getData('appMeta');
            const meta = metaData ? JSON.parse(metaData) : {};
            
            set({ 
              formData,
              selectedCountry: meta.selectedCountry || DEFAULT_COUNTRY,
              currentStep: meta.currentStep || 0,
              isDataLoaded: true
            });
          }
        } catch (error) {
          console.error('Failed to initialize from storage:', error);
        }
      },
      
      clearData: async () => {
        try {
          await clearAllData();
          set({ 
            formData: {}, 
            currentStep: 0,
            lastSaveTime: null,
            isDataLoaded: false
          });
        } catch (error) {
          console.error('Failed to clear data:', error);
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

