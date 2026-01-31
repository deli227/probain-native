-- =====================================================
-- RPC Functions for Flux (resolve N+1 query problem)
-- =====================================================
-- Before: fetchPosts = 1 + 3N queries (likes count, comments count, user_has_liked per post)
-- After:  fetchPosts = 1 RPC call (single SQL query with subqueries)
--
-- Before: fetchComments = 1 + 2N queries (profiles + rescuer_profiles per comment)
-- After:  fetchComments = 1 RPC call (single SQL query with LEFT JOINs)
-- =====================================================

-- =====================================================
-- 1. get_flux_posts: Returns posts with counts + user_has_liked
-- =====================================================
CREATE OR REPLACE FUNCTION get_flux_posts(
  p_user_id UUID DEFAULT NULL,
  p_user_visibility TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  image_url TEXT,
  author_name TEXT,
  author_avatar_url TEXT,
  visibility TEXT,
  created_at TIMESTAMPTZ,
  likes_count BIGINT,
  comments_count BIGINT,
  user_has_liked BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    fp.id,
    fp.title,
    fp.content,
    fp.image_url,
    COALESCE(fp.author_name, 'Probain') AS author_name,
    fp.author_avatar_url,
    COALESCE(fp.visibility, 'all') AS visibility,
    fp.created_at,
    -- Likes count (subquery)
    COALESCE((
      SELECT COUNT(*)
      FROM flux_likes fl
      WHERE fl.post_id = fp.id
    ), 0) AS likes_count,
    -- Comments count (subquery)
    COALESCE((
      SELECT COUNT(*)
      FROM flux_comments fc
      WHERE fc.post_id = fp.id
    ), 0) AS comments_count,
    -- User has liked (subquery, false if no user)
    CASE
      WHEN p_user_id IS NULL THEN FALSE
      ELSE EXISTS (
        SELECT 1
        FROM flux_likes fl
        WHERE fl.post_id = fp.id AND fl.user_id = p_user_id
      )
    END AS user_has_liked
  FROM flux_posts fp
  WHERE
    -- Published or scheduled in the past
    (fp.is_published = TRUE OR (fp.scheduled_at IS NOT NULL AND fp.scheduled_at <= NOW()))
    -- Visibility filter
    AND (
      p_user_visibility IS NULL AND COALESCE(fp.visibility, 'all') = 'all'
      OR p_user_visibility IS NOT NULL AND COALESCE(fp.visibility, 'all') IN ('all', p_user_visibility)
    )
  ORDER BY fp.created_at DESC;
$$;

-- Grant execute to authenticated users and anon (for public read)
GRANT EXECUTE ON FUNCTION get_flux_posts(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_flux_posts(UUID, TEXT) TO anon;

-- =====================================================
-- 2. get_flux_comments: Returns comments with author info
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
    -- Build user_name: prefer rescuer_profiles names, fallback to profiles
    COALESCE(
      NULLIF(
        TRIM(COALESCE(rp.first_name, '') || ' ' || COALESCE(rp.last_name, '')),
        ''
      ),
      NULLIF(
        TRIM(COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')),
        ''
      ),
      'Utilisateur'
    ) AS user_name,
    -- Avatar from rescuer_profiles (only profile type with avatar in comments context)
    rp.avatar_url AS user_avatar
  FROM flux_comments fc
  LEFT JOIN profiles p ON p.id = fc.user_id
  LEFT JOIN rescuer_profiles rp ON rp.id = fc.user_id
  WHERE fc.post_id = p_post_id
  ORDER BY fc.created_at ASC;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION get_flux_comments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_flux_comments(UUID) TO anon;
