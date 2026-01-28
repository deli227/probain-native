
import { ProfileType } from "../types/profile";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { safeGetUser } from "@/utils/asyncHelpers";

export const updateProfileType = async (
  type: ProfileType,
  setProfileType: (type: ProfileType) => void,
  setProfileTypeSelected: (selected: boolean) => void,
  toast: any
) => {
  try {
    logger.log("Début de la mise à jour du type de profil:", type);
    
    const { data: { user } } = await safeGetUser(supabase, 5000);
    if (!user) {
      logger.error('Tentative de mise à jour sans authentification');
      throw new Error('Non authentifié');
    }

    logger.log("Utilisateur authentifié:", user.id);
    
    // Première mise à jour avec tous les champs nécessaires
    const { data, error } = await supabase
      .from('profiles')
      .update({
        profile_type: type,
        type: type,
        profile_type_selected: true
      })
      .eq('id', user.id)
      .select('profile_type, type, profile_type_selected');

    if (error) {
      logger.error('Erreur lors de la mise à jour en base:', error);
      throw error;
    }

    logger.log("Réponse de la mise à jour:", data);

    // Vérification immédiate de la mise à jour (plus de délai artificiel)
    const { data: updatedProfile, error: verificationError } = await supabase
      .from('profiles')
      .select('profile_type, type, profile_type_selected')
      .eq('id', user.id)
      .single();

    if (verificationError) {
      logger.error('Erreur lors de la vérification de la mise à jour:', verificationError);
      throw verificationError;
    }

    logger.log("Profil après vérification:", updatedProfile);

    // Vérification approfondie de la cohérence des données
    let needsCorrection = false;
    let correctionData = {};

    if (updatedProfile?.profile_type !== type) {
      logger.error('profile_type incorrect, reçu:', updatedProfile?.profile_type, 'attendu:', type);
      needsCorrection = true;
      correctionData = { ...correctionData, profile_type: type };
    }
    
    if (updatedProfile?.type !== type) {
      logger.error('type incorrect, reçu:', updatedProfile?.type, 'attendu:', type);
      needsCorrection = true;
      correctionData = { ...correctionData, type: type };
    }
    
    if (!updatedProfile?.profile_type_selected) {
      logger.error('profile_type_selected incorrect, devrait être true');
      needsCorrection = true;
      correctionData = { ...correctionData, profile_type_selected: true };
    }

    // Si des corrections sont nécessaires, effectuer une mise à jour supplémentaire
    if (needsCorrection) {
      logger.log("Tentative de correction des incohérences:", correctionData);
      
      const { error: correctionError } = await supabase
        .from('profiles')
        .update(correctionData)
        .eq('id', user.id);
        
      if (correctionError) {
        logger.error('Erreur lors de la tentative de correction:', correctionError);
      } else {
        logger.log("Correction appliquée avec succès");
        
        // Vérification finale après correction
        const { data: finalProfile, error: finalError } = await supabase
          .from('profiles')
          .select('profile_type, type, profile_type_selected')
          .eq('id', user.id)
          .single();
          
        if (!finalError) {
          logger.log("Profil final après correction:", finalProfile);
          
          // Mise à jour des états avec les données corrigées
          if (finalProfile?.profile_type === type && finalProfile?.type === type && finalProfile?.profile_type_selected) {
            setProfileType(type);
            setProfileTypeSelected(true);
            
            toast({
              title: "Succès",
              description: "Type de profil mis à jour avec succès",
            });
            
            logger.log("États mis à jour avec succès après correction");
            return true;
          }
        }
      }
    }

    // Si aucune correction n'était nécessaire ou si la correction a réussi
    if (updatedProfile?.profile_type === type && updatedProfile?.type === type && updatedProfile?.profile_type_selected) {
      setProfileType(type);
      setProfileTypeSelected(true);
      
      toast({
        title: "Succès",
        description: "Type de profil mis à jour avec succès",
      });
      
      logger.log("États mis à jour avec succès:", {
        profileType: type,
        profileTypeSelected: true
      });

      return true;
    } else {
      logger.error('La mise à jour n\'a pas été appliquée correctement:', {
        attendu: type,
        reçu: {
          profile_type: updatedProfile?.profile_type,
          type: updatedProfile?.type,
          profile_type_selected: updatedProfile?.profile_type_selected
        }
      });
      throw new Error('La mise à jour n\'a pas été appliquée correctement');
    }
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du type de profil:', error);
    toast({
      title: "Erreur",
      description: "Impossible de mettre à jour le type de profil",
      variant: "destructive",
    });
    throw error;
  }
};
