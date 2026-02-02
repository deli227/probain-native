-- =====================================================
-- Add threaded replies to flux comments (Instagram-style)
-- =====================================================
-- Adds parent_comment_id for 1-level nesting.
-- Replies to a comment are shown indented under the parent.
-- Deleting a parent cascades to all its replies.
-- =====================================================

-- 1. Add parent_comment_id column (nullable, self-referencing FK)
ALTER TABLE flux_comments
ADD COLUMN parent_comment_id UUID REFERENCES flux_comments(id) ON DELETE CASCADE;

-- 2. Index for efficient grouping
CREATE INDEX idx_flux_comments_parent_id ON flux_comments(parent_comment_id);

-- 3. Drop existing RPC (return type changes — must DROP + CREATE)
DROP FUNCTION IF EXISTS get_flux_comments(UUID);

-- 4. Recreate with parent_comment_id + replies_count
CREATE OR REPLACE FUNCTION get_flux_comments(
  p_post_id UUID
)
RETURNS TABLE (
  id UUID,
  post_id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  user_name TEXT,
  user_avatar TEXT,
  profile_type TEXT,
  parent_comment_id UUID,
  replies_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    fc.id,
    fc.post_id,
    fc.user_id,
    fc.content,
    fc.created_at,
    -- Build user_name: try all profile tables, fallback to 'Utilisateur'
    COALESCE(
      NULLIF(
        TRIM(COALESCE(rp.first_name, '') || ' ' || COALESCE(rp.last_name, '')),
        ''
      ),
      NULLIF(tp.organization_name, ''),
      NULLIF(ep.organization_name, ''),
      NULLIF(
        TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')),
        ''
      ),
      'Utilisateur'
    ) AS user_name,
    -- Avatar: try all profile tables
    COALESCE(
      rp.avatar_url,
      tp.avatar_url,
      ep.avatar_url,
      p.avatar_url
    ) AS user_avatar,
    -- Profile type from base profiles table
    p.profile_type::TEXT AS profile_type,
    -- Parent comment ID (NULL for root comments)
    fc.parent_comment_id,
    -- Count direct replies (only meaningful for root comments)
    COALESCE((
      SELECT COUNT(*) FROM flux_comments child
      WHERE child.parent_comment_id = fc.id
    ), 0) AS replies_count
  FROM flux_comments fc
  LEFT JOIN profiles p ON p.id = fc.user_id
  LEFT JOIN rescuer_profiles rp ON rp.id = fc.user_id
  LEFT JOIN trainer_profiles tp ON tp.id = fc.user_id
  LEFT JOIN establishment_profiles ep ON ep.id = fc.user_id
  WHERE fc.post_id = p_post_id
  ORDER BY fc.created_at ASC;
$$;

-- 5. Re-grant permissions
GRANT EXECUTE ON FUNCTION get_flux_comments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_flux_comments(UUID) TO anon;
