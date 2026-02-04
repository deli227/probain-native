-- Migration: Table push_subscriptions pour stocker les Player IDs OneSignal
-- Lie les appareils natifs (Despia) aux utilisateurs Supabase
-- L'Edge Function utilise cette table pour cibler les notifications push

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'native',
  profile_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, player_id)
);

-- Index pour les lookups rapides par user_id (notifications individuelles)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Index pour les broadcasts par profile_type
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_profile_type ON push_subscriptions(profile_type);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent inserer leurs propres subscriptions
CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre a jour leurs propres subscriptions
CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres subscriptions
CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Le service role (Edge Functions) peut tout lire pour envoyer les notifications
-- (pas besoin de policy explicite — le service_role bypass RLS)

COMMENT ON TABLE push_subscriptions IS 'Stocke les Player IDs OneSignal des appareils natifs (Despia) pour le ciblage push';
COMMENT ON COLUMN push_subscriptions.player_id IS 'OneSignal Player ID (Subscription ID) recupere via Despia';
COMMENT ON COLUMN push_subscriptions.platform IS 'Plateforme: native (Despia), web';
COMMENT ON COLUMN push_subscriptions.profile_type IS 'Type de profil pour les broadcasts: maitre_nageur, formateur, etablissement';
