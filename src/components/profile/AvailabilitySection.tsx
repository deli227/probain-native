
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { fr } from 'date-fns/locale';
import { AvailabilityValidation } from "./AvailabilityValidation";
import { useEffect, useRef } from "react";
import { useAvailabilities } from "@/hooks/use-availabilities";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { safeGetUser } from "@/utils/asyncHelpers";

interface AvailabilitySectionProps {
  isAvailable: boolean;
  isAlwaysAvailable: boolean;
  showSpecificDates: boolean;
  selectedDates: Date[];
  toggleAvailability: () => void;
  toggleAlwaysAvailable: () => void;
  handleSpecificDatesToggle: () => void;
  handleDateSelect: (dates: Date[] | undefined) => void;
}

export const AvailabilitySection = ({
  isAvailable,
  isAlwaysAvailable,
  showSpecificDates,
  selectedDates,
  toggleAvailability,
  toggleAlwaysAvailable,
  handleSpecificDatesToggle,
  handleDateSelect,
}: AvailabilitySectionProps) => {
  const { fetchAvailabilities } = useAvailabilities();
  const { toast } = useToast();
  const hasLoadedRef = useRef(false);

  // Charger les disponibilités UNE SEULE FOIS quand le calendrier s'ouvre
  useEffect(() => {
    const loadAvailabilities = async () => {
      if (hasLoadedRef.current) return;  // Éviter les rechargements multiples

      try {
        const { data: { user } } = await safeGetUser(supabase, 5000);
        if (user) {
          const dates = await fetchAvailabilities(user.id);
          handleDateSelect(dates);
          hasLoadedRef.current = true;
        }
      } catch (error) {
        logger.error('Error loading availabilities:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos disponibilités",
          variant: "destructive",
        });
      }
    };

    if (showSpecificDates && !isAlwaysAvailable) {
      loadAvailabilities();
    }

    // Reset le flag quand on ferme le calendrier
    if (!showSpecificDates) {
      hasLoadedRef.current = false;
    }
  }, [showSpecificDates, isAlwaysAvailable]);

  const handleCalendarSelect = (dates: Date[] | undefined) => {
    handleDateSelect(dates || []);
  };

  const handleValidationSuccess = () => {
    // Fermer le calendrier (sans vider les dates)
    handleSpecificDatesToggle();

    toast({
      title: "Disponibilités enregistrées",
      description: "Vos disponibilités ont été mises à jour avec succès",
    });
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="px-4 md:px-6 lg:px-8 py-6">
        <h2 className="text-2xl md:text-3xl font-teko font-semibold italic text-white mb-4 uppercase text-center">DISPONIBILITÉ</h2>
        <div className="bg-white rounded-xl p-4 max-w-3xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">Définissez votre statut de disponibilité :</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={toggleAvailability}
                  className={`flex-1 max-w-xs mx-auto ${
                    isAvailable
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } font-semibold rounded-full transition-colors duration-200`}
                >
                  Je suis disponible
                </Button>
                <Button
                  onClick={toggleAvailability}
                  className={`flex-1 max-w-xs mx-auto ${
                    !isAvailable
                      ? 'bg-probain-red hover:bg-red-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } font-semibold rounded-full transition-colors duration-200`}
                >
                  Je ne suis pas disponible
                </Button>
              </div>
            </div>

            {isAvailable && (
              <div className="space-y-4">
                <Button
                  onClick={handleSpecificDatesToggle}
                  variant="outline"
                  className="w-full max-w-xs mx-auto block text-primary"
                >
                  {showSpecificDates ? "Masquer les options de disponibilité" : "Préciser mes disponibilités"}
                </Button>

                {showSpecificDates && (
                  <div className="space-y-4 border-t pt-4">
                    <Button
                      onClick={toggleAlwaysAvailable}
                      className={`w-full max-w-xs mx-auto block ${
                        isAlwaysAvailable
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      } font-semibold rounded-full transition-colors duration-200`}
                    >
                      Je suis disponible tout le temps
                    </Button>

                    {!isAlwaysAvailable && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600 mb-4 text-center">
                          Sélectionnez vos dates de disponibilité spécifiques dans le calendrier ci-dessous :
                          <br />
                          <span className="text-xs italic mt-1 block">
                            Cliquez sur les dates où vous êtes disponible
                          </span>
                        </p>
                        <div className="flex justify-center">
                          <Calendar
                            mode="multiple"
                            selected={selectedDates}
                            onSelect={handleCalendarSelect}
                            locale={fr}
                            className="rounded-md border mx-auto"
                            fromDate={new Date()}
                            classNames={{
                              head_cell: "text-primary font-normal text-sm",
                              cell: "relative h-9 w-9 p-0 focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-primary",
                              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer",
                              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                              day_today: "bg-accent text-accent-foreground",
                              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-primary cursor-pointer",
                              table: "w-full border-collapse",
                              caption: "relative flex items-center justify-center pt-1",
                              dropdown: "cursor-pointer bg-white border rounded-md p-1",
                              caption_dropdowns: "flex gap-2",
                              dropdown_month: "cursor-pointer bg-white border rounded-md p-1",
                              dropdown_year: "cursor-pointer bg-white border rounded-md p-1",
                              nav_button_previous: "absolute left-1",
                              nav_button_next: "absolute right-1",
                            }}
                          />
                        </div>
                        {selectedDates.length > 0 && (
                          <AvailabilityValidation
                            selectedDates={selectedDates}
                            onValidation={handleValidationSuccess}
                            onClear={() => handleDateSelect([])}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
