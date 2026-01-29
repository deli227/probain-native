import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { formationFormSchema } from "@/components/profile/forms/FormationForm";
import { logger } from "@/utils/logger";
import { safeGetUser } from "@/utils/asyncHelpers";
import { findTrainerIdByOrganizationName } from "@/hooks/use-organizations";

// Clé de requête pour les formations
const FORMATIONS_QUERY_KEY = ['formations'];

// Fonction pour récupérer les formations
const fetchFormationsData = async (userId?: string) => {
  let effectiveUserId = userId;

  if (!effectiveUserId) {
    const { data: { user }, error: authError } = await safeGetUser(supabase, 5000);
    if (authError) throw authError;

    if (!user) {
      logger.error('[useFormations] Utilisateur non authentifié');
      throw new Error('Utilisateur non authentifié');
    }

    effectiveUserId = user.id;
  }

  logger.log('[useFormations] Récupération des formations pour l\'utilisateur:', effectiveUserId);

  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .eq('user_id', effectiveUserId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  logger.log('[useFormations] Formations récupérées:', data);
  return data || [];
};

/**
 * Résout le nom de l'organisation de recyclage.
 * Si "__autre__" est sélectionné, utilise le nom custom.
 */
function resolveRecyclingOrg(
  recyclingOrganization?: string,
  customRecyclingOrganization?: string
): string | null {
  if (!recyclingOrganization || recyclingOrganization === "") return null;
  if (recyclingOrganization === "__autre__" && customRecyclingOrganization) {
    return customRecyclingOrganization.trim();
  }
  return recyclingOrganization;
}

/**
 * Synchronise le lien trainer_students pour le recyclage.
 * - Si previousOrg existait et a changé → supprime l'ancien lien
 * - Si newOrg est défini → crée ou met à jour le lien
 */
async function syncTrainerStudentLink(
  studentId: string,
  trainingType: string,
  trainingDate: string | null,
  newOrg: string | null,
  previousOrg: string | null
) {
  try {
    // 1. Si l'ancien org a changé, supprimer l'ancien lien
    if (previousOrg && previousOrg !== newOrg) {
      const oldTrainerId = await findTrainerIdByOrganizationName(previousOrg);
      if (oldTrainerId) {
        logger.log('[syncTrainerStudentLink] Suppression ancien lien:', { oldTrainerId, studentId, trainingType });
        await supabase
          .from('trainer_students')
          .delete()
          .eq('trainer_id', oldTrainerId)
          .eq('student_id', studentId)
          .eq('training_type', trainingType);
      }
    }

    // 2. Si nouveau org défini, créer/mettre à jour le lien
    if (newOrg && trainingDate) {
      const newTrainerId = await findTrainerIdByOrganizationName(newOrg);
      if (newTrainerId) {
        // Vérifier si un lien existe déjà
        const { data: existing } = await supabase
          .from('trainer_students')
          .select('id')
          .eq('trainer_id', newTrainerId)
          .eq('student_id', studentId)
          .eq('training_type', trainingType)
          .maybeSingle();

        if (existing) {
          // Mettre à jour la date
          logger.log('[syncTrainerStudentLink] Mise à jour lien existant:', existing.id);
          await supabase
            .from('trainer_students')
            .update({ training_date: trainingDate })
            .eq('id', existing.id);
        } else {
          // Créer un nouveau lien
          logger.log('[syncTrainerStudentLink] Création nouveau lien:', { newTrainerId, studentId, trainingType });
          await supabase
            .from('trainer_students')
            .insert({
              trainer_id: newTrainerId,
              student_id: studentId,
              training_type: trainingType,
              training_date: trainingDate,
              certification_issued: true,
            });
        }
      } else {
        logger.log('[syncTrainerStudentLink] Aucun formateur inscrit trouvé pour:', newOrg);
      }
    }
  } catch (error) {
    // Ne pas bloquer la mutation principale si la sync échoue
    logger.error('[syncTrainerStudentLink] Erreur (non bloquante):', error);
  }
}

export const useFormations = (userId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Utilisation de useQuery pour récupérer les formations avec caching automatique
  const {
    data: formations = [],
    isLoading,
    error,
    refetch: fetchFormations,
  } = useQuery({
    queryKey: [...FORMATIONS_QUERY_KEY, userId],
    queryFn: () => fetchFormationsData(userId),
    enabled: true, // La requête s'exécute automatiquement
  });

  // Afficher un toast en cas d'erreur
  if (error) {
    logger.error('[useFormations] Erreur lors de la récupération des formations:', error);
    toast({
      title: "Erreur",
      description: "Impossible de charger les formations",
      variant: "destructive",
    });
  }

  // Mutation pour ajouter une formation
  const addFormationMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formationFormSchema>) => {
      logger.log('[useFormations] Début de l\'ajout d\'une formation:', values);

      const { data: { user }, error: authError } = await safeGetUser(supabase, 5000);
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      const documentUrl = values.documentUrl;
      logger.log('[useFormations] URL du document à utiliser:', documentUrl);

      // Vérifier si un document a été sélectionné mais pas encore uploadé
      if (values.document && !documentUrl) {
        logger.warn('[useFormations] Document sélectionné mais pas encore uploadé, tentative sans document');

        toast({
          title: "Document non uploadé",
          description: "Le document n'a pas pu être uploadé. La formation sera enregistrée sans document.",
          variant: "default",
        });
      }

      const title = values.certificationType === "Autre diplôme" && values.customCertification
        ? `Autre: ${values.customCertification}`
        : values.certificationType;

      const recyclingOrg = resolveRecyclingOrg(values.recyclingOrganization, values.customRecyclingOrganization);
      const endDateStr = values.endDate ? values.endDate.toISOString().split('T')[0] : null;

      const insertData = {
        user_id: user.id,
        title: title,
        organization: values.organization,
        start_date: values.startDate.toISOString().split('T')[0],
        end_date: endDateStr,
        document_url: documentUrl,
        recycling_organization: recyclingOrg,
      };

      logger.log('[useFormations] Données à insérer:', insertData);

      const { error: insertError, data: insertedData } = await supabase
        .from('formations')
        .insert([insertData])
        .select();

      if (insertError) throw insertError;

      // Synchroniser le lien trainer_students pour le recyclage
      if (recyclingOrg && endDateStr) {
        await syncTrainerStudentLink(user.id, title, endDateStr, recyclingOrg, null);
      }

      return insertedData;
    },
    onSuccess: () => {
      // Invalider le cache pour forcer un refetch
      queryClient.invalidateQueries({ queryKey: FORMATIONS_QUERY_KEY });
      toast({
        title: "Succès",
        description: "La formation a été ajoutée avec succès",
      });
    },
    onError: (error: unknown) => {
      logger.error('[useFormations] Erreur lors de l\'ajout de la formation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'ajout de la formation",
        variant: "destructive",
      });
    },
  });

  const addFormation = async (values: z.infer<typeof formationFormSchema>) => {
    try {
      await addFormationMutation.mutateAsync(values);
      return true;
    } catch {
      return false;
    }
  };

  // Mutation pour mettre à jour une formation
  const updateFormationMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: z.infer<typeof formationFormSchema> }) => {
      logger.log('[useFormations] Début de la mise à jour de la formation:', id, values);

      const { data: { user }, error: authError } = await safeGetUser(supabase, 5000);
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      // Récupérer l'ancien recycling_organization avant la mise à jour
      const { data: oldFormation } = await supabase
        .from('formations')
        .select('recycling_organization, title')
        .eq('id', id)
        .single();
      const previousRecyclingOrg = oldFormation?.recycling_organization || null;

      const documentUrl = values.documentUrl;

      const title = values.certificationType === "Autre diplôme" && values.customCertification
        ? `Autre: ${values.customCertification}`
        : values.certificationType;

      const recyclingOrg = resolveRecyclingOrg(values.recyclingOrganization, values.customRecyclingOrganization);
      const endDateStr = values.endDate ? values.endDate.toISOString().split('T')[0] : null;

      const updateData: any = {
        user_id: user.id,
        title: title,
        organization: values.organization,
        start_date: values.startDate.toISOString().split('T')[0],
        end_date: endDateStr,
        recycling_organization: recyclingOrg,
      };

      if (documentUrl) {
        updateData.document_url = documentUrl;
      }

      logger.log('[useFormations] Données à mettre à jour:', updateData);

      const { error: updateError, data: updatedData } = await supabase
        .from('formations')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (updateError) throw updateError;

      // Synchroniser le lien trainer_students
      // Si endDate supprimé et ancien org existait → cleanup
      if (!endDateStr && previousRecyclingOrg) {
        await syncTrainerStudentLink(user.id, title, null, null, previousRecyclingOrg);
      } else {
        await syncTrainerStudentLink(user.id, title, endDateStr, recyclingOrg, previousRecyclingOrg);
      }

      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMATIONS_QUERY_KEY });
      toast({
        title: "Succès",
        description: "La formation a été modifiée avec succès",
      });
    },
    onError: (error: unknown) => {
      logger.error('[useFormations] Erreur lors de la mise à jour de la formation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la modification",
        variant: "destructive",
      });
    },
  });

  const updateFormation = async (id: string, values: z.infer<typeof formationFormSchema>) => {
    try {
      await updateFormationMutation.mutateAsync({ id, values });
      return true;
    } catch {
      return false;
    }
  };

  // Mutation pour supprimer une formation
  const deleteFormationMutation = useMutation({
    mutationFn: async (id: string) => {
      logger.log('[useFormations] Début de la suppression de la formation:', id);
      const { data: { user }, error: authError } = await safeGetUser(supabase, 5000);
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      // Récupérer les infos avant suppression pour cleanup trainer_students
      const { data: formationData } = await supabase
        .from('formations')
        .select('title, recycling_organization, end_date')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('formations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Cleanup du lien trainer_students si recycling_organization existait
      if (formationData?.recycling_organization) {
        await syncTrainerStudentLink(
          user.id,
          formationData.title,
          null,
          null,
          formationData.recycling_organization
        );
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMATIONS_QUERY_KEY });
      toast({
        title: "Succès",
        description: "La formation a été supprimée avec succès",
      });
    },
    onError: (error: unknown) => {
      logger.error('[useFormations] Erreur lors de la suppression de la formation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    },
  });

  const deleteFormation = async (id: string) => {
    await deleteFormationMutation.mutateAsync(id);
  };

  return {
    formations,
    isLoading,
    fetchFormations,
    addFormation,
    updateFormation,
    deleteFormation,
    isUploading: addFormationMutation.isPending || updateFormationMutation.isPending || deleteFormationMutation.isPending,
  };
};
