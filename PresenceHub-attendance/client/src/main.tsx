import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './App';
import { applyTheme, readThemePreference, resolveTheme } from './utils/theme';
import './index.css';

// Apply the saved theme before first render (index.html does this pre-paint too).
applyTheme(resolveTheme(readThemePreference()));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster
      position="top-right"
      containerStyle={{ top: 68, right: 16 }}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-card)',
          color: 'var(--color-fg)',
          border: '1px solid var(--color-line)',
          boxShadow: 'var(--shadow-md)',
          borderRadius: '10px',
          padding: '10px 14px',
          fontSize: '14px',
          maxWidth: '420px',
        },
        success: { iconTheme: { primary: 'var(--color-success)', secondary: 'var(--color-card)' } },
        error: { iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--color-card)' }, duration: 6000 },
      }}
    />
  </React.StrictMode>
);
