-- Migration: Ajouter display_name et avatar_url à la table admins
-- Pour permettre aux admins de personnaliser leur profil pour les publications du flux

-- Ajouter la colonne display_name
ALTER TABLE admins
ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'Probain';

-- Ajouter la colonne avatar_url
ALTER TABLE admins
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Commentaires
COMMENT ON COLUMN admins.display_name IS 'Nom affiché pour les publications du flux';
COMMENT ON COLUMN admins.avatar_url IS 'URL de l avatar pour les publications du flux';
