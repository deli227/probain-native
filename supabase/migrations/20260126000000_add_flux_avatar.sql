-- Ajouter le champ avatar pour l'auteur des posts du flux
ALTER TABLE flux_posts ADD COLUMN author_avatar_url TEXT;
