import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, ChevronLeft } from "lucide-react";

interface TrainerOrganizationProps {
  organizationName: string;
  onOrganizationNameChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  locked?: boolean;
}

export const TrainerOrganization = ({
  organizationName,
  onOrganizationNameChange,
  onNext,
  onBack,
  locked = false,
}: TrainerOrganizationProps) => {
  const isValid = organizationName.length >= 2;

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
        <Building2 className="w-10 h-10 text-white" />
      </div>

      {/* Titre */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Nom de votre organisme
        </h2>
        <p className="text-white/60">
          Comment s'appelle votre centre de formation ?
        </p>
      </div>

      {/* Formulaire */}
      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">
            Nom de l'organisation <span className="text-red-400">*</span>
          </label>
          <Input
            value={organizationName}
            onChange={(e) => !locked && onOrganizationNameChange(e.target.value)}
            readOnly={locked}
            placeholder="Ex: École de Natation Suisse"
            className={`h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg rounded-xl transition-all ${
              locked
                ? 'opacity-80 cursor-not-allowed'
                : 'focus:bg-white/15 focus:border-white/40'
            }`}
          />
          {locked && (
            <p className="text-white/50 text-xs mt-1">
              Ce nom a été défini lors de la création de votre compte
            </p>
          )}
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
      </div>
    </div>
  );
};
