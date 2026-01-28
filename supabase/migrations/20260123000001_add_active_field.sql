-- Add active field and unique constraint to existing table
-- This migration can be run safely even if fields already exist

-- Add active field if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sss_formations_cache'
        AND column_name = 'active'
    ) THEN
        ALTER TABLE sss_formations_cache ADD COLUMN active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_formation'
    ) THEN
        ALTER TABLE sss_formations_cache
        ADD CONSTRAINT unique_formation UNIQUE (titre, debut, lieu);
    END IF;
END $$;

-- Add index on active field if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_sss_cache_active ON sss_formations_cache(active) WHERE active = true;

-- Set all existing formations as active
UPDATE sss_formations_cache SET active = true WHERE active IS NULL;
