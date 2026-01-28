import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

interface TrainerWelcomeProps {
  onNext: () => void;
}

export const TrainerWelcome = ({ onNext }: TrainerWelcomeProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 animate-scale-in">
      {/* Logo animé */}
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
          <GraduationCap className="w-16 h-16 text-white animate-float" />
        </div>
        {/* Cercles décoratifs */}
        <div className="absolute -inset-4 border-2 border-white/10 rounded-full animate-pulse-ring" />
      </div>

      {/* Texte de bienvenue */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Bienvenue !
        </h1>
        <p className="text-lg text-white/80 max-w-sm">
          Votre organisme de formation rejoint la communauté <span className="text-indigo-300 font-semibold">Probain</span>.
        </p>
        <p className="text-white/60 max-w-sm">
          Quelques étapes simples pour créer votre profil formateur.
        </p>
      </div>

      {/* Bouton CTA */}
      <Button
        onClick={onNext}
        size="lg"
        className="w-full max-w-xs bg-white text-primary hover:bg-white/90 font-bold text-lg py-6 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
      >
        COMMENCER
      </Button>
    </div>
  );
};
