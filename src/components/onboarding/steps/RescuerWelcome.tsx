import { Button } from "@/components/ui/button";
import { Waves } from "lucide-react";

interface RescuerWelcomeProps {
  onNext: () => void;
}

export const RescuerWelcome = ({ onNext }: RescuerWelcomeProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 animate-scale-in">
      {/* Logo animé */}
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
          <Waves className="w-16 h-16 text-white animate-float" />
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
          Rejoins la communauté des <span className="text-probain-blue font-semibold">héros de l'eau</span> en quelques étapes simples.
        </p>
      </div>

      {/* Bouton CTA */}
      <Button
        onClick={onNext}
        size="lg"
        className="w-full max-w-xs bg-white text-primary hover:bg-white/90 font-bold text-lg py-6 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
      >
        C'EST PARTI !
      </Button>

    </div>
  );
};
