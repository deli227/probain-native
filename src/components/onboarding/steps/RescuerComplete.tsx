import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface RescuerCompleteProps {
  firstName: string;
  onComplete: () => void;
  isSubmitting: boolean;
}

export const RescuerComplete = ({
  firstName,
  onComplete,
  isSubmitting,
}: RescuerCompleteProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 animate-scale-in">
      {/* Icône succès */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
      </div>

      {/* Message de succès */}
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          Bravo{firstName ? ` ${firstName}` : ""} !
        </h1>
        <p className="text-lg text-white/80 max-w-sm">
          Ton profil est prêt. Bienvenue dans la communauté Probain !
        </p>
      </div>

      {/* Points clés */}
      <div className="w-full max-w-xs space-y-3 mb-12">
        <div className="flex items-center gap-3 text-white/80">
          <div className="w-2 h-2 bg-white/60 rounded-full" />
          <span>Explore les offres d'emploi</span>
        </div>
        <div className="flex items-center gap-3 text-white/80">
          <div className="w-2 h-2 bg-white/60 rounded-full" />
          <span>Ajoute tes certifications</span>
        </div>
        <div className="flex items-center gap-3 text-white/80">
          <div className="w-2 h-2 bg-white/60 rounded-full" />
          <span>Définis tes disponibilités</span>
        </div>
      </div>

      {/* Bouton CTA */}
      <Button
        onClick={onComplete}
        disabled={isSubmitting}
        size="lg"
        className="w-full max-w-xs bg-white text-primary hover:bg-white/90 font-semibold text-lg py-6 rounded-full shadow-lg transition-all duration-300 disabled:opacity-50"
      >
        {isSubmitting ? "Chargement..." : "DÉCOUVRIR MON PROFIL"}
      </Button>
    </div>
  );
};
