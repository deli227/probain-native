
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          // Verifier les mises a jour du SW toutes les 5 minutes
          setInterval(() => registration.update(), 5 * 60 * 1000);

          // Quand un nouveau SW est detecte, attendre qu'il s'active puis reload
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              // Le nouveau SW est actif ET il y avait deja un ancien SW controlant la page
              if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                window.location.reload();
              }
            });
          });
        })
        .catch(error => {
          console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister();
    });
  }
}

// Fonction pour demander la permission des notifications
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Fonction pour vérifier si l'app peut être installée
export function checkInstallability() {
  if (!window.matchMedia('(display-mode: standalone)').matches) {
    return true; // L'app n'est pas encore installée
  }
  return false; // L'app est déjà installée
}
