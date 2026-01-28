import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, ChevronLeft } from "lucide-react";

interface TrainerDescriptionProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const TrainerDescription = ({
  description,
  onDescriptionChange,
  onNext,
  onBack,
  onSkip,
}: TrainerDescriptionProps) => {
  const isValid = description.length >= 10;

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
        <FileText className="w-10 h-10 text-white" />
      </div>

      {/* Titre */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Présentez-vous
        </h2>
        <p className="text-white/60">
          Décrivez votre organisme et vos formations
        </p>
      </div>

      {/* Formulaire */}
      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">
            Description <span className="text-white/40">(recommandé)</span>
          </label>
          <Textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Présentez votre organisme, vos formations, votre expertise..."
            className="min-h-[180px] bg-white/10 border-white/20 text-white placeholder:text-white/40 text-base rounded-xl focus:bg-white/15 focus:border-white/40 transition-all resize-none"
          />
          <p className="text-white/40 text-xs text-right">
            {description.length} caractères
          </p>
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
