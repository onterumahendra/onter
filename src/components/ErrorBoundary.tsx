import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Container, Title, Text, Button, Paper, Stack, Alert } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

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
                Oops! Something went wrong
              </Title>
              
              <Text c="dimmed" ta="center">
                We encountered an unexpected error. Your data is safe in your browser.
                You can try refreshing the page or contact support if the problem persists.
              </Text>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert 
                  color="red" 
                  variant="light" 
                  icon={<IconAlertTriangle size={18} />}
                  title="Error Details (Development Only)"
                  style={{ width: '100%', maxWidth: '600px' }}
                >
                  <Text size="sm" ff="monospace" style={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo && (
                    <Text size="xs" ff="monospace" c="dimmed" mt="xs" style={{ whiteSpace: 'pre-wrap' }}>
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
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleReload}
                  variant="light"
                  color="blue"
                >
                  Reload Page
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
