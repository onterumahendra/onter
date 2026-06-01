import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { cleanupExpiredData } from './utils/indexedDB';
import { useAppStore } from './store/appStore';
import { Container, Loader, Center, Stack, Text } from '@mantine/core';

// Lazy load components for code splitting
const Introduction = lazy(() => import('./containers/Introduction').then(m => ({ default: m.Introduction })));
const FormStepper = lazy(() => import('./containers/FormStepper').then(m => ({ default: m.FormStepper })));

/**
 * Main App component following SOLID principles
 * - Single Responsibility: Only handles app-level routing
 * - Open/Closed: Easy to extend with new routes
 */
function App() {
  const initializeFromStorage = useAppStore(state => state.initializeFromStorage);
  
  useEffect(() => {
    // Cleanup expired data and initialize from storage on mount only
    const initializeApp = async () => {
      await cleanupExpiredData();
      await initializeFromStorage();
    };
    
    initializeApp();
  }, [initializeFromStorage]);

  useEffect(() => {
    // Prefetch FormStepper chunk after a short idle delay.
    // The 2s wait lets the Introduction finish painting and its assets load
    // before we consume bandwidth on a slow connection.
    const timer = setTimeout(() => {
      import('./containers/FormStepper');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <Suspense fallback={
      <Container size="sm" py="xl">
        <Center style={{ minHeight: '100vh' }}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Loading...</Text>
          </Stack>
        </Center>
      </Container>
    }>
      <Routes>
        <Route path="/" element={<Introduction />} />
        <Route path="/form" element={<FormStepper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
