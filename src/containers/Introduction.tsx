/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-unused-vars, react/set-state-in-effect, react/purity, no-floating-promises */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Stack,
  Button,
  Select,
  Card,
  Group,
  FileButton,
  Alert,
  List,
  Modal,
  SimpleGrid,
  Box,
} from '@mantine/core';
import {
  IconFileDownload,
  IconFileUpload,
  IconEdit,
  IconShieldLock,
  IconInfoCircle,
  IconAlertTriangle,
  IconClockHour4,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { getAvailableCountries } from '../constants';
import { useAppStore } from '../store/appStore';
import { useExcelOperations } from '../hooks/useExcelOperations';
import { publicAsset } from '../utils/paths';
import { brand } from '../branding';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

/**
 * Introduction component following SOLID principles
 * - Single Responsibility: Only handles introduction UI and user choices
 * - Dependency Inversion: Uses hooks for all external dependencies
 */
export function Introduction() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [savedDataCountry, setSavedDataCountry] = useState<string | null>(null);
  const [checkedCountry, setCheckedCountry] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'manual' | 'import' | 'download' | null>(null);
  const [showLogo, setShowLogo] = useState(false);
  const [now, setNow] = useState<number>(0);

  const {
    selectedCountry,
    setCountry,
    setImportMode,
    updateFormData,
    loadFromIndexedDB,
    clearData,
    lastSaveTime,
  } = useAppStore();
  const hasSavedData = savedDataCountry === selectedCountry;
  const isCheckingSavedData = checkedCountry !== selectedCountry;
  
  const { isGenerating, isImporting, generateTemplate, importData } = useExcelOperations();
  
  // Check for saved data on mount
  useEffect(() => {
    let isCurrent = true;
    const checkSavedData = async () => {
      setCheckedCountry(null);
      try {
        const hasData = await loadFromIndexedDB(selectedCountry);
        if (isCurrent) setSavedDataCountry(hasData ? selectedCountry : null);
      } catch (error) {
        if (isCurrent) {
          setSavedDataCountry(null);
          setError(error instanceof Error ? error.message : t('introduction.errors.loadFailed'));
        }
      } finally {
        if (isCurrent) setCheckedCountry(selectedCountry);
      }
    };
    void checkSavedData();
    return () => {
      isCurrent = false;
    };
  }, [loadFromIndexedDB, selectedCountry, t]);

  useEffect(() => {
    setNow(Date.now());

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Lazy load logo with delay to improve FCP/LCP
  useEffect(() => {
    const logoTimer = setTimeout(() => {
      setShowLogo(true);
    }, 100);
    return () => clearTimeout(logoTimer);
  }, []);
  
  const formatTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return '';
    const seconds = Math.floor((now - timestamp) / 1000);
    const formatUnit = (value: number, unit: Intl.NumberFormatOptions['unit']) =>
      new Intl.NumberFormat(i18n.language, { style: 'unit', unit, unitDisplay: 'short' }).format(value);
    if (seconds < 60) return formatUnit(seconds, 'second');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return formatUnit(minutes, 'minute');
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return formatUnit(hours, 'hour');
    const days = Math.floor(hours / 24);
    return formatUnit(days, 'day');
  };
  
  const handleConfirmClear = async () => {
    setError('');
    try {
      await clearData();
    } catch (error) {
      setError(error instanceof Error ? error.message : t('introduction.errors.clearFailed'));
      setShowConfirmModal(false);
      setPendingAction(null);
      return;
    }

    setShowConfirmModal(false);
    setSavedDataCountry(null);
    
    // Execute the pending action
    if (pendingAction === 'manual') {
      executeManualEntry();
    } else if (pendingAction === 'download') {
      executeDownloadTemplate();
    } else if (pendingAction === 'import') {
      executeImport();
    }
    setPendingAction(null);
  };
  
  const handleCancelClear = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
    setFile(null); // Clear file selection if import was cancelled
  };
  
  const executeDownloadTemplate = async () => {
    try {
      setError('');
      await generateTemplate();
    } catch {
      setError(t('introduction.errors.templateFailed'));
    }
  };
  
  const executeImport = async () => {
    if (!file) {
      setError(t('introduction.errors.selectFile'));
      return;
    }
    
    try {
      setError('');
      
      const data = await importData(file);
      setImportMode(true);
      
      // Update form data with imported data
      Object.entries(data).forEach(([section, sectionData]) => {
        updateFormData(section, sectionData);
      });
      
      navigate('/form');
    } catch (error) {
      setError(error instanceof Error ? error.message : t('introduction.errors.importFailed'));
    }
  };
  
  const executeManualEntry = () => {
    setImportMode(false);
    navigate('/form');
  };
  
  const handleDownloadTemplate = async () => {
    await executeDownloadTemplate();
  };

  const handleImport = async () => {
    if (hasSavedData) {
      setPendingAction('import');
      setShowConfirmModal(true);
    } else {
      executeImport();
    }
  };
  
  const handleManualEntry = () => {
    if (hasSavedData) {
      setPendingAction('manual');
      setShowConfirmModal(true);
    } else {
      executeManualEntry();
    }
  };

  const handleResumeSession = async () => {
    const hasData = await loadFromIndexedDB(selectedCountry);
    setSavedDataCountry(hasData ? selectedCountry : null);
    if (hasData) navigate('/form');
  };

  const countryFlagSrc = publicAsset(`flags/${selectedCountry.toLowerCase()}.svg`);
  
  return (
    <>
      <Container size="md" py="xl">
        <Stack gap="xl">
          <div className="introduction-brand">
            <Title 
              order={1} 
              c="slate.8" 
              mb="md"
              className="introduction-brand-title"
            >
              <Group
                gap="sm"
                align="center"
                className={`introduction-brand-assets${showLogo ? ' is-visible' : ''}`}
              >
                <img
                  src={publicAsset(brand.logoAsset)}
                  alt={brand.name}
                  loading="lazy"
                  className="brand-logo"
                />
                <Box className="brand-separator" />
                <img
                  src={countryFlagSrc}
                  alt={selectedCountry}
                  loading="lazy"
                  className="brand-country-flag"
                />
              </Group>
            </Title>
            <Stack gap="xs" align="center">
              <Text c="slate.6" size="lg">
                {brand.tagline}
              </Text>
              {brand.sourceUrl && (
                <a
                  href={brand.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  {t('app.viewSource')}
                </a>
              )}
            </Stack>
          </div>

          <LanguageSwitcher />
          
          <Alert 
            icon={<IconShieldLock size={20} />} 
            color="blue" 
            variant="light"
            title={t('introduction.privacy.title')}
          >
            <List size="sm" spacing="xs">
              <List.Item>{t('introduction.privacy.features.localStorage')}</List.Item>
              <List.Item>{t('introduction.privacy.features.noServer')}</List.Item>
              <List.Item>{t('introduction.privacy.features.autoDelete')}</List.Item>
              <List.Item>{t('introduction.privacy.features.noCloud')}</List.Item>
              <List.Item>{t('introduction.privacy.features.offline')}</List.Item>
            </List>
          </Alert>
          
          <Select
            label={t('introduction.country.label')}
            description={t('introduction.country.description')}
            data={getAvailableCountries().map(country => ({
              value: country.code,
              label: country.name
            }))}
            value={selectedCountry}
            onChange={(value) => value && setCountry(value)}
            required
            size="md"
          />
          
          {hasSavedData && (
            <Card withBorder padding="lg" bg="blue.0">
              <Group justify="space-between" align="flex-start" mb="sm">
                <div>
                  <Group gap="xs" mb={4}>
                    <IconClockHour4 size={20} color="var(--mantine-color-blue-6)" />
                    <Title order={4} c="blue.8">
                      {t('introduction.start.resumeSession')}
                    </Title>
                  </Group>
                  <Text size="sm" c="blue.7">
                    {t('introduction.start.resumeDescription')}
                  </Text>
                  {lastSaveTime && (
                    <Text size="xs" c="blue.6" mt={4}>
                      {t('introduction.start.lastSaved', { time: formatTimeAgo(lastSaveTime) })}
                    </Text>
                  )}
                </div>
              </Group>
              <Button
                fullWidth
                size="lg"
                onClick={handleResumeSession}
                color="blue"
                variant="filled"
              >
                {t('introduction.start.resumeSession')}
              </Button>
            </Card>
          )}
          
          <Card withBorder padding="lg" bg="slate.0">
            <Title order={4} mb="md" c="slate.8">
              {t('introduction.start.title')}
            </Title>
            
            <Stack gap="md">
              <Button
                fullWidth
                size="lg"
                leftSection={<IconEdit size={20} />}
                onClick={handleManualEntry}
                variant="filled"
                color="blue"
                disabled={isGenerating || isImporting || isCheckingSavedData}
                loading={isCheckingSavedData}
              >
                {t('introduction.start.manualEntry')}
              </Button>
              
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Button
                  variant="light"
                  leftSection={<IconFileDownload size={18} />}
                  onClick={handleDownloadTemplate}
                  disabled={isGenerating || isImporting}
                  loading={isGenerating}
                >
                  {t('introduction.start.downloadTemplate')}
                </Button>
                
                <FileButton 
                  onChange={setFile} 
                  accept=".xlsx,.xls"
                  disabled={isGenerating || isImporting || isCheckingSavedData}
                >
                  {(props) => (
                    <Button
                      {...props}
                      variant="outline"
                      leftSection={<IconFileUpload size={18} />}
                    >
                      {file ? t('introduction.start.fileSelected') : t('introduction.start.importExcel')}
                    </Button>
                  )}
                </FileButton>
              </SimpleGrid>
              
              {file && (
                <Alert color="teal" variant="light">
                  <Text size="sm" fw={500}>
                    {t('introduction.start.selectedFile', { filename: file.name })}
                  </Text>
                  <Text size="xs" c="slate.6">
                    {t('introduction.start.fileSize', {
                      size: new Intl.NumberFormat(i18n.language, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(file.size / 1024),
                    })}
                  </Text>
                </Alert>
              )}
              
              {file && (
                <Button
                  fullWidth
                  onClick={handleImport}
                  color="teal"
                  size="lg"
                  loading={isImporting || isCheckingSavedData}
                  disabled={isCheckingSavedData}
                >
                  {t('introduction.start.importContinue')}
                </Button>
              )}
            </Stack>
          </Card>
          
          {error && (
            <Alert 
              color="red" 
              onClose={() => setError('')}
              withCloseButton
              icon={<IconAlertTriangle size={18} />}
            >
              {error}
            </Alert>
          )}
          
          <Alert icon={<IconInfoCircle size={18} />} color="gray" variant="light">
            <Text size="sm">
              <strong>{t('introduction.howItWorks.title')}</strong> {t('introduction.howItWorks.description')}
            </Text>
          </Alert>
        </Stack>
      </Container>
      
      <Modal
        opened={showConfirmModal}
        onClose={handleCancelClear}
        title={t('introduction.start.confirmClear.title')}
        centered
        size="md"
      >
        <Stack gap="md">
          <Alert color="orange" icon={<IconAlertTriangle size={18} />}>
            {t('introduction.start.confirmClear.message')}
          </Alert>
          
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={handleCancelClear}
            >
              {t('introduction.start.confirmClear.cancel')}
            </Button>
            <Button
              color="red"
              onClick={handleConfirmClear}
              loading={isGenerating || isImporting}
            >
              {t('introduction.start.confirmClear.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
