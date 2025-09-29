// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from '../src/Context/AuthContext.tsx'; // Import AuthProvider
import { NotificationProvider } from '../src/Context/NotificationContext.tsx'; // Import NotificationProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationProvider> {/* Wrap with NotificationProvider */}
      <AuthProvider> {/* Wrap your App with AuthProvider */}
        <App />
      </AuthProvider>
    </NotificationProvider>
  </React.StrictMode>,
);