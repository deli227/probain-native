-- Migration: Create certifications table for rescuers
-- Allows rescuers to store and display their professional certifications (SSS, BNSSA, etc.)

-- Create the certifications table
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    organization TEXT,
    issued_date DATE,
    expiry_date DATE,
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);

-- Enable RLS
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can see certifications (public profiles)
CREATE POLICY "certifications_select" ON certifications
    FOR SELECT TO authenticated
    USING (true);

-- Users can insert their own certifications
CREATE POLICY "certifications_insert" ON certifications
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own certifications
CREATE POLICY "certifications_update" ON certifications
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Users can delete their own certifications
CREATE POLICY "certifications_delete" ON certifications
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_certifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER certifications_updated_at
    BEFORE UPDATE ON certifications
    FOR EACH ROW
    EXECUTE FUNCTION update_certifications_updated_at();

-- Comments for documentation
COMMENT ON TABLE certifications IS 'Professional certifications for rescuers (SSS, BNSSA, First Aid, etc.)';
COMMENT ON COLUMN certifications.name IS 'Name of the certification (e.g., Brevet SSS, BNSSA)';
COMMENT ON COLUMN certifications.organization IS 'Issuing organization (e.g., SSS, Croix-Rouge)';
COMMENT ON COLUMN certifications.issued_date IS 'Date when certification was obtained';
COMMENT ON COLUMN certifications.expiry_date IS 'Expiration date if applicable';
COMMENT ON COLUMN certifications.document_url IS 'URL to uploaded certification document';
