import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Container, Title, Text, Button, Paper, Stack, Alert } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import i18n from '../i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo
    });
    
    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Container size="md" py="xl">
          <Paper p="xl" radius="md" withBorder shadow="sm">
            <Stack gap="lg" align="center">
              <IconAlertTriangle size={64} color="red" />
              
              <Title order={2} c="red.7">
                {i18n.t('errorBoundary.title')}
              </Title>
              
              <Text c="dimmed" ta="center">
                {i18n.t('errorBoundary.description')}
              </Text>
              
              {import.meta.env.DEV && this.state.error && (
                <Alert 
                  color="red" 
                  variant="light" 
                  icon={<IconAlertTriangle size={18} />}
                  title={i18n.t('errorBoundary.details')}
                  className="error-boundary-details"
                >
                  <Text size="sm" ff="monospace" className="error-boundary-stack">
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo && (
                    <Text size="xs" ff="monospace" c="dimmed" mt="xs" className="error-boundary-stack">
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </Alert>
              )}
              
              <Stack gap="sm">
                <Button
                  leftSection={<IconRefresh size={18} />}
                  onClick={this.handleReset}
                  variant="filled"
                  color="blue"
                >
                  {i18n.t('errorBoundary.tryAgain')}
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="light"
                  color="blue"
                >
                  {i18n.t('errorBoundary.reload')}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}
