-- =====================================================
-- Système de Flux (fil d'actualités géré par l'admin)
-- =====================================================

-- Table des publications du flux (créées par l'admin via dashboard)
CREATE TABLE flux_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  author_name TEXT DEFAULT 'Pro Bain',
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour trier par date
CREATE INDEX idx_flux_posts_created_at ON flux_posts(created_at DESC);
CREATE INDEX idx_flux_posts_published ON flux_posts(is_published);

-- Table des likes sur les publications
CREATE TABLE flux_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES flux_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- Un utilisateur ne peut liker qu'une fois par post
);

-- Index pour les likes
CREATE INDEX idx_flux_likes_post_id ON flux_likes(post_id);
CREATE INDEX idx_flux_likes_user_id ON flux_likes(user_id);

-- Table des commentaires sur les publications
CREATE TABLE flux_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES flux_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les commentaires
CREATE INDEX idx_flux_comments_post_id ON flux_comments(post_id);
CREATE INDEX idx_flux_comments_user_id ON flux_comments(user_id);
CREATE INDEX idx_flux_comments_created_at ON flux_comments(created_at DESC);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- flux_posts: tout le monde peut lire, seul l'admin peut créer/modifier
ALTER TABLE flux_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
  ON flux_posts FOR SELECT
  USING (is_published = TRUE);

-- Note: L'admin utilisera le service_role key pour créer/modifier les posts

-- flux_likes: les utilisateurs peuvent gérer leurs propres likes
ALTER TABLE flux_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON flux_likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert own likes"
  ON flux_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON flux_likes FOR DELETE
  USING (auth.uid() = user_id);

-- flux_comments: les utilisateurs peuvent gérer leurs propres commentaires
ALTER TABLE flux_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
  ON flux_comments FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert own comments"
  ON flux_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON flux_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON flux_comments FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Triggers pour updated_at
-- =====================================================

CREATE TRIGGER trigger_update_flux_posts
  BEFORE UPDATE ON flux_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_flux_comments
  BEFORE UPDATE ON flux_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
