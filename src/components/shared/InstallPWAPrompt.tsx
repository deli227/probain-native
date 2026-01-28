
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Download, X } from 'lucide-react';
import { checkInstallability } from '@/utils/registerServiceWorker';

export const InstallPWAPrompt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installationStatus, setInstallationStatus] = useState('attente');
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fermé la notification précédemment
    const userDismissed = localStorage.getItem('pwaPromptDismissed');
    if (userDismissed) {
      // Ne plus jamais montrer le prompt si l'utilisateur l'a déjà refusé
      return;
    }

    // Vérifier si l'app est déjà installée
    if (!checkInstallability()) {
      return;
    }

    // Attendre que le navigateur envoie l'événement 'beforeinstallprompt'
    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher l'apparition du prompt d'installation du navigateur
      e.preventDefault();
      // Stocker l'événement pour l'utiliser plus tard
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Montrer notre prompt personnalisé après un délai
      setTimeout(() => {
        if (!hasUserInteracted) {
          setIsOpen(true);
        }
      }, 10000); // 10 secondes après le chargement de la page
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Vérifier si l'installation a été complétée
    window.addEventListener('appinstalled', () => {
      setInstallationStatus('installé');
      setIsOpen(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [hasUserInteracted]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    setInstallationStatus('en_cours');
    
    // Afficher le prompt d'installation du navigateur
    deferredPrompt.prompt();
    
    // Attendre que l'utilisateur réponde au prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      setInstallationStatus('installé');
    } else {
      setInstallationStatus('refusé');
    }
    
    // Effacer l'événement car il ne peut être utilisé qu'une fois
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setHasUserInteracted(true);
    // Enregistrer la date de fermeture pour ne pas re-montrer le prompt immédiatement
    localStorage.setItem('pwaPromptDismissed', JSON.stringify({
      timestamp: new Date().toISOString()
    }));
  };

  if (!isInstallable) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-2xl flex items-center gap-2">
            <Download className="h-6 w-6 text-primary" />
            Installer l'application
          </SheetTitle>
          <SheetDescription className="text-lg">
            Installez ProBain sur votre appareil pour un accès plus rapide et une meilleure expérience.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="h-4 w-4 text-primary" />
              </div>
              <div>Accès rapide depuis votre écran d'accueil</div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10" />
                </svg>
              </div>
              <div>Fonctionnement même en mode hors connexion</div>
            </div>
          </div>
        </div>
        <SheetFooter className="flex sm:justify-between mt-4 flex-col sm:flex-row gap-4">
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Pas maintenant
          </Button>
          <Button 
            onClick={handleInstallClick} 
            disabled={!deferredPrompt || installationStatus === 'en_cours'} 
            className="flex-1 flex items-center justify-center"
          >
            {installationStatus === 'en_cours' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Installation...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Installer
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
