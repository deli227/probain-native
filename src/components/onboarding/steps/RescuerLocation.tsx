import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, ChevronLeft } from "lucide-react";
import { CANTONS_SUISSES } from "../OnboardingWizard";

interface RescuerLocationProps {
  street: string;
  cityZip: string;
  canton: string;
  onStreetChange: (value: string) => void;
  onCityZipChange: (value: string) => void;
  onCantonChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const RescuerLocation = ({
  street,
  cityZip,
  canton,
  onStreetChange,
  onCityZipChange,
  onCantonChange,
  onNext,
  onBack,
  onSkip,
}: RescuerLocationProps) => {
  // Canton optionnel maintenant
  const hasCanton = canton.length >= 2;

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
        <MapPin className="w-10 h-10 text-white" />
      </div>

      {/* Titre */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Où es-tu basé ?
        </h2>
        <p className="text-white/60">
          Pour te proposer des missions près de chez toi
        </p>
      </div>

      {/* Formulaire */}
      <div className="space-y-4 flex-1">
        {/* Canton (recommandé) */}
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">
            Canton <span className="text-white/40">(recommandé)</span>
          </label>
          <Select value={canton} onValueChange={onCantonChange}>
            <SelectTrigger className="h-14 bg-white/10 border-white/20 text-white rounded-xl">
              <SelectValue placeholder="Sélectionne ton canton" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {CANTONS_SUISSES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* NPA/Ville (optionnel) */}
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">
            NPA / Ville <span className="text-white/40">(optionnel)</span>
          </label>
          <Input
            value={cityZip}
            onChange={(e) => onCityZipChange(e.target.value)}
            placeholder="Ex: 1200 Genève"
            className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg rounded-xl focus:bg-white/15 focus:border-white/40 transition-all"
          />
        </div>

        {/* Rue (optionnel) */}
        <div className="space-y-2">
          <label className="text-white/80 text-sm font-medium">
            Adresse <span className="text-white/40">(optionnel)</span>
          </label>
          <Input
            value={street}
            onChange={(e) => onStreetChange(e.target.value)}
            placeholder="Rue et numéro"
            className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg rounded-xl focus:bg-white/15 focus:border-white/40 transition-all"
          />
        </div>
      </div>

      {/* Boutons */}
      <div className="pb-8 pt-4 space-y-3">
        <Button
          onClick={onNext}
          size="lg"
          className="w-full bg-white text-primary hover:bg-white/90 font-bold text-lg py-6 rounded-full shadow-xl transition-all duration-300"
        >
          {hasCanton ? "TERMINER" : "TERMINER SANS LOCALISATION"}
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
