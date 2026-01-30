import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export const useAvailabilities = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const saveAvailabilities = useCallback(async (dates: Date[], userId: string) => {
    try {
      setLoading(true);
      logger.log('Saving availabilities for dates:', dates);

      // Delete existing availabilities for this user
      const { error: deleteError } = await supabase
        .from('availabilities')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        logger.error('Error deleting availabilities:', deleteError);
        throw deleteError;
      }

      // Only proceed with insert if there are dates to save
      if (dates.length > 0) {
        // Préparer les données — utiliser date locale (pas UTC) pour éviter décalage timezone
        const availabilitiesData = dates.map(date => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return {
            user_id: userId,
            date: `${y}-${m}-${d}`,
            is_available: true
          };
        });

        logger.log('Inserting new availabilities:', availabilitiesData);

        const { error: insertError } = await supabase
          .from('availabilities')
          .insert(availabilitiesData);

        if (insertError) {
          logger.error('Error inserting availabilities:', insertError);
          throw insertError;
        }
      }

      // Toast success - géré par le composant appelant pour éviter les doublons
      // toast({
      //   title: "Succès",
      //   description: "Vos disponibilités ont été enregistrées",
      // });
    } catch (error) {
      logger.error('Error saving availabilities:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement des disponibilités",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAvailabilities = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      logger.log('Fetching availabilities for user:', userId);

      const { data, error } = await supabase
        .from('availabilities')
        .select('*')
        .eq('user_id', userId)
        .eq('is_available', true);

      if (error) {
        logger.error('Error fetching availabilities:', error);
        throw error;
      }

      logger.log('Fetched availabilities:', data);
      // Créer les dates en local (pas UTC) pour éviter le décalage de timezone
      // "2026-01-31" doit devenir le 31 janvier local, pas le 30 janvier 23h UTC
      return data.map(item => {
        const [year, month, day] = item.date.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
    } catch (error) {
      logger.error('Error fetching availabilities:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les disponibilités",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearAvailabilities = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      logger.log('Clearing all availabilities for user:', userId);

      const { error } = await supabase
        .from('availabilities')
        .delete()
        .eq('user_id', userId);

      if (error) {
        logger.error('Error clearing availabilities:', error);
        throw error;
      }

      logger.log('All availabilities cleared successfully');
    } catch (error) {
      logger.error('Error clearing availabilities:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effacer les disponibilités",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    saveAvailabilities,
    fetchAvailabilities,
    clearAvailabilities
  };
};