import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { useAvailabilities } from "@/hooks/use-availabilities";
import { useProfile } from "@/contexts/ProfileContext";

/**
 * useRescuerAvailability - Gestion complete de la disponibilite sauveteur
 *
 * Extrait de Profile.tsx pour separer la logique metier de l'UI.
 * Gere : toggle disponible/indisponible, toujours disponible, dates specifiques,
 * calcul de la pastille verte/rouge du jour.
 */
export function useRescuerAvailability() {
  const { toast } = useToast();
  const { fetchAvailabilities } = useAvailabilities();
  const { baseProfile, rescuerProfile, refreshProfile } = useProfile();

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isAvailable, setIsAvailable] = useState(rescuerProfile?.availability_status ?? true);
  const [showSpecificDates, setShowSpecificDates] = useState(false);
  const [isAlwaysAvailable, setIsAlwaysAvailable] = useState(rescuerProfile?.is_always_available ?? false);
  const [isActuallyAvailableToday, setIsActuallyAvailableToday] = useState(rescuerProfile?.is_always_available ?? false);
  const [userAvailabilityDates, setUserAvailabilityDates] = useState<Date[]>([]);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const hasInitializedRef = useRef(!!rescuerProfile);

  // Initialiser les etats de disponibilite depuis le context (une seule fois)
  useEffect(() => {
    if (rescuerProfile && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (rescuerProfile.availability_status !== null) {
        setIsAvailable(rescuerProfile.availability_status);
      }
      if (rescuerProfile.is_always_available !== null) {
        setIsAlwaysAvailable(rescuerProfile.is_always_available);
      }
    }
  }, [rescuerProfile]);

  // Charger les disponibilites specifiques depuis la BDD
  useEffect(() => {
    const loadAvailabilities = async () => {
      if (!baseProfile?.id) return;
      const dates = await fetchAvailabilities(baseProfile.id);
      setUserAvailabilityDates(dates);
    };

    loadAvailabilities();
  }, [baseProfile?.id, fetchAvailabilities, availabilityVersion]);

  // Calculer la disponibilite du jour a partir des etats LOCAUX (pas du context)
  useEffect(() => {
    if (!baseProfile?.id) return;

    let availableToday = false;

    if (!isAvailable) {
      availableToday = false;
    } else if (isAlwaysAvailable) {
      availableToday = true;
    } else if (userAvailabilityDates.length > 0) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      availableToday = userAvailabilityDates.some(date => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return dateStr === todayStr;
      });
    } else {
      availableToday = true;
    }

    setIsActuallyAvailableToday(availableToday);
  }, [isAvailable, isAlwaysAvailable, userAvailabilityDates, baseProfile?.id]);

  const setAvailability = useCallback(async (newStatus: boolean) => {
    if (!baseProfile?.id) return;
    if (newStatus === isAvailable) return;

    setIsAvailable(newStatus);

    if (!newStatus) {
      setIsActuallyAvailableToday(false);
      setShowSpecificDates(false);
      setSelectedDates([]);
      setIsAlwaysAvailable(false);
    }

    try {
      const { error } = await supabase
        .from('rescuer_profiles')
        .update({
          availability_status: newStatus,
          ...(!newStatus && { is_always_available: false })
        })
        .eq('id', baseProfile.id);

      if (error) {
        setIsAvailable(!newStatus);
        throw error;
      }

      toast({
        title: "Statut mis à jour",
        description: newStatus ? "Vous êtes maintenant disponible" : "Vous êtes maintenant indisponible",
      });

      await refreshProfile();
    } catch (error) {
      logger.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre statut de disponibilité",
        variant: "destructive",
      });
    }
  }, [baseProfile?.id, isAvailable, toast, refreshProfile]);

  const toggleAlwaysAvailable = useCallback(async () => {
    if (!baseProfile?.id) return;

    const newIsAlwaysAvailable = !isAlwaysAvailable;

    setIsAlwaysAvailable(newIsAlwaysAvailable);

    if (newIsAlwaysAvailable) {
      setSelectedDates([]);
      setIsAvailable(true);
    } else {
      setShowSpecificDates(false);
    }

    try {
      const { error } = await supabase
        .from('rescuer_profiles')
        .update({
          is_always_available: newIsAlwaysAvailable,
          ...(newIsAlwaysAvailable && { availability_status: true })
        })
        .eq('id', baseProfile.id);

      if (error) {
        setIsAlwaysAvailable(!newIsAlwaysAvailable);
        throw error;
      }

      toast({
        title: "Disponibilité mise à jour",
        description: newIsAlwaysAvailable ? "Vous êtes disponible tout le temps" : "Disponibilités spécifiques activées",
      });

      await refreshProfile();
    } catch (error) {
      logger.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre disponibilité",
        variant: "destructive",
      });
    }
  }, [baseProfile?.id, isAlwaysAvailable, toast, refreshProfile]);

  const handleDateSelect = useCallback((dates: Date[] | undefined) => {
    setSelectedDates(dates || []);
  }, []);

  const handleSpecificDatesToggle = useCallback(async () => {
    if (!baseProfile?.id) return;

    const newShowSpecificDates = !showSpecificDates;
    setShowSpecificDates(newShowSpecificDates);

    if (newShowSpecificDates) {
      setIsAlwaysAvailable(false);
      setIsAvailable(true);

      try {
        const { error } = await supabase
          .from('rescuer_profiles')
          .update({
            is_always_available: false,
            availability_status: true,
          })
          .eq('id', baseProfile.id);

        if (error) {
          setShowSpecificDates(false);
          throw error;
        }
      } catch (error) {
        logger.error("Erreur:", error);
        toast({
          title: "Erreur",
          description: "Impossible d'activer les dates spécifiques",
          variant: "destructive",
        });
      }
    } else {
      setSelectedDates([]);
    }
  }, [baseProfile?.id, showSpecificDates, toast]);

  const incrementAvailabilityVersion = useCallback(() => {
    setAvailabilityVersion(v => v + 1);
  }, []);

  return {
    // State
    isAvailable,
    isAlwaysAvailable,
    isActuallyAvailableToday,
    showSpecificDates,
    selectedDates,
    // Actions
    setAvailability,
    toggleAlwaysAvailable,
    handleDateSelect,
    handleSpecificDatesToggle,
    incrementAvailabilityVersion,
  };
}
