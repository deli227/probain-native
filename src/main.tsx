import React, { Component, useState, useEffect, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import App from './App.tsx'
import './index.css'
import { LoadingScreen } from './components/shared/LoadingScreen.tsx'
import * as serviceWorker from './utils/registerServiceWorker'
import { queryClient } from './lib/queryClient'

// Console mobile Eruda - pour débugger sur téléphone
if (import.meta.env.DEV) {
  import('eruda').then(eruda => {
    eruda.default.init();
    console.log('[Eruda] Console mobile activée - cliquez sur le bouton vert en bas à droite');
  });
}

// Composant de gestion des erreurs (vrai ErrorBoundary avec class)
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-primary-dark">
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold mb-4">Une erreur est survenue</h1>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-primary px-4 py-2 rounded-md hover:bg-gray-100"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Gestion de l'état de connexion
const NetworkStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50">
          Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.
        </div>
      )}
      {children}
    </>
  );
};

const root = createRoot(document.getElementById("root")!)

root.render(
  <Suspense fallback={<LoadingScreen />}>
    <QueryClientProvider client={queryClient}>
      <NetworkStatusProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </NetworkStatusProvider>
      {/* React Query Devtools - uniquement en développement */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </Suspense>
);

// Enregistrer le service worker
serviceWorker.register();
