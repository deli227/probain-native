import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FluxPost {
  id: string;
  title: string | null;
  content: string;
  image_url: string | null;
  link_url: string | null;
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
  profile_type?: string;
  parent_comment_id?: string | null;
  replies_count?: number;
}

// ------------------------------------------------------------------
// Query key factory
// ------------------------------------------------------------------
const fluxKeys = {
  all: ['flux'] as const,
  posts: (userId: string | undefined, visibility: string | null) =>
    ['flux', 'posts', userId ?? 'anon', visibility ?? 'all'] as const,
  comments: (postId: string) => ['flux', 'comments', postId] as const,
};

// ------------------------------------------------------------------
// Fetchers (use RPC when available, fallback to client-side N+1)
// ------------------------------------------------------------------

/**
 * Fetch posts via RPC `get_flux_posts`.
 * Falls back to the legacy N+1 approach if the RPC doesn't exist yet
 * (e.g. migration not yet applied on the database).
 */
async function fetchPostsViaRpc(
  userId: string | undefined,
  userVisibility: string | null,
): Promise<FluxPost[]> {
  // Try RPC first (cast needed: RPC not yet in generated types until migration is applied)
  const { data, error } = await (supabase.rpc as CallableFunction)('get_flux_posts', {
    p_user_id: userId ?? null,
    p_user_visibility: userVisibility ?? null,
  });

  if (!error && data) {
    return (data as unknown as FluxPost[]).map((p) => ({
      ...p,
      // Ensure non-null defaults that the interface expects
      author_name: p.author_name || 'Probain',
      link_url: p.link_url || null,
      visibility: (p.visibility || 'all') as FluxPost['visibility'],
      created_at: p.created_at ?? '',
      likes_count: Number(p.likes_count) || 0,
      comments_count: Number(p.comments_count) || 0,
      user_has_liked: !!p.user_has_liked,
    }));
  }

  // ---------- Fallback: legacy N+1 ----------
  const now = new Date().toISOString();
  let query = supabase
    .from('flux_posts')
    .select('*')
    .or(`is_published.eq.true,and(scheduled_at.not.is.null,scheduled_at.lte.${now})`);

  if (userVisibility) {
    query = query.or(`visibility.eq.all,visibility.eq.${userVisibility}`);
  } else {
    query = query.eq('visibility', 'all');
  }

  const { data: postsData, error: postsError } = await query.order('created_at', { ascending: false });
  if (postsError) throw postsError;
  if (!postsData) return [];

  const postsWithDetails = await Promise.all(
    postsData.map(async (post) => {
      const { count: likesCount } = await supabase
        .from('flux_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      const { count: commentsCount } = await supabase
        .from('flux_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

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
        link_url: (post as Record<string, unknown>).link_url as string | null ?? null,
        author_name: post.author_name || 'Probain',
        author_avatar_url: post.author_avatar_url || null,
        visibility: (post.visibility || 'all') as FluxPost['visibility'],
        created_at: post.created_at ?? '',
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        user_has_liked: userHasLiked,
      };
    }),
  );

  return postsWithDetails;
}

/**
 * Fetch comments via RPC `get_flux_comments`.
 * Falls back to the legacy N+1 approach if the RPC doesn't exist yet.
 */
async function fetchCommentsViaRpc(postId: string): Promise<FluxComment[]> {
  // Cast needed: RPC not yet in generated types until migration is applied
  const { data, error } = await (supabase.rpc as CallableFunction)('get_flux_comments', {
    p_post_id: postId,
  });

  if (!error && data) {
    return (data as unknown as FluxComment[]).map((c) => ({
      ...c,
      created_at: c.created_at ?? '',
      user_name: c.user_name || 'Utilisateur',
      user_avatar: c.user_avatar || undefined,
      profile_type: c.profile_type || undefined,
      parent_comment_id: c.parent_comment_id || null,
      replies_count: Number(c.replies_count) || 0,
    }));
  }

  // ---------- Fallback: legacy N+1 ----------
  const { data: commentsData, error: commentsError } = await supabase
    .from('flux_comments')
    .select('id, post_id, user_id, content, created_at, parent_comment_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (commentsError) throw commentsError;

  const commentsWithUsers = await Promise.all(
    (commentsData || []).map(async (comment) => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, profile_type')
        .eq('id', comment.user_id)
        .single();

      const { data: rescuerData } = await supabase
        .from('rescuer_profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', comment.user_id)
        .single();

      const { data: trainerData } = await supabase
        .from('trainer_profiles')
        .select('organization_name, avatar_url')
        .eq('id', comment.user_id)
        .single();

      const { data: establishmentData } = await supabase
        .from('establishment_profiles')
        .select('organization_name, avatar_url')
        .eq('id', comment.user_id)
        .single();

      const firstName = rescuerData?.first_name || profileData?.first_name || '';
      const lastName = rescuerData?.last_name || profileData?.last_name || '';
      const rescuerName = `${firstName} ${lastName}`.trim();
      const userName = rescuerName || trainerData?.organization_name || establishmentData?.organization_name || 'Utilisateur';
      const avatarUrl = rescuerData?.avatar_url || trainerData?.avatar_url || establishmentData?.avatar_url || profileData?.avatar_url;

      return {
        ...comment,
        created_at: comment.created_at ?? '',
        user_name: userName,
        user_avatar: avatarUrl || undefined,
        profile_type: profileData?.profile_type || undefined,
        parent_comment_id: comment.parent_comment_id || null,
        replies_count: 0,
      };
    }),
  );

  return commentsWithUsers;
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------

export const useFlux = (userId: string | undefined, profileType?: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const userVisibility = profileType ? PROFILE_TO_VISIBILITY[profileType] ?? null : null;

  // Stable ref for toast (avoid re-creating callbacks when toast identity changes)
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // ---- Posts query ----
  const {
    data: posts = [],
    isLoading: loading,
    isRefetching: refreshing,
    refetch,
  } = useQuery<FluxPost[]>({
    queryKey: fluxKeys.posts(userId, userVisibility),
    queryFn: () => fetchPostsViaRpc(userId, userVisibility),
    // Keep enabled even without userId (anonymous read)
    enabled: true,
  });

  // ---- Refresh helper (matches old API) ----
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // ---- Toggle like mutation ----
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, currentlyLiked }: { postId: string; currentlyLiked: boolean }) => {
      if (!userId) throw new Error('NOT_AUTHENTICATED');

      if (currentlyLiked) {
        const { error } = await supabase
          .from('flux_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('flux_likes')
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    // Optimistic update
    onMutate: async ({ postId, currentlyLiked }) => {
      const queryKey = fluxKeys.posts(userId, userVisibility);
      await queryClient.cancelQueries({ queryKey });

      const previousPosts = queryClient.getQueryData<FluxPost[]>(queryKey);

      queryClient.setQueryData<FluxPost[]>(queryKey, (old) =>
        (old ?? []).map((p) =>
          p.id === postId
            ? {
                ...p,
                user_has_liked: !currentlyLiked,
                likes_count: currentlyLiked ? p.likes_count - 1 : p.likes_count + 1,
              }
            : p,
        ),
      );

      return { previousPosts };
    },
    onError: (_err, _vars, context) => {
      // Revert optimistic update
      if (context?.previousPosts) {
        queryClient.setQueryData(fluxKeys.posts(userId, userVisibility), context.previousPosts);
      }
      toastRef.current({
        title: 'Erreur',
        description: 'Impossible de modifier le like',
        variant: 'destructive',
      });
    },
    // No onSettled refetch needed – optimistic state is source of truth until next real-time event
  });

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!userId) {
        toastRef.current({
          title: 'Connexion requise',
          description: 'Vous devez être connecté pour liker',
          variant: 'destructive',
        });
        return;
      }
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      toggleLikeMutation.mutate({ postId, currentlyLiked: post.user_has_liked });
    },
    [userId, posts, toggleLikeMutation],
  );

  // ---- Fetch comments (useQuery-based, lazy per post) ----
  const fetchComments = useCallback(
    async (postId: string): Promise<FluxComment[]> => {
      try {
        // Use queryClient.fetchQuery to benefit from cache + dedup
        return await queryClient.fetchQuery({
          queryKey: fluxKeys.comments(postId),
          queryFn: () => fetchCommentsViaRpc(postId),
          staleTime: 2 * 60 * 1000, // 2 minutes
        });
      } catch {
        return [];
      }
    },
    [queryClient],
  );

  // ---- Add comment mutation ----
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content, parentCommentId }: { postId: string; content: string; parentCommentId?: string | null }) => {
      if (!userId) throw new Error('NOT_AUTHENTICATED');

      // Build insert payload — only include parent_comment_id if provided
      const insertPayload: Record<string, unknown> = {
        post_id: postId,
        user_id: userId,
        content: content.trim(),
      };
      if (parentCommentId) {
        insertPayload.parent_comment_id = parentCommentId;
      }

      const { error } = await supabase
        .from('flux_comments')
        .insert(insertPayload);

      // If the error is because parent_comment_id column doesn't exist yet,
      // retry without it (migration not yet applied)
      if (error && parentCommentId && error.message?.includes('parent_comment_id')) {
        const { error: retryError } = await supabase
          .from('flux_comments')
          .insert({
            post_id: postId,
            user_id: userId,
            content: content.trim(),
          });
        if (retryError) throw retryError;
        return;
      }
      if (error) throw error;
    },
    onSuccess: (_data, { postId }) => {
      // Increment comments_count optimistically on the posts cache
      const queryKey = fluxKeys.posts(userId, userVisibility);
      queryClient.setQueryData<FluxPost[]>(queryKey, (old) =>
        (old ?? []).map((p) =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p,
        ),
      );
      // Invalidate comments cache for this post so next fetch gets fresh data
      queryClient.invalidateQueries({ queryKey: fluxKeys.comments(postId) });
      // Pas de toast ici — le commentaire visible dans la liste suffit comme feedback
    },
    onError: () => {
      toastRef.current({
        title: 'Erreur',
        description: "Impossible d'ajouter le commentaire",
        variant: 'destructive',
      });
    },
  });

  const addComment = useCallback(
    async (postId: string, content: string, parentCommentId?: string | null): Promise<boolean> => {
      if (!userId) {
        toastRef.current({
          title: 'Connexion requise',
          description: 'Vous devez être connecté pour commenter',
          variant: 'destructive',
        });
        return false;
      }
      if (!content.trim()) {
        toastRef.current({
          title: 'Erreur',
          description: 'Le commentaire ne peut pas être vide',
          variant: 'destructive',
        });
        return false;
      }

      try {
        await addCommentMutation.mutateAsync({ postId, content, parentCommentId });
        return true;
      } catch {
        return false;
      }
    },
    [userId, addCommentMutation],
  );

  // ---- Delete comment mutation ----
  const deleteCommentMutation = useMutation({
    mutationFn: async ({ commentId }: { commentId: string; postId: string; repliesCount?: number }) => {
      if (!userId) throw new Error('NOT_AUTHENTICATED');
      const { error } = await supabase
        .from('flux_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_data, { postId, repliesCount }) => {
      // Decrement comments_count (parent + its replies if cascade)
      const decrementBy = 1 + (repliesCount || 0);
      const queryKey = fluxKeys.posts(userId, userVisibility);
      queryClient.setQueryData<FluxPost[]>(queryKey, (old) =>
        (old ?? []).map((p) =>
          p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - decrementBy) } : p,
        ),
      );
      // Invalidate comments cache
      queryClient.invalidateQueries({ queryKey: fluxKeys.comments(postId) });
      // Pas de toast ici — la disparition du commentaire suffit comme feedback visuel
      // (un toast creerait un portail Radix qui perturbe le focus dans la section commentaires)
    },
    onError: () => {
      toastRef.current({
        title: 'Erreur',
        description: 'Impossible de supprimer le commentaire',
        variant: 'destructive',
      });
    },
  });

  const deleteComment = useCallback(
    async (commentId: string, postId: string, repliesCount?: number): Promise<boolean> => {
      try {
        await deleteCommentMutation.mutateAsync({ commentId, postId, repliesCount });
        return true;
      } catch {
        return false;
      }
    },
    [deleteCommentMutation],
  );

  // ---- Real-time: invalidate cache on DB changes ----
  useEffect(() => {
    const channel = supabase
      .channel('flux_posts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'flux_posts' },
        () => {
          queryClient.invalidateQueries({ queryKey: fluxKeys.posts(userId, userVisibility) });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'flux_likes' },
        () => {
          queryClient.invalidateQueries({ queryKey: fluxKeys.posts(userId, userVisibility) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userVisibility, queryClient]);

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
