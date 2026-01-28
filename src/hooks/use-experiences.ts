import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { experienceFormSchema } from "@/components/profile/forms/ExperienceForm";
import { logger } from "@/utils/logger";
import { safeGetUser } from "@/utils/asyncHelpers";

export const useExperiences = () => {
  const { toast } = useToast();
  const [experiences, setExperiences] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchExperiences = async () => {
    try {
      const { data: { user }, error: authError } = await safeGetUser(supabase, 5000);
      if (authError) throw authError;
      if (!user) {
        logger.error('[useExperiences] Utilisateur non authentifié');
        return;
      }

      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      logger.log('[useExperiences] Expériences récupérées:', data);
      setExperiences(data || []);
    } catch (error) {
      logger.error('[useExperiences] Erreur lors de la récupération des expériences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les expériences",
        variant: "destructive",
      });
    }
  };

  const addExperience = async (values: z.infer<typeof experienceFormSchema>) => {
    try {
      logger.log('[useExperiences] Début de l\'ajout d\'une expérience:', values);
      setIsUploading(true);
      
      const { data: { user } } = await safeGetUser(supabase, 5000);
      if (!user) throw new Error('Non authentifié');

      const documentUrl = values.documentUrl;
      logger.log('[useExperiences] URL du document:', documentUrl);

      const { error: insertError } = await supabase
        .from('experiences')
        .insert([{
          user_id: user.id,
          title: values.title,
          location: values.location,
          start_date: values.startDate.toISOString().split('T')[0],
          end_date: values.contractType === 'CDD' ? values.endDate?.toISOString().split('T')[0] : null,
          document_url: documentUrl,
          contract_type: values.contractType,
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Succès",
        description: "L'expérience a été ajoutée avec succès",
      });

      await fetchExperiences();
      return true;
    } catch (error) {
      logger.error('[useExperiences] Error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const updateExperience = async (id: string, values: z.infer<typeof experienceFormSchema>) => {
    try {
      logger.log('[useExperiences] Début de la mise à jour de l\'expérience:', id, values);
      setIsUploading(true);
      
      const { data: { user }, error: authError } = await safeGetUser(supabase, 5000);
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      const documentUrl = values.documentUrl;
      
      const updateData = {
        user_id: user.id,
        title: values.title,
        location: values.location,
        start_date: values.startDate.toISOString().split('T')[0],
        end_date: values.contractType === 'CDD' ? values.endDate?.toISOString().split('T')[0] : null,
        document_url: documentUrl,
        contract_type: values.contractType,
      };

      logger.log('[useExperiences] Données à mettre à jour:', updateData);

      const { error: updateError } = await supabase
        .from('experiences')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: "L'expérience a été modifiée avec succès",
      });

      await fetchExperiences();
      return true;
    } catch (error) {
      logger.error('[useExperiences] Error updating experience:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteExperience = async (id: string) => {
    try {
      logger.log('[useExperiences] Suppression de l\'expérience:', id);
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'expérience a été supprimée avec succès",
      });

      await fetchExperiences();
    } catch (error) {
      logger.error('[useExperiences] Error deleting experience:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    }
  };

  return {
    experiences,
    fetchExperiences,
    addExperience,
    updateExperience,
    deleteExperience,
    isUploading,
  };
};
