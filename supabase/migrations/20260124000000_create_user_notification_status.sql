-- Table pour tracker quand l'utilisateur a vu les formations et emplois
-- Permet de calculer les "nouveaux" items depuis la dernière visite

CREATE TABLE IF NOT EXISTS user_notification_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_seen_formations_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_jobs_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_user_notification_status_user_id
ON user_notification_status(user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_user_notification_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_user_notification_status ON user_notification_status;
CREATE TRIGGER trigger_update_user_notification_status
  BEFORE UPDATE ON user_notification_status
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notification_status_updated_at();

-- RLS Policies
ALTER TABLE user_notification_status ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leur propre statut
CREATE POLICY "Users can view their own notification status"
ON user_notification_status
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leur propre statut
CREATE POLICY "Users can create their own notification status"
ON user_notification_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent modifier leur propre statut
CREATE POLICY "Users can update their own notification status"
ON user_notification_status
FOR UPDATE
USING (auth.uid() = user_id);

-- Fonction pour initialiser le statut d'un nouvel utilisateur
-- Appelée automatiquement quand un profil est créé
CREATE OR REPLACE FUNCTION create_notification_status_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_status (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement le statut quand un profil est créé
DROP TRIGGER IF EXISTS trigger_create_notification_status ON profiles;
CREATE TRIGGER trigger_create_notification_status
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_status_for_new_user();

-- Créer le statut pour les utilisateurs existants qui n'en ont pas
INSERT INTO user_notification_status (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_notification_status)
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE user_notification_status IS 'Stocke les timestamps de dernière consultation des formations et emplois par utilisateur';
COMMENT ON COLUMN user_notification_status.last_seen_formations_at IS 'Dernière fois que l''utilisateur a consulté les formations';
COMMENT ON COLUMN user_notification_status.last_seen_jobs_at IS 'Dernière fois que l''utilisateur a consulté les offres d''emploi';
