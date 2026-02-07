-- Migration: Ajouter la colonne notify_flux pour separer les preferences
-- "Publications/Flux" des preferences "Formations"
-- Avant cette migration, new_flux_post utilisait notify_formations ce qui
-- empechait les utilisateurs de controler independamment les deux

ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS notify_flux boolean DEFAULT true;

COMMENT ON COLUMN notification_preferences.notify_flux IS 'Preference pour les notifications de publications du flux';
