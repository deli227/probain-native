
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { logger } from "@/utils/logger";
import { safeGetUser } from "@/utils/asyncHelpers";

export const useEstablishmentProfile = () => {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEstablishmentProfile = async () => {
    try {
      logger.log("Début du chargement du profil");
      const { data: { user } } = await safeGetUser(supabase, 5000);
      
      if (!user) {
        logger.log("Utilisateur non authentifié, redirection vers /auth");
        navigate('/auth');
        return;
      }

      logger.log("Utilisateur authentifié:", user.id);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        logger.error("Erreur lors du chargement du profil:", profileError);
        throw profileError;
      }

      if (!profile) {
        logger.log("Profil non trouvé, redirection vers /onboarding");
        navigate('/onboarding');
        return;
      }

      logger.log("Profil chargé:", profile);

      const { data: establishmentProfile, error: establishmentError } = await supabase
        .from('establishment_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (establishmentError) {
        logger.error("Erreur lors du chargement du profil établissement:", establishmentError);
        throw establishmentError;
      }

      logger.log("Profil établissement chargé:", establishmentProfile);

      if (!establishmentProfile) {
        logger.log("Création d'un nouveau profil établissement");
        const { error: createError } = await supabase
          .from('establishment_profiles')
          .insert({
            id: user.id,
            organization_name: "Nouvel établissement"
          });

        if (createError) {
          logger.error("Erreur lors de la création du profil établissement:", createError);
          throw createError;
        }
        
        return fetchEstablishmentProfile();
      }

      setProfileData({
        ...profile,
        establishment: establishmentProfile
      });
    } catch (error) {
      logger.error('Erreur lors du chargement du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (values: any) => {
    try {
      logger.log("Début de la mise à jour du profil");
      const { data: { user } } = await safeGetUser(supabase, 5000);
      
      if (!user) {
        logger.error("Utilisateur non authentifié");
        throw new Error('Non authentifié');
      }

      logger.log("Utilisateur authentifié:", user.id);
      logger.log("Valeurs à mettre à jour:", values);

      const { data, error: establishmentError } = await supabase
        .from('establishment_profiles')
        .update({
          ...values,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (establishmentError) {
        logger.error('Erreur lors de la mise à jour:', establishmentError);
        throw establishmentError;
      }

      logger.log("Mise à jour réussie, nouvelles données:", data);

      // Mise à jour immédiate des données locales
      setProfileData(prev => ({
        ...prev,
        establishment: data
      }));

    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchEstablishmentProfile();
  }, []);

  return {
    profileData,
    loading,
    handleProfileUpdate,
  };
};
