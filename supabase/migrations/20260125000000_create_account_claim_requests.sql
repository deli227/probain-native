-- Table pour les demandes de réclamation de compte
-- Permet aux formateurs et établissements de demander l'accès à leur compte

CREATE TABLE IF NOT EXISTS public.account_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type de demande: 'trainer' ou 'establishment'
  type TEXT NOT NULL CHECK (type IN ('trainer', 'establishment')),

  -- Email de la personne qui fait la demande
  email TEXT NOT NULL,

  -- Nom du formateur sélectionné (uniquement pour type='trainer')
  selected_trainer_name TEXT,

  -- Statut de la demande
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_account_claim_requests_status ON account_claim_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_claim_requests_type ON account_claim_requests(type);
CREATE INDEX IF NOT EXISTS idx_account_claim_requests_email ON account_claim_requests(email);
CREATE INDEX IF NOT EXISTS idx_account_claim_requests_created ON account_claim_requests(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE account_claim_requests ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut créer une demande (insert)
CREATE POLICY "Anyone can create claim request"
  ON account_claim_requests
  FOR INSERT
  WITH CHECK (true);

-- Politique: Seuls les admins peuvent voir les demandes
CREATE POLICY "Admins can view claim requests"
  ON account_claim_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Politique: Seuls les admins peuvent modifier les demandes
CREATE POLICY "Admins can update claim requests"
  ON account_claim_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
      AND admins.is_active = true
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_account_claim_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_account_claim_requests_updated_at
  BEFORE UPDATE ON account_claim_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_account_claim_requests_updated_at();

-- Commentaire
COMMENT ON TABLE account_claim_requests IS 'Demandes de réclamation de compte pour formateurs et établissements';
