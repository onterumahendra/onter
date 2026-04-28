import { useState, useEffect, lazy, Suspense } from 'react';
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
  const [showIntro, setShowIntro] = useState(true);
  const initializeFromStorage = useAppStore(state => state.initializeFromStorage);
  
  useEffect(() => {
    // Cleanup expired data and initialize from storage on mount only
    const initializeApp = async () => {
      await cleanupExpiredData();
      await initializeFromStorage();
    };
    
    initializeApp();
  }, [initializeFromStorage]);
  
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
      {showIntro ? (
        <Introduction onComplete={() => setShowIntro(false)} />
      ) : (
        <FormStepper onBackToIntro={() => setShowIntro(true)} />
      )}
    </Suspense>
  );
}

export default App;
