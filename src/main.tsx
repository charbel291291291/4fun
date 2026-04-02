import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './lib/ErrorBoundary.tsx';
import { ToastProvider } from './lib/ErrorToast.tsx';
import { initServices } from './services/init';

// Initialize all services (monitoring, rate limiting, backup)
initServices();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
