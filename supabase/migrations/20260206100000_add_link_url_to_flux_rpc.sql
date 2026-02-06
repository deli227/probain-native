-- Migration: Ajouter link_url au retour de get_flux_posts
-- Date: 6 février 2026
-- Description: La colonne link_url a été ajoutée à flux_posts (migration 20260206000000).
--              La RPC get_flux_posts doit retourner ce champ pour que l'app l'affiche.
-- Impact: La signature de retour change → DROP puis CREATE obligatoire.

DROP FUNCTION IF EXISTS get_flux_posts(UUID, TEXT);

CREATE OR REPLACE FUNCTION get_flux_posts(
  p_user_id UUID DEFAULT NULL,
  p_user_visibility TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  image_url TEXT,
  link_url TEXT,
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
    fp.link_url,
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
