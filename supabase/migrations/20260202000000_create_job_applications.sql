-- =====================================================
-- Table job_applications — Suivi des candidatures
-- =====================================================

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  message_id UUID REFERENCES internal_messages(id) ON DELETE SET NULL,
  cv_url TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_application UNIQUE(user_id, job_posting_id)
);

-- Indexes
CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_job_posting_id ON job_applications(job_posting_id);
CREATE INDEX idx_job_applications_created_at ON job_applications(created_at DESC);

-- RLS
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Sauveteurs voient leurs propres candidatures
CREATE POLICY "job_applications_select_own"
  ON job_applications FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_posting_id
      AND job_postings.establishment_id = auth.uid()
    )
  );

-- Seuls les sauveteurs peuvent inserer leurs propres candidatures
CREATE POLICY "job_applications_insert_own"
  ON job_applications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.profile_type = 'maitre_nageur'
    )
  );

-- Sauveteurs peuvent supprimer (retirer) leurs propres candidatures
CREATE POLICY "job_applications_delete_own"
  ON job_applications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Mise a jour du statut par le sauveteur ou l'etablissement
CREATE POLICY "job_applications_update"
  ON job_applications FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_posting_id
      AND job_postings.establishment_id = auth.uid()
    )
  );
