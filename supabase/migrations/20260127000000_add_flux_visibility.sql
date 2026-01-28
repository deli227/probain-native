-- Migration: Ajouter la visibilité/audience ciblée pour les posts du flux
-- Valeurs possibles: 'all' (tous), 'rescuer' (sauveteurs), 'trainer' (formateurs), 'establishment' (établissements)

ALTER TABLE flux_posts
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'all' CHECK (visibility IN ('all', 'rescuer', 'trainer', 'establishment'));

-- Commentaire pour documentation
COMMENT ON COLUMN flux_posts.visibility IS 'Audience ciblée: all (tous), rescuer (sauveteurs), trainer (formateurs), establishment (établissements)';
