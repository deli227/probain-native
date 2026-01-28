import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAvailabilities } from "@/hooks/use-availabilities";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, X } from "lucide-react";
import { safeGetUser } from "@/utils/asyncHelpers";

interface AvailabilityValidationProps {
  selectedDates: Date[];
  onValidation: () => void;
  onClear?: () => void;
}

export const AvailabilityValidation = ({
  selectedDates,
  onValidation,
  onClear
}: AvailabilityValidationProps) => {
  const { saveAvailabilities, clearAvailabilities } = useAvailabilities();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleValidation = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await safeGetUser(supabase, 5000);

      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour enregistrer vos disponibilités",
          variant: "destructive",
        });
        return;
      }

      await saveAvailabilities(selectedDates, user.id);
      toast({
        title: "Succès",
        description: "Vos disponibilités ont été enregistrées avec succès",
      });
      onValidation();
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la validation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = async () => {
    try {
      setIsClearing(true);
      const { data: { user } } = await safeGetUser(supabase, 5000);

      if (!user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté",
          variant: "destructive",
        });
        return;
      }

      await clearAvailabilities(user.id);

      if (onClear) {
        onClear();
      }

      toast({
        title: "Succès",
        description: "Toutes vos disponibilités ont été effacées",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'effacer les disponibilités",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="mt-4">
      <p className="text-sm text-gray-600 mb-2">
        Dates sélectionnées :
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {selectedDates.map((date) => (
          <span
            key={date.toISOString()}
            className="inline-block bg-primary/10 text-primary text-sm px-3 py-1 rounded-full"
          >
            {format(date, 'dd MMMM yyyy', { locale: fr })}
          </span>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="flex-1 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-700"
          onClick={handleClearAll}
          disabled={isClearing || isSaving}
        >
          {isClearing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Effacement...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Effacer toutes les dates
            </>
          )}
        </Button>
        <Button
          className="flex-1 bg-primary hover:bg-primary/90 text-white"
          onClick={handleValidation}
          disabled={isSaving || isClearing}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            `Valider (${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''})`
          )}
        </Button>
      </div>
    </div>
  );
};