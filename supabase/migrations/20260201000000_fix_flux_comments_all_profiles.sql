-- =====================================================
-- Fix get_flux_comments: support all profile types
-- =====================================================
-- Before: Only joined rescuer_profiles → trainers/establishments showed "Utilisateur"
-- After:  Joins rescuer_profiles, trainer_profiles, establishment_profiles
--         Name + avatar resolved from whichever profile type exists
-- =====================================================

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
  user_avatar TEXT
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
    ) AS user_avatar
  FROM flux_comments fc
  LEFT JOIN profiles p ON p.id = fc.user_id
  LEFT JOIN rescuer_profiles rp ON rp.id = fc.user_id
  LEFT JOIN trainer_profiles tp ON tp.id = fc.user_id
  LEFT JOIN establishment_profiles ep ON ep.id = fc.user_id
  WHERE fc.post_id = p_post_id
  ORDER BY fc.created_at ASC;
$$;
