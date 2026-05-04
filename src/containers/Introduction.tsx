import { useState, useEffect } from 'react';
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

interface IntroductionProps {
  onComplete: () => void;
}

/**
 * Introduction component following SOLID principles
 * - Single Responsibility: Only handles introduction UI and user choices
 * - Dependency Inversion: Uses hooks for all external dependencies
 */
export function Introduction({ onComplete }: IntroductionProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [hasSavedData, setHasSavedData] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'manual' | 'import' | 'download' | null>(null);
  
  const {
    selectedCountry,
    setCountry,
    setImportMode,
    updateFormData,
    loadFromIndexedDB,
    clearData,
    lastSaveTime,
  } = useAppStore();
  
  const { isGenerating, isImporting, generateTemplate, importData } = useExcelOperations();
  
  // Check for saved data on mount
  useEffect(() => {
    const checkSavedData = async () => {
      const hasData = await loadFromIndexedDB();
      setHasSavedData(hasData);
    };
    checkSavedData();
  }, [loadFromIndexedDB]);
  
  const formatTimeAgo = (timestamp: number | null) => {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };
  
  const handleConfirmClear = async () => {
    setShowConfirmModal(false);
    await clearData();
    setHasSavedData(false);
    
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
    } catch (err) {
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
      
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('introduction.errors.importFailed'));
    }
  };
  
  const executeManualEntry = () => {
    setImportMode(false);
    onComplete();
  };
  
  const handleDownloadTemplate = async () => {
    executeDownloadTemplate();
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
  
  const handleResumeSession = () => {
    // Data is already loaded, just proceed
    onComplete();
  };
  
  return (
    <>
      <Container size="md" py="xl">
        <Stack gap="xl">
          <div style={{ textAlign: 'center' }}>
            <Title 
              order={1} 
              c="slate.8" 
              mb="md"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}
            >
              <img
                src={publicAsset('logo.png')}
                alt="Onter"
                style={{ height: '40px' }}
              />
            </Title>
            <Stack gap="xs" align="center">
              <Text c="slate.6" size="lg">
                {t('app.tagline')}
              </Text>
              <a
                href="https://github.com/onterumahendra/onter"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2563eb', textDecoration: 'underline', fontSize: 14 }}
              >
                {t('app.viewSource')}
              </a>
            </Stack>
          </div>
          
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
                disabled={isGenerating || isImporting}
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
                  disabled={isGenerating || isImporting}
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
                    {t('introduction.start.fileSize', { size: (file.size / 1024).toFixed(2) })}
                  </Text>
                </Alert>
              )}
              
              {file && (
                <Button
                  fullWidth
                  onClick={handleImport}
                  color="teal"
                  size="lg"
                  loading={isImporting}
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
