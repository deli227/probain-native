import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { formationFormSchema } from "@/components/profile/forms/FormationForm";
import { logger } from "@/utils/logger";
import { safeGetUser } from "@/utils/asyncHelpers";
import { findTrainerIdByOrganizationName } from "@/hooks/use-organizations";
import type { Database } from "@/integrations/supabase/types";

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
 * Synchronise le lien trainer_students.
 * Les liens ne sont JAMAIS supprimés (un formateur garde toujours ses élèves).
 * - Si org est défini → crée ou met à jour le lien
 */
async function syncTrainerStudentLink(
  studentId: string,
  trainingType: string,
  trainingDate: string,
  org: string
) {
  try {
    const trainerId = await findTrainerIdByOrganizationName(org);
    if (!trainerId) {
      logger.log('[syncTrainerStudentLink] Aucun formateur inscrit trouvé pour:', org);
      return;
    }

    // Vérifier si un lien existe déjà
    const { data: existing } = await supabase
      .from('trainer_students')
      .select('id')
      .eq('trainer_id', trainerId)
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
      logger.log('[syncTrainerStudentLink] Création nouveau lien:', { trainerId, studentId, trainingType });
      await supabase
        .from('trainer_students')
        .insert({
          trainer_id: trainerId,
          student_id: studentId,
          training_type: trainingType,
          training_date: trainingDate,
          certification_issued: true,
        });
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

      // Synchroniser le lien trainer_students pour l'organisme initial
      if (values.organization) {
        const startDateStr = values.startDate.toISOString().split('T')[0];
        await syncTrainerStudentLink(user.id, title, startDateStr, values.organization);
      }

      // Synchroniser le lien trainer_students pour le recyclage
      if (recyclingOrg && endDateStr) {
        await syncTrainerStudentLink(user.id, title, endDateStr, recyclingOrg);
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

      const documentUrl = values.documentUrl;

      const title = values.certificationType === "Autre diplôme" && values.customCertification
        ? `Autre: ${values.customCertification}`
        : values.certificationType;

      const recyclingOrg = resolveRecyclingOrg(values.recyclingOrganization, values.customRecyclingOrganization);
      const endDateStr = values.endDate ? values.endDate.toISOString().split('T')[0] : null;

      const updateData: Database['public']['Tables']['formations']['Update'] = {
        user_id: user.id,
        title: title,
        organization: values.organization,
        start_date: values.startDate.toISOString().split('T')[0],
        end_date: endDateStr,
        recycling_organization: recyclingOrg,
      };

      updateData.document_url = documentUrl || null;

      logger.log('[useFormations] Données à mettre à jour:', updateData);

      const { error: updateError, data: updatedData } = await supabase
        .from('formations')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (updateError) throw updateError;

      // Synchroniser le lien trainer_students pour l'organisme initial
      if (values.organization) {
        const startDateStr = values.startDate.toISOString().split('T')[0];
        await syncTrainerStudentLink(user.id, title, startDateStr, values.organization);
      }

      // Synchroniser le lien trainer_students pour le recyclage
      if (recyclingOrg && endDateStr) {
        await syncTrainerStudentLink(user.id, title, endDateStr, recyclingOrg);
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

      const { error } = await supabase
        .from('formations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Les liens trainer_students ne sont PAS supprimés :
      // un formateur garde toujours ses anciens élèves

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
