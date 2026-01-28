import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FluxPost {
  id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  author_name: string;
  author_avatar_url: string | null;
  visibility: 'all' | 'rescuer' | 'trainer' | 'establishment';
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

// Mapping profile_type to visibility value
const PROFILE_TO_VISIBILITY: Record<string, 'rescuer' | 'trainer' | 'establishment'> = {
  'maitre_nageur': 'rescuer',
  'formateur': 'trainer',
  'etablissement': 'establishment',
};

export interface FluxComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export const useFlux = (userId: string | undefined, profileType?: string | null) => {
  const [posts, setPosts] = useState<FluxPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Get the visibility value for the current user's profile type
  const userVisibility = profileType ? PROFILE_TO_VISIBILITY[profileType] : null;

  const fetchPosts = useCallback(async () => {
    try {
      // Récupérer les posts publiés OU programmés dont la date est passée
      const now = new Date().toISOString();

      // Build the query - filter by visibility based on user's profile type
      let query = supabase
        .from('flux_posts')
        .select('*')
        .or(`is_published.eq.true,and(scheduled_at.not.is.null,scheduled_at.lte.${now})`);

      // Filter by visibility: show posts for 'all' OR matching the user's profile type
      if (userVisibility) {
        query = query.or(`visibility.eq.all,visibility.eq.${userVisibility}`);
      } else {
        // If no profile type, only show 'all' posts
        query = query.eq('visibility', 'all');
      }

      const { data: postsData, error: postsError } = await query.order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData) {
        setPosts([]);
        return;
      }

      // Pour chaque post, récupérer les compteurs et si l'utilisateur a liké
      const postsWithDetails = await Promise.all(
        postsData.map(async (post) => {
          // Compter les likes
          const { count: likesCount } = await supabase
            .from('flux_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          // Compter les commentaires
          const { count: commentsCount } = await supabase
            .from('flux_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          // Vérifier si l'utilisateur a liké
          let userHasLiked = false;
          if (userId) {
            const { data: likeData } = await supabase
              .from('flux_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', userId)
              .single();
            userHasLiked = !!likeData;
          }

          return {
            id: post.id,
            title: post.title,
            content: post.content,
            image_url: post.image_url,
            author_name: post.author_name || 'Probain',
            author_avatar_url: post.author_avatar_url || null,
            visibility: post.visibility || 'all',
            created_at: post.created_at,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            user_has_liked: userHasLiked,
          };
        })
      );

      setPosts(postsWithDetails);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le flux',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, userVisibility, toast]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
  }, [fetchPosts]);

  const toggleLike = useCallback(async (postId: string) => {
    if (!userId) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour liker',
        variant: 'destructive',
      });
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          user_has_liked: !p.user_has_liked,
          likes_count: p.user_has_liked ? p.likes_count - 1 : p.likes_count + 1,
        };
      }
      return p;
    }));

    try {
      if (post.user_has_liked) {
        // Remove like
        const { error } = await supabase
          .from('flux_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('flux_likes')
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    } catch {
      // Revert optimistic update
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            user_has_liked: post.user_has_liked,
            likes_count: post.likes_count,
          };
        }
        return p;
      }));
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le like',
        variant: 'destructive',
      });
    }
  }, [userId, posts, toast]);

  const fetchComments = useCallback(async (postId: string): Promise<FluxComment[]> => {
    try {
      const { data, error } = await supabase
        .from('flux_comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Récupérer les infos des utilisateurs
      const commentsWithUsers = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', comment.user_id)
            .single();

          const { data: rescuerData } = await supabase
            .from('rescuer_profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', comment.user_id)
            .single();

          const firstName = rescuerData?.first_name || profileData?.first_name || '';
          const lastName = rescuerData?.last_name || profileData?.last_name || '';

          return {
            ...comment,
            user_name: `${firstName} ${lastName}`.trim() || 'Utilisateur',
            user_avatar: rescuerData?.avatar_url || undefined,
          };
        })
      );

      return commentsWithUsers;
    } catch {
      return [];
    }
  }, []);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!userId) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour commenter',
        variant: 'destructive',
      });
      return false;
    }

    if (!content.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le commentaire ne peut pas être vide',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('flux_comments')
        .insert({
          post_id: postId,
          user_id: userId,
          content: content.trim(),
        });

      if (error) throw error;

      // Update comments count
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments_count: p.comments_count + 1 };
        }
        return p;
      }));

      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été publié',
      });

      return true;
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le commentaire',
        variant: 'destructive',
      });
      return false;
    }
  }, [userId, toast]);

  const deleteComment = useCallback(async (commentId: string, postId: string) => {
    try {
      const { error } = await supabase
        .from('flux_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update comments count
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments_count: Math.max(0, p.comments_count - 1) };
        }
        return p;
      }));

      toast({
        title: 'Commentaire supprimé',
      });

      return true;
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le commentaire',
        variant: 'destructive',
      });
      return false;
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Real-time subscription for new posts
  useEffect(() => {
    const channel = supabase
      .channel('flux_posts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'flux_posts' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  return {
    posts,
    loading,
    refreshing,
    refresh,
    toggleLike,
    fetchComments,
    addComment,
    deleteComment,
  };
};
