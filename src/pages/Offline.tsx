
import React from 'react';
import { Button } from '@/components/ui/button';
import { Wifi, RefreshCw } from 'lucide-react';

const Offline = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E2761] to-[#0A1033] p-4">
      <div className="max-w-md w-full backdrop-blur-xl bg-white/5 p-8 rounded-xl border border-white/10 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <Wifi className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Vous êtes hors ligne</h1>
          
          <p className="text-white/80 mb-6">
            Impossible de se connecter à ProBain. Vérifiez votre connexion internet et réessayez.
          </p>
          
          <div className="space-y-4 w-full">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full flex items-center justify-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser la page
            </Button>
            
            <div className="text-white/60 text-sm mt-4">
              <p>Certaines fonctionnalités restent disponibles en mode hors ligne :</p>
              <ul className="list-disc list-inside mt-2 text-left">
                <li>Consultation de vos informations de profil</li>
                <li>Accès aux données précédemment chargées</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Offline;
