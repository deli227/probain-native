import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/native';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        hapticFeedback('success');
        setShowReconnected(true);
        // Masquer le message "reconnecté" après 3 secondes
        setTimeout(() => {
          setShowReconnected(false);
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      hapticFeedback('warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Ne rien afficher si on est en ligne et pas de message de reconnexion
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300',
        !isOnline
          ? 'bg-red-500 text-white'
          : 'bg-green-500 text-white',
        'animate-in slide-in-from-top duration-300'
      )}
      style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Pas de connexion internet</span>
        </>
      ) : (
        <>
          <Wifi className="w-4 h-4" />
          <span>Connexion rétablie</span>
        </>
      )}
    </div>
  );
}
