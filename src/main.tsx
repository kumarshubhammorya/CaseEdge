import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './lib/AuthContext';
import { AppProvider } from './context/AppContext';
import { telemetry } from './lib/telemetry';
import './index.css';

// Initialize telemetry and error tracking (Sentry and global listeners)
telemetry.init();


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </StrictMode>,
);
