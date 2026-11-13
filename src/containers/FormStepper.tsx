/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-unused-vars, react/set-state-in-effect, no-floating-promises */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Stack,
  Title,
  Text,
  Button,
  Paper,
  Progress,
  Badge,
  Box,
  Container,
  Notification,
  Modal,
  Alert,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconCheck, IconChevronRight, IconArrowLeft, IconArrowRight, IconPlayerSkipForward, IconDownload, IconAlertTriangle, IconDeviceFloppy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { useDebounce } from '../hooks/useDebounce';
import { useFormConfig } from '../hooks/useFormConfig';
import { createValidationService } from '../services/validationService';
import { SimpleFieldsContainer } from './FormFields/SimpleFieldsContainer';
import { TableFieldsContainer } from './FormFields/TableFieldsContainer';
import { ComplexFieldsContainer } from './FormFields/ComplexFieldsContainer';
import { downloadFormAsZip } from '../utils/zipService';
import { publicAsset } from '../utils/paths';
import { brand } from '../branding';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import i18n from '../i18n';

/**
 * Progress Stats Component - Shows saving status and progress percentage
 */
interface ProgressStatsProps {
  isSaving: boolean;
  lastSaveTime: number | null;
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
  variant: 'mobile' | 'desktop';
  t: (key: string, params?: any) => string;
}

function ProgressStats({ 
  isSaving, 
  lastSaveTime, 
  completedSteps, 
  totalSteps, 
  progressPercentage, 
  variant,
  t 
}: ProgressStatsProps) {
  const formattedProgress = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(progressPercentage / 100);

  if (variant === 'mobile') {
    return (
      <Group gap="xs" wrap="nowrap">
        {isSaving && (
          <Badge color="blue" variant="light" size="sm">
            {t('formStepper.saving')}
          </Badge>
        )}
        <Badge color="blue" variant="filled" size="sm">
          {formattedProgress}
        </Badge>
      </Group>
    );
  }

  return (
    <Group gap="xs" wrap="wrap" justify="flex-end">
      {isSaving && (
        <Badge color="blue" variant="light" leftSection={<IconDeviceFloppy size={12} />}>
          {t('formStepper.saving')}
        </Badge>
      )}
      {lastSaveTime && !isSaving && (
        <Text size="xs" c="slate.5">
          {t('formStepper.saved', { time: new Date(lastSaveTime).toLocaleTimeString(i18n.language) })}
        </Text>
      )}
      <Text size="sm" c="slate.5">
        {t('formStepper.progress', { 
          completed: completedSteps, 
          total: totalSteps 
        })}
      </Text>
      <Badge color="blue" variant="light">
        {formattedProgress}
      </Badge>
    </Group>
  );
}

/**
 * Refactored FormStepper following SOLID principles
 * - Single Responsibility: Only handles stepper UI and navigation
 * - Dependency Inversion: Uses hooks for all external dependencies
 */
export function FormStepper() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [exportError, setExportError] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const validationService = useMemo(() => createValidationService(), []);

  // State management
  const {
    selectedCountry,
    currentStep,
    formData,
    setStep,
    saveToIndexedDB,
    clearData,
    lastSaveTime,
  } = useAppStore();

  // Custom hooks
  const { formSections, isLoading: isLoadingConfig } = useFormConfig();
  const debouncedFormData = useDebounce(formData, 2000);

  const currentSection = formSections[currentStep];

  // Type for row data to avoid 'any'
  interface RowData {
    [key: string]: string | number | boolean | null | undefined;
  }

  // Auto-save effect
  useEffect(() => {
    if (Object.keys(debouncedFormData).length > 0) {
      setIsSaving(true);
      saveToIndexedDB().finally(() => {
        setTimeout(() => setIsSaving(false), 500);
      });
    }
  }, [debouncedFormData, saveToIndexedDB]);

  const validateCurrentSection = (): boolean => {
    if (!currentSection) return true;

    const errors: string[] = [];
    const sectionData = formData[currentSection.section];

    switch (currentSection.type) {
      case 'simple': {
        // Validate simple fields
        const values = sectionData || {};
        const fieldErrors = validationService.validateAllFields(currentSection.fields, values);
        
        Object.values(fieldErrors).forEach((error) => {
          errors.push(error);
        });
        break;
      }

      case 'table': {
        const sectionTableData = sectionData || {};
        const rows = sectionTableData.rows || [];
        const minRows = currentSection.minRows || 0;
        let validRowCount = 0;

        // Validate each row that has data and count valid rows
        rows.forEach((row: RowData, index: number) => {
          const hasData = currentSection.columns.some(col => 
            row[col.name] != null && row[col.name] !== ''
          );
          
          if (hasData) {
            const rowErrors = validationService.validateAllFields(currentSection.columns, row);
            if (Object.keys(rowErrors).length === 0) {
              validRowCount++;
            } else {
              Object.values(rowErrors).forEach((error) => {
                errors.push(t('formStepper.validation.rowError', { row: index + 1, error }));
              });
            }
          }
        });

        // Check minimum rows requirement (only count fully valid rows)
        if (minRows > 0 && validRowCount < minRows) {
          errors.push(t(
            minRows === 1
              ? 'formStepper.validation.minimumRowsOne'
              : 'formStepper.validation.minimumRowsOther',
            { min: minRows },
          ));
        }
        break;
      }

      case 'complex': {
        const complexData = sectionData || {};
        
        currentSection.structure.forEach((struct) => {
          const rows = complexData[struct.title] || [];
          const minRows = struct.minRows || 0;
          let validRowCount = 0;

          // Validate each row that has data and count valid rows
          rows.forEach((row: RowData, index: number) => {
            const hasData = struct.columns.some(col => 
              row[col.name] != null && row[col.name] !== ''
            );
            
            if (hasData) {
              const rowErrors = validationService.validateAllFields(struct.columns, row);
              if (Object.keys(rowErrors).length === 0) {
                validRowCount++;
              } else {
                Object.values(rowErrors).forEach((error) => {
                  errors.push(t('formStepper.validation.complexRowError', {
                    section: struct.title,
                    row: index + 1,
                    error,
                  }));
                });
              }
            }
          });

          // Check minimum rows requirement for this subsection (only count fully valid rows)
          if (minRows > 0 && validRowCount < minRows) {
            errors.push(t(
              minRows === 1
                ? 'formStepper.validation.complexMinimumRowsOne'
                : 'formStepper.validation.complexMinimumRowsOther',
              { section: struct.title, min: minRows },
            ));
          }
        });
        break;
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (currentStep < formSections.length - 1) {
      // Clear previous validation errors
      setValidationErrors([]);
      
      // Validate current section
      const isValid = validateCurrentSection();
      
      if (!isValid) {
        // Scroll to top to show validation errors
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Proceed to next step
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setStep(currentStep + 1);
      if (isMobile) close();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      // Clear validation errors when going back
      setValidationErrors([]);
      setStep(currentStep - 1);
      if (isMobile) close();
    }
  };

  const handleSkip = () => {
    if (currentStep < formSections.length - 1) {
      // Clear validation errors when skipping
      setValidationErrors([]);
      setSkippedSteps(prev => new Set([...prev, currentStep]));
      setStep(currentStep + 1);
      if (isMobile) close();
    }
  };

  const handleSubmit = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setShowExportModal(true);
  };

  const handleExport = async () => {
      try {
        setIsExporting(true);
        
        // Download both Excel and PDF in a zip file
        await downloadFormAsZip(
          formData, 
          selectedCountry, 
          completedSteps, 
          skippedSteps
        );
        
        setShowSuccess(true);
        setShowExportModal(false);
        
        // Clear data after export and navigate back to intro
        await clearData();
        setCompletedSteps(new Set());
        setSkippedSteps(new Set());
        setStep(0);
        
        // Navigate back to intro after successful export
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : t('formStepper.export.error.defaultMessage');
        setExportError(errorMessage);
      } finally {
        setIsExporting(false);
      }
    };

  const goToStep = (index: number) => {
    setStep(index);
    if (isMobile) close();
  };

  const progressPercentage = ((completedSteps.size + skippedSteps.size) / formSections.length) * 100;
  const countryFlagSrc = publicAsset(`flags/${selectedCountry.toLowerCase()}.svg`);

  const renderSectionContent = () => {
    if (!currentSection) return null;

    switch (currentSection.type) {
      case 'simple':
        return (
          <SimpleFieldsContainer
            fields={currentSection.fields}
            sectionName={currentSection.section}
          />
        );

      case 'table':
        return (
          <TableFieldsContainer
            columns={currentSection.columns}
            sectionName={currentSection.section}
            minRows={currentSection.minRows}
            maxRows={currentSection.maxRows}
          />
        );

      case 'complex':
        return (
          <ComplexFieldsContainer
            structure={currentSection.structure}
            sectionName={currentSection.section}
          />
        );

      default:
        return null;
    }
  };

  const getStepIcon = (index: number) => {
    if (completedSteps.has(index)) {
      return <IconCheck size={16} />;
    }
    if (skippedSteps.has(index)) {
      return <IconPlayerSkipForward size={16} />;
    }
    return null;
  };

  const getStepColor = (index: number) => {
    if (completedSteps.has(index)) return 'teal';
    if (skippedSteps.has(index)) return 'gray';
    if (index === currentStep) return 'blue';
    return undefined;
  };

  // Show loading state
  if (isLoadingConfig || formSections.length === 0) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <Title order={3}>{t('formStepper.loading')}</Title>
            <Text c="dimmed">
              {t('formStepper.loadingDescription', { country: selectedCountry })}
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header className="form-shell-header">
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm" align="center">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <img 
              src={publicAsset(brand.logoAsset)}
              alt={brand.name}
              className="form-brand-logo"
              onClick={() => navigate('/')}
              title={t('formStepper.header.backToHome')}
            />
            <Box className="brand-separator" />
            <img
              src={countryFlagSrc}
              alt={selectedCountry}
              className="brand-country-flag"
            />
          </Group>
          
          {/* Mobile: Show progress stats in header */}
          {isMobile && (
            <ProgressStats
              isSaving={isSaving}
              lastSaveTime={lastSaveTime}
              completedSteps={completedSteps.size + skippedSteps.size}
              totalSteps={formSections.length}
              progressPercentage={progressPercentage}
              variant="mobile"
              t={t}
            />
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" bg="slate.0">
        <AppShell.Section>
          <LanguageSwitcher />
          <Text size="xs" fw={600} c="slate.5" mb="xs" tt="uppercase">
            {t('formStepper.sections')}
          </Text>
          <Progress
            value={progressPercentage}
            size="sm"
            radius="xl"
            mb="md"
            color="blue"
            classNames={{ root: 'form-step-progress' }}
          />
        </AppShell.Section>

        <AppShell.Section grow component="nav" className="form-step-navigation">
          <Stack gap={4}>
            {formSections.map((section, index) => (
              <NavLink
                key={index}
                label={section.section}
                description={t('formStepper.stepLabel', {
                  current: index + 1,
                  total: formSections.length,
                })}
                active={index === currentStep}
                onClick={() => goToStep(index)}
                leftSection={getStepIcon(index)}
                rightSection={index === currentStep ? <IconChevronRight size={16} className="rtl-mirror" /> : null}
                color={getStepColor(index)}
                variant={index === currentStep ? 'filled' : 'light'}
                classNames={{
                  root: 'form-step-nav-link',
                  label: 'form-step-nav-label',
                  description: 'form-step-nav-description',
                }}
              />
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Paper p="sm" withBorder bg="white" radius="md">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="xs" c="slate.5">{t('formStepper.stats.completed')}</Text>
                <Badge size="sm" color="teal" variant="light">
                  {completedSteps.size}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="slate.5">{t('formStepper.stats.skipped')}</Text>
                <Badge size="sm" color="gray" variant="light">
                  {skippedSteps.size}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="slate.5">{t('formStepper.stats.remaining')}</Text>
                <Badge size="sm" color="blue" variant="light">
                  {formSections.length - completedSteps.size - skippedSteps.size}
                </Badge>
              </Group>
            </Stack>
          </Paper>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main bg="white" pt={isMobile ? '86px' : '16px'} className="form-shell-main">
        <Container size="xl" className="form-shell-container">
          {showSuccess && (
            <Notification
              icon={<IconCheck size={18} />}
              color="teal"
              title={t('formStepper.success.title')}
              onClose={() => setShowSuccess(false)}
              mb="xl"
              classNames={{
                root: 'form-success-notification',
                title: 'form-success-notification-title',
                description: 'form-success-notification-description',
              }}
            >
              {t('formStepper.success.message')}
            </Notification>
          )}

          {/* Export Error Notification */}
          {exportError && (
            <Notification
              icon={<IconAlertTriangle size={18} />}
              color="red"
              title={t('formStepper.export.error.title')}
              onClose={() => setExportError(null)}
              mb="xl"
            >
              {exportError}
            </Notification>
          )}

          <Box className="form-step-content">
            <Stack gap="xl">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert
                  icon={<IconAlertTriangle size={18} />}
                  title={t('formStepper.validation.title')}
                  color="red"
                  variant="light"
                  withCloseButton
                  onClose={() => setValidationErrors([])}
                >
                  <Stack gap="xs">
                    <Text size="sm">{t('formStepper.validation.message')}</Text>
                    <Stack gap={4}>
                      {validationErrors.map((error, index) => (
                        <Text key={index} size="sm" c="red.7">
                          • {error}
                        </Text>
                      ))}
                    </Stack>
                  </Stack>
                </Alert>
              )}

              <Box className="form-current-section">
                <Box className="form-current-section-title">
                  <Title order={4} c="slate.8" mb="xs">
                    {currentSection?.section}
                  </Title>
                  {currentSection?.description && (
                    <Text c="slate.5" size="sm">
                      {currentSection.description}
                    </Text>
                  )}
                </Box>

                {!isMobile && (
                  <Box className="form-current-section-progress">
                    <ProgressStats
                      isSaving={isSaving}
                      lastSaveTime={lastSaveTime}
                      completedSteps={completedSteps.size + skippedSteps.size}
                      totalSteps={formSections.length}
                      progressPercentage={progressPercentage}
                      variant="desktop"
                      t={t}
                    />
                  </Box>
                )}
              </Box>

              {renderSectionContent()}
            </Stack>
          </Box>

          {/* Fixed Navigation Buttons */}
          <Box className="form-fixed-navigation">
            <Container size={isMobile ? 'xs' : 'xl'} fluid={isMobile} p={0}>
              <Group className="form-navigation-buttons">
                <Button
                  leftSection={<IconArrowLeft size={16} className="rtl-mirror" />}
                  variant="default"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  size={isMobile ? 'xs' : 'sm'}
                  className="form-navigation-button"
                >
                  {t('formStepper.navigation.previous')}
                </Button>

                <Group className="form-navigation-actions">
                  {currentStep < formSections.length - 1 && (
                    <Button
                      leftSection={<IconPlayerSkipForward size={16} className="rtl-mirror" />}
                      variant="subtle"
                      onClick={handleSkip}
                      color="gray"
                      size={isMobile ? 'xs' : 'sm'}
                      className="form-navigation-button"
                    >
                      {t('formStepper.navigation.skip')}
                    </Button>
                  )}

                  {currentStep < formSections.length - 1 ? (
                    <Button
                      rightSection={<IconArrowRight size={16} className="rtl-mirror" />}
                      onClick={handleNext}
                      size={isMobile ? 'xs' : 'sm'}
                      className="form-navigation-button"
                    >
                      {t('formStepper.navigation.next')}
                    </Button>
                  ) : (
                    <Button
                      rightSection={<IconDownload size={16} />}
                      onClick={handleSubmit}
                      color="teal"
                      size={isMobile ? 'xs' : 'sm'}
                      className="form-navigation-button"
                    >
                      {t('formStepper.navigation.exportData')}
                    </Button>
                  )}
                </Group>
              </Group>
            </Container>
          </Box>
        </Container>
      </AppShell.Main>

      {/* Export Confirmation Modal */}
      <Modal
        opened={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={t('formStepper.export.title')}
        centered
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconAlertTriangle size={18} />} color="orange" variant="light">
            <Text size="sm" fw={500} mb="xs">{t('formStepper.export.warning.title')}</Text>
            <Text size="sm">{t('formStepper.export.warning.message')}</Text>
          </Alert>

          <Paper p="md" withBorder bg="slate.0">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" c="slate.6">{t('formStepper.export.stats.totalSections')}</Text>
                <Text size="sm" fw={600}>{formSections.length}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="slate.6">{t('formStepper.export.stats.completed')}</Text>
                <Badge color="teal" variant="light">{completedSteps.size}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="slate.6">{t('formStepper.export.stats.skipped')}</Text>
                <Badge color="gray" variant="light">{skippedSteps.size}</Badge>
              </Group>
            </Stack>
          </Paper>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setShowExportModal(false)}>
              {t('formStepper.export.cancel')}
            </Button>
            <Button
              onClick={handleExport}
              loading={isExporting}
              leftSection={<IconDownload size={18} />}
              color="teal"
            >
              {t('formStepper.export.confirm')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppShell>
  );
}
