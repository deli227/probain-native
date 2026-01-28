import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, ChevronLeft } from "lucide-react";

interface RescuerIdentityProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const RescuerIdentity = ({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  onNext,
  onBack,
  onSkip,
}: RescuerIdentityProps) => {
  const isValid = firstName.length >= 2 && lastName.length >= 2;

  return (
    <div className="flex-1 flex flex-col px-6 pt-4 animate-slide-up">
      {/* Bouton retour */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-white/60 hover:text-white transition-colors mb-8 self-start"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm">Retour</span>
      </button>

      {/* Icône */}
      <div className="w-20 h-20 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 mx-auto mb-8">
        <User className="w-10 h-10 text-white" />
      </div>

      {/* Titre */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Comment tu t'appelles ?
        </h2>
        <p className="text-white/60">
          Ces informations seront visibles sur ton profil
        </p>
      </div>

      {/* Formulaire */}
      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">Prénom</label>
          <Input
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="Ton prénom"
            className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg rounded-xl focus:bg-white/15 focus:border-white/40 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">Nom</label>
          <Input
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Ton nom"
            className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg rounded-xl focus:bg-white/15 focus:border-white/40 transition-all"
          />
        </div>
      </div>

      {/* Boutons */}
      <div className="pb-8 pt-4 space-y-3">
        <Button
          onClick={onNext}
          disabled={!isValid}
          size="lg"
          className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6 rounded-full shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          CONTINUER
        </Button>
        <button
          onClick={onSkip}
          className="w-full text-white/60 hover:text-white text-sm py-2 transition-colors"
        >
          Passer cette étape
        </button>
      </div>
    </div>
  );
};
