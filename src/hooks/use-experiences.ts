import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { experienceFormSchema } from "@/components/profile/forms/ExperienceForm";
import { logger } from "@/utils/logger";
import { safeGetUser } from "@/utils/asyncHelpers";
import { formatDateLocal } from "@/utils/dateUtils";

// Clé de requête pour les expériences
const EXPERIENCES_QUERY_KEY = ['experiences'];

// Fonction pour récupérer les expériences
const fetchExperiencesData = async (userId?: string) => {
  let effectiveUserId = userId;

  if (!effectiveUserId) {
    const { data: { user }, error: authError } = await safeGetUser(supabase, 5000);
    if (authError) throw authError;

    if (!user) {
      logger.error('[useExperiences] Utilisateur non authentifié');
      throw new Error('Utilisateur non authentifié');
    }

    effectiveUserId = user.id;
  }

  logger.log('[useExperiences] Récupération des expériences pour l\'utilisateur:', effectiveUserId);

  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('user_id', effectiveUserId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  logger.log('[useExperiences] Expériences récupérées:', data);
  return data || [];
};

export const useExperiences = (userId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Utilisation de useQuery pour récupérer les expériences avec caching automatique
  const {
    data: experiences = [],
    isLoading,
    error,
    refetch: fetchExperiences,
  } = useQuery({
    queryKey: [...EXPERIENCES_QUERY_KEY, userId],
    queryFn: () => fetchExperiencesData(userId),
    enabled: true,
  });

  // Afficher un toast en cas d'erreur
  if (error) {
    logger.error('[useExperiences] Erreur lors de la récupération des expériences:', error);
  }

  // Mutation pour ajouter une expérience
  const addExperienceMutation = useMutation({
    mutationFn: async (values: z.infer<typeof experienceFormSchema>) => {
      logger.log('[useExperiences] Début de l\'ajout d\'une expérience:', values);

      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error('Non authentifié');

      const documentUrl = values.documentUrl;
      logger.log('[useExperiences] URL du document:', documentUrl);

      const { error: insertError, data: insertedData } = await supabase
        .from('experiences')
        .insert([{
          user_id: user.id,
          title: values.title,
          location: values.location,
          start_date: formatDateLocal(values.startDate),
          end_date: values.contractType === 'CDD' ? formatDateLocal(values.endDate) : null,
          document_url: documentUrl || null,
          contract_type: values.contractType,
        }])
        .select();

      if (insertError) throw insertError;
      return insertedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPERIENCES_QUERY_KEY });
      toast({
        title: "Succès",
        description: "L'expérience a été ajoutée avec succès",
      });
    },
    onError: (error: unknown) => {
      logger.error('[useExperiences] Error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const addExperience = async (values: z.infer<typeof experienceFormSchema>) => {
    try {
      await addExperienceMutation.mutateAsync(values);
      return true;
    } catch {
      return false;
    }
  };

  // Mutation pour mettre à jour une expérience
  const updateExperienceMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: z.infer<typeof experienceFormSchema> }) => {
      logger.log('[useExperiences] Début de la mise à jour de l\'expérience:', id, values);

      const { data: { user }, error: authError } = await safeGetUser(supabase, 5000);
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      const documentUrl = values.documentUrl;

      const updateData = {
        user_id: user.id,
        title: values.title,
        location: values.location,
        start_date: formatDateLocal(values.startDate),
        end_date: values.contractType === 'CDD' ? formatDateLocal(values.endDate) : null,
        document_url: documentUrl || null,
        contract_type: values.contractType,
      };

      logger.log('[useExperiences] Données à mettre à jour:', updateData);

      const { error: updateError, data: updatedData } = await supabase
        .from('experiences')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (updateError) throw updateError;
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPERIENCES_QUERY_KEY });
      toast({
        title: "Succès",
        description: "L'expérience a été modifiée avec succès",
      });
    },
    onError: (error: unknown) => {
      logger.error('[useExperiences] Error updating experience:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la modification",
        variant: "destructive",
      });
    },
  });

  const updateExperience = async (id: string, values: z.infer<typeof experienceFormSchema>) => {
    try {
      await updateExperienceMutation.mutateAsync({ id, values });
      return true;
    } catch {
      return false;
    }
  };

  // Mutation pour supprimer une expérience
  const deleteExperienceMutation = useMutation({
    mutationFn: async (id: string) => {
      logger.log('[useExperiences] Suppression de l\'expérience:', id);
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPERIENCES_QUERY_KEY });
      toast({
        title: "Succès",
        description: "L'expérience a été supprimée avec succès",
      });
    },
    onError: (error: unknown) => {
      logger.error('[useExperiences] Error deleting experience:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    },
  });

  const deleteExperience = async (id: string) => {
    await deleteExperienceMutation.mutateAsync(id);
  };

  return {
    experiences,
    isLoading,
    fetchExperiences,
    addExperience,
    updateExperience,
    deleteExperience,
    isUploading: addExperienceMutation.isPending || updateExperienceMutation.isPending || deleteExperienceMutation.isPending,
  };
};
