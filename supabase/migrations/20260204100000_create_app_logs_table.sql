-- Migration: Creer la table app_logs pour le logging applicatif
-- Utilisee par le service appLogger (src/services/appLogger.ts)
-- Lue par le dashboard admin pour le monitoring

CREATE TABLE IF NOT EXISTS app_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_type TEXT,
  session_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'action')),
  category TEXT NOT NULL,
  event TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  device_info JSONB DEFAULT '{}'::JSONB,
  duration_ms INTEGER,
  error_stack TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requetes du dashboard admin
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON app_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_category ON app_logs(category);
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_event ON app_logs(event);

-- Activer RLS
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_logs' AND policyname = 'Users can insert their own logs') THEN
    CREATE POLICY "Users can insert their own logs" ON app_logs FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_logs' AND policyname = 'Service role can read all logs') THEN
    CREATE POLICY "Service role can read all logs" ON app_logs FOR SELECT TO service_role USING (true);
  END IF;
END $$;

-- Commentaire
COMMENT ON TABLE app_logs IS 'Logs applicatifs pour le monitoring via le dashboard admin';
