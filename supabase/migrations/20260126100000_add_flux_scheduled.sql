-- Ajouter le champ pour la publication programmée
ALTER TABLE flux_posts ADD COLUMN scheduled_at TIMESTAMPTZ;

-- Index pour les requêtes de publication programmée
CREATE INDEX idx_flux_posts_scheduled ON flux_posts (scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Commentaire
COMMENT ON COLUMN flux_posts.scheduled_at IS 'Date et heure de publication programmée. Si NULL et is_published=true, publié immédiatement.';
