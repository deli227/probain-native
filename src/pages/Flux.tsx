import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Heart, MessageCircle, Send, Loader2, Trash2, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useFlux, FluxComment } from '@/hooks/useFlux';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useProfile } from '@/contexts/ProfileContext';
import { LazyImage } from '@/components/ui/lazy-image';
import { RescuerProfileSheet } from '@/components/shared/RescuerProfileSheet';
import { PostSkeleton } from '@/components/skeletons/PostSkeleton';
import { hapticFeedback } from '@/lib/native';

// ---- Threading helpers ----

interface ThreadedComment extends FluxComment {
  replies: FluxComment[];
}

function groupCommentsIntoThreads(flatComments: FluxComment[]): ThreadedComment[] {
  const rootComments: ThreadedComment[] = [];
  const repliesByParent: Record<string, FluxComment[]> = {};

  for (const comment of flatComments) {
    if (comment.parent_comment_id) {
      if (!repliesByParent[comment.parent_comment_id]) {
        repliesByParent[comment.parent_comment_id] = [];
      }
      repliesByParent[comment.parent_comment_id].push(comment);
    } else {
      rootComments.push({ ...comment, replies: [] });
    }
  }

  const rootIds = new Set(rootComments.map(r => r.id));
  for (const root of rootComments) {
    root.replies = repliesByParent[root.id] || [];
  }

  // Orphaned replies (parent not in current list) become root comments
  for (const [parentId, replies] of Object.entries(repliesByParent)) {
    if (!rootIds.has(parentId)) {
      for (const reply of replies) {
        rootComments.push({ ...reply, replies: [] });
      }
    }
  }

  return rootComments;
}

// ---- Mention rendering helper ----
// We no longer use regex to guess where the @mention ends.
// Instead, replies store parent_comment_id and we display the reply target
// structurally (like Instagram). The @Name prefix in the text is stripped
// when we know the parent, or kept as plain text if no parent is set.

function stripMentionPrefix(content: string, parentUserName?: string): string {
  if (!parentUserName || !content.startsWith('@')) return content;
  const expectedPrefix = `@${parentUserName} `;
  if (content.startsWith(expectedPrefix)) {
    return content.substring(expectedPrefix.length);
  }
  // Also try without trailing space (edge case)
  const prefixNoSpace = `@${parentUserName}`;
  if (content === prefixNoSpace) return '';
  return content;
}

// ---- CommentBubble component ----

interface CommentBubbleProps {
  comment: FluxComment;
  postId: string;
  onReply: (postId: string, comment: FluxComment) => void;
  onDelete: (commentId: string, postId: string, repliesCount?: number) => void;
  canViewProfile: boolean;
  isOwn: boolean;
  onViewProfile: (userId: string) => void;
  formatDate: (date: string) => string;
  isReply?: boolean;
  repliesCount?: number;
  /** Name of the parent comment author (for reply indicator) */
  parentUserName?: string;
}

const CommentBubble = memo(({ comment, postId, onReply, onDelete, canViewProfile, isOwn, onViewProfile, formatDate, isReply, repliesCount, parentUserName }: CommentBubbleProps) => {
  // Strip the @mention prefix from the displayed content when we show a structural reply indicator
  const displayContent = parentUserName
    ? stripMentionPrefix(comment.content, parentUserName)
    : comment.content;

  return (
    <div className="flex gap-2">
      <Avatar
        className={`${isReply ? 'h-6 w-6' : 'h-8 w-8'} shrink-0 bg-gray-200 ${canViewProfile ? 'cursor-pointer ring-2 ring-transparent hover:ring-cyan-400/50 transition-all' : ''}`}
        onClick={canViewProfile ? () => onViewProfile(comment.user_id) : undefined}
      >
        {comment.user_avatar ? (
          <img src={comment.user_avatar} alt={`Avatar de ${comment.user_name}`} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className={`${isReply ? 'text-[10px]' : 'text-xs'} font-medium text-gray-700`}>
            {comment.user_name?.charAt(0).toUpperCase()}
          </span>
        )}
      </Avatar>
      <div className="flex-1 bg-gray-100 rounded-lg p-2">
        <div className="flex items-center justify-between">
          <p
            className={`font-medium text-sm text-gray-900 ${canViewProfile ? 'cursor-pointer hover:text-cyan-600 hover:underline transition-colors' : ''}`}
            onClick={canViewProfile ? () => onViewProfile(comment.user_id) : undefined}
          >
            {comment.user_name}
          </p>
          {isOwn && (
            <button
              type="button"
              className="h-6 w-6 flex items-center justify-center text-gray-600 hover:text-red-500 rounded-md transition-colors focus:outline-none"
              onClick={() => onDelete(comment.id, postId, repliesCount)}
              aria-label="Supprimer le commentaire"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        {/* Structural reply indicator (like Instagram) */}
        {parentUserName && (
          <p className="text-xs text-blue-600 mb-0.5">
            <Reply className="h-3 w-3 inline mr-1" />
            <span className="font-medium">@{parentUserName}</span>
          </p>
        )}
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {displayContent}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-xs text-gray-600">{formatDate(comment.created_at)}</p>
          <button
            type="button"
            onClick={() => onReply(postId, comment)}
            className="text-xs text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1"
          >
            <Reply className="h-3 w-3" />
            Répondre
          </button>
        </div>
      </div>
    </div>
  );
});

CommentBubble.displayName = 'CommentBubble';

// ---- Main Flux component ----

const Flux = () => {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const { profileType, rescuerProfile, trainerProfile, establishmentProfile } = useProfile();
  const { posts, loading, toggleLike, fetchComments, addComment, deleteComment } = useFlux(userId, profileType);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, FluxComment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});
  const [rescuerSheetOpen, setRescuerSheetOpen] = useState(false);
  const [selectedRescuerId, setSelectedRescuerId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Record<string, FluxComment | null>>({});
  const [animatingLike, setAnimatingLike] = useState<Record<string, boolean>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const commentInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Refs for stable callbacks (avoid recreating handlers on every state change)
  const replyingToRef = useRef(replyingTo);
  replyingToRef.current = replyingTo;
  const commentsRef = useRef(comments);
  commentsRef.current = comments;
  const newCommentRef = useRef(newComment);
  newCommentRef.current = newComment;

  // Track client-side parent_comment_id assignments (for when DB migration isn't applied yet)
  // Maps postId → { commentContent → parentCommentId }
  const clientParentMapRef = useRef<Record<string, Record<string, string>>>({});

  const isEstablishment = profileType === 'etablissement';

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  const handleToggleComments = useCallback(async (postId: string) => {
    const isExpanded = commentsRef.current[postId] !== undefined && expandedComments[postId];

    if (!isExpanded && !commentsRef.current[postId]) {
      // First time opening: fetch comments
      setExpandedComments(prev => ({ ...prev, [postId]: true }));
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const serverComments = await fetchComments(postId);
        // Re-apply client-side parent_comment_id for comments where the server returned null
        const parentMap = clientParentMapRef.current[postId];
        if (parentMap && Object.keys(parentMap).length > 0) {
          const enriched = serverComments.map(c => {
            if (!c.parent_comment_id && parentMap[c.content]) {
              return { ...c, parent_comment_id: parentMap[c.content] };
            }
            return c;
          });
          setComments(prev => ({ ...prev, [postId]: enriched }));
        } else {
          setComments(prev => ({ ...prev, [postId]: serverComments }));
        }
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
      }
    } else {
      // Toggle visibility
      setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    }
  }, [expandedComments, fetchComments]);

  // Derive current user display name for optimistic comment
  const currentUserName = rescuerProfile
    ? `${rescuerProfile.first_name || ''} ${rescuerProfile.last_name || ''}`.trim()
    : trainerProfile?.organization_name || establishmentProfile?.organization_name || 'Moi';
  const currentUserAvatar = rescuerProfile?.avatar_url || trainerProfile?.avatar_url || establishmentProfile?.avatar_url || undefined;

  // Stable refs for user info (used in handleAddComment without triggering re-creation)
  const userInfoRef = useRef({ currentUserName, currentUserAvatar, profileType, userId });
  userInfoRef.current = { currentUserName, currentUserAvatar, profileType, userId };

  const handleAddComment = useCallback(async (postId: string) => {
    const content = newCommentRef.current[postId] || '';
    if (!content.trim()) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));

    const { currentUserName: uName, currentUserAvatar: uAvatar, profileType: pType, userId: uid } = userInfoRef.current;

    // Determine parent comment ID for threading
    const parentComment = replyingToRef.current[postId];
    // 1-level nesting: if replying to a reply, flatten to the root parent
    const effectiveParentId = parentComment
      ? (parentComment.parent_comment_id || parentComment.id)
      : null;

    // Prepend @Name in the stored content so we can strip it on display
    const storedContent = effectiveParentId && parentComment?.user_name
      ? `@${parentComment.user_name} ${content.trim()}`
      : content.trim();

    // Optimistic: add the comment locally before the server responds
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticComment: FluxComment = {
      id: optimisticId,
      post_id: postId,
      user_id: uid || '',
      content: storedContent,
      created_at: new Date().toISOString(),
      user_name: uName,
      user_avatar: uAvatar,
      profile_type: pType || undefined,
      parent_comment_id: effectiveParentId,
      replies_count: 0,
    };
    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), optimisticComment],
    }));
    setNewComment(prev => ({ ...prev, [postId]: '' }));
    setReplyingTo(prev => ({ ...prev, [postId]: null }));

    // Auto-expand replies for the parent we just replied to
    if (effectiveParentId) {
      setExpandedReplies(prev => ({ ...prev, [effectiveParentId]: true }));

      // Track this client-side parent assignment so we can re-apply after server refresh
      if (!clientParentMapRef.current[postId]) clientParentMapRef.current[postId] = {};
      // Use the content as a loose key to identify the comment after server roundtrip
      clientParentMapRef.current[postId][storedContent] = effectiveParentId;
    }

    try {
      const success = await addComment(postId, storedContent, effectiveParentId);

      if (success) {
        // Background refresh to get the real comment with proper ID
        fetchComments(postId).then(serverComments => {
          // Re-apply client-side parent_comment_id for comments where the server returned null
          // (happens when DB migration isn't applied yet)
          const parentMap = clientParentMapRef.current[postId];
          if (parentMap && Object.keys(parentMap).length > 0) {
            const enriched = serverComments.map(c => {
              if (!c.parent_comment_id && parentMap[c.content]) {
                return { ...c, parent_comment_id: parentMap[c.content] };
              }
              return c;
            });
            setComments(prev => ({ ...prev, [postId]: enriched }));
          } else {
            setComments(prev => ({ ...prev, [postId]: serverComments }));
          }
        }).catch(() => {
          // Silently keep the optimistic comment if refresh fails
        });
      } else {
        // Revert optimistic comment on failure
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).filter(c => c.id !== optimisticId),
        }));
      }
    } catch {
      // Revert optimistic comment on unexpected error
      setComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== optimisticId),
      }));
    }
    setSubmittingComment(prev => ({ ...prev, [postId]: false }));
  }, [addComment, fetchComments]);

  const handleDeleteComment = useCallback(async (commentId: string, postId: string, repliesCount?: number) => {
    const success = await deleteComment(commentId, postId, repliesCount);
    if (success) {
      setComments(prev => ({
        ...prev,
        // Filter out the comment AND its replies (cascade)
        [postId]: prev[postId]?.filter(c => c.id !== commentId && c.parent_comment_id !== commentId) || [],
      }));
    }
  }, [deleteComment]);

  const handleReply = useCallback((postId: string, comment: FluxComment) => {
    setReplyingTo(prev => ({ ...prev, [postId]: comment }));
    // Don't prepend @Name to the input — we use a structural reply indicator instead
    // Focus the input after state update
    setTimeout(() => {
      const input = commentInputRefs.current[postId];
      if (input) {
        input.focus();
      }
    }, 50);
  }, []);

  const cancelReply = useCallback((postId: string) => {
    setReplyingTo(prev => ({ ...prev, [postId]: null }));
    setNewComment(prev => ({ ...prev, [postId]: '' }));
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  }, []);

  const handleViewProfile = useCallback((uid: string) => {
    setSelectedRescuerId(uid);
    setRescuerSheetOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary via-primary to-primary-dark md:bg-transparent md:pb-6">
        {/* Header compact */}
        <div className="relative bg-gradient-to-br from-probain-blue to-primary px-4 py-3 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                <MessageCircle className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">FLUX</h1>
                <p className="text-[11px] text-white/40">Publications et actualités</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton posts fidèles au layout */}
        <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger-children">
          <PostSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary to-primary-dark md:bg-transparent md:pb-6">
      {/* Header compact */}
      <div className="relative bg-gradient-to-br from-probain-blue to-primary px-4 py-3 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <MessageCircle className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">FLUX</h1>
              <p className="text-[11px] text-white/40">Publications et actualités</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`p-4 md:p-6 lg:p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 ${posts.length > 0 ? 'stagger-children' : ''}`}>
        {posts.length === 0 ? (
          <div className="bg-white/10 rounded-xl p-8 text-center col-span-full">
            <p className="text-white/60">Aucune publication pour le moment</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white md:bg-white/10 md:backdrop-blur-md md:border md:border-white/10 rounded-xl overflow-hidden shadow-lg card-pressable">
              {/* Post Header */}
              <div className="p-4 flex items-center gap-3 border-b border-gray-100">
                {post.author_avatar_url ? (
                  <LazyImage
                    src={post.author_avatar_url}
                    alt={post.author_name}
                    className="w-10 h-10 rounded-full object-cover"
                    wrapperClassName="w-10 h-10 rounded-full flex-shrink-0"
                    fallback={
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-probain-blue to-primary flex items-center justify-center">
                        <span className="text-white font-bold text-sm">PB</span>
                      </div>
                    }
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-probain-blue to-primary flex items-center justify-center">
                    <span className="text-white font-bold text-sm">PB</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 md:text-white">{post.author_name}</p>
                  <p className="text-gray-500 md:text-white/50 text-xs">{formatDate(post.created_at)}</p>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4">
                {post.title && (
                  <h2 className="font-bold text-lg text-gray-900 md:text-white mb-2">{post.title}</h2>
                )}
                <p className="text-gray-700 md:text-white/80 whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Post Image */}
              {post.image_url && (
                <div className="px-4 pb-4">
                  <LazyImage
                    src={post.image_url}
                    alt={`Image de la publication: ${post.title || 'Sans titre'}`}
                    className="w-full rounded-lg object-contain max-h-96 bg-gray-50"
                    wrapperClassName="rounded-lg bg-gray-50 min-h-[100px]"
                  />
                </div>
              )}

              {/* Likes & Comments Count */}
              <div className="px-4 py-2 border-t border-gray-100 md:border-white/10 flex items-center justify-between text-sm text-gray-500 md:text-white/50">
                <span>{post.likes_count} j'aime{post.likes_count > 1 ? 's' : ''}</span>
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => handleToggleComments(post.id)}
                >
                  {post.comments_count} commentaire{post.comments_count > 1 ? 's' : ''}
                </span>
              </div>

              {/* Actions */}
              <div className="px-4 py-2 border-t border-gray-100 md:border-white/10 flex gap-2">
                <Button
                  variant="ghost"
                  className={`flex-1 ${post.user_has_liked ? 'text-red-500' : 'text-gray-600'}`}
                  onClick={() => {
                    if (!post.user_has_liked) {
                      setAnimatingLike(prev => ({ ...prev, [post.id]: true }));
                      setTimeout(() => setAnimatingLike(prev => ({ ...prev, [post.id]: false })), 400);
                      hapticFeedback('medium');
                    } else {
                      hapticFeedback('light');
                    }
                    toggleLike(post.id);
                  }}
                >
                  <Heart className={`h-5 w-5 mr-2 transition-all duration-200 ${post.user_has_liked ? 'fill-current' : ''} ${animatingLike[post.id] ? 'like-bounce' : ''}`} />
                  J'aime
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 text-gray-600"
                  onClick={() => handleToggleComments(post.id)}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Commenter
                </Button>
              </div>

              {/* Comments Section */}
              {expandedComments[post.id] && (
                <div className="border-t border-gray-100">
                  {/* Comments List */}
                  <div className="max-h-80 overflow-y-auto">
                    {loadingComments[post.id] ? (
                      <div className="p-4 flex justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : comments[post.id]?.length === 0 ? (
                      <p className="p-4 text-center text-gray-500 text-sm">
                        Aucun commentaire. Soyez le premier !
                      </p>
                    ) : (
                      <div className="p-4 space-y-3">
                        {groupCommentsIntoThreads(comments[post.id] || []).map((rootComment) => (
                          <div key={rootComment.id}>
                            {/* Root comment */}
                            <CommentBubble
                              comment={rootComment}
                              postId={post.id}
                              onReply={handleReply}
                              onDelete={handleDeleteComment}
                              canViewProfile={isEstablishment && rootComment.profile_type === 'maitre_nageur' && rootComment.user_id !== userId}
                              isOwn={rootComment.user_id === userId}
                              onViewProfile={handleViewProfile}
                              formatDate={formatDate}
                              repliesCount={rootComment.replies.length}
                            />

                            {/* Replies toggle + nested replies */}
                            {rootComment.replies.length > 0 && (
                              <div className="ml-10 mt-1">
                                <button
                                  onClick={() => setExpandedReplies(prev => ({ ...prev, [rootComment.id]: !prev[rootComment.id] }))}
                                  className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors flex items-center gap-1 py-1"
                                >
                                  {expandedReplies[rootComment.id] ? (
                                    <>
                                      <ChevronUp className="h-3 w-3" />
                                      Masquer les réponses
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3" />
                                      Voir {rootComment.replies.length === 1
                                        ? '1 réponse'
                                        : `les ${rootComment.replies.length} réponses`}
                                    </>
                                  )}
                                </button>

                                {expandedReplies[rootComment.id] && (
                                  <div className="mt-2 space-y-2">
                                    {rootComment.replies.map((reply) => (
                                      <CommentBubble
                                        key={reply.id}
                                        comment={reply}
                                        postId={post.id}
                                        onReply={handleReply}
                                        onDelete={handleDeleteComment}
                                        canViewProfile={isEstablishment && reply.profile_type === 'maitre_nageur' && reply.user_id !== userId}
                                        isOwn={reply.user_id === userId}
                                        onViewProfile={handleViewProfile}
                                        formatDate={formatDate}
                                        isReply
                                        parentUserName={rootComment.user_name}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="border-t border-gray-100">
                    {/* Reply indicator */}
                    {replyingTo[post.id] && (
                      <div className="px-4 pt-2 flex items-center gap-2 text-xs text-gray-500">
                        <Reply className="h-3 w-3" />
                        <span>Réponse à <span className="font-medium text-gray-700">{replyingTo[post.id]?.user_name}</span></span>
                        <button
                          type="button"
                          onClick={() => cancelReply(post.id)}
                          className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label="Annuler la réponse"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddComment(post.id);
                      }}
                      className="p-4 pt-2 flex gap-2"
                    >
                      <input
                        ref={(el) => { commentInputRefs.current[post.id] = el; }}
                        type="text"
                        placeholder={replyingTo[post.id] ? `Répondre à ${replyingTo[post.id]?.user_name}...` : "Écrire un commentaire..."}
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        className="flex-1 h-10 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                        aria-label="Écrire un commentaire"
                        autoComplete="off"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment[post.id] || !newComment[post.id]?.trim()}
                        className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-md bg-primary hover:bg-primary-dark text-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        aria-label="Envoyer le commentaire"
                      >
                        {submittingComment[post.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Sheet profil sauveteur (établissements uniquement) */}
      {isEstablishment && (
        <RescuerProfileSheet
          rescuerUserId={selectedRescuerId}
          open={rescuerSheetOpen}
          onOpenChange={setRescuerSheetOpen}
        />
      )}
    </div>
  );
};

export default Flux;
