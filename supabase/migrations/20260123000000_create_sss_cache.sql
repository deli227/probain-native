-- Table pour stocker le cache des formations SSS
-- Scrapées quotidiennement via GitHub Actions + Playwright

CREATE TABLE IF NOT EXISTS public.sss_formations_cache (
  id BIGSERIAL PRIMARY KEY,

  -- Données de la formation
  titre TEXT NOT NULL,
  lieu TEXT,
  debut TEXT,
  fin TEXT,
  organisateur TEXT,
  places TEXT,
  places_color TEXT,
  places_status TEXT,
  abbreviation TEXT,
  url TEXT,

  -- Métadonnées
  active BOOLEAN DEFAULT true,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte d'unicité sur la combinaison titre + debut + lieu
  CONSTRAINT unique_formation UNIQUE (titre, debut, lieu)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_sss_cache_lieu ON sss_formations_cache(lieu);
CREATE INDEX IF NOT EXISTS idx_sss_cache_debut ON sss_formations_cache(debut);
CREATE INDEX IF NOT EXISTS idx_sss_cache_scraped ON sss_formations_cache(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_sss_cache_active ON sss_formations_cache(active) WHERE active = true;

-- RLS (Row Level Security) - Lecture publique
ALTER TABLE sss_formations_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique formations SSS"
  ON sss_formations_cache
  FOR SELECT
  USING (true);

-- Commentaire
COMMENT ON TABLE sss_formations_cache IS 'Cache des formations SSS scrapées quotidiennement via GitHub Actions';
