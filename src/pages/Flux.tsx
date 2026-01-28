import { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Send, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { useFlux, FluxComment } from '@/hooks/useFlux';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useProfile } from '@/contexts/ProfileContext';
import { LazyImage } from '@/components/ui/lazy-image';

const Flux = () => {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const { profileType } = useProfile();
  const { posts, loading, toggleLike, fetchComments, addComment, deleteComment } = useFlux(userId, profileType);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, FluxComment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

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
    setExpandedComments(prev => {
      const isExpanded = prev[postId];
      if (!isExpanded && !comments[postId]) {
        setLoadingComments(p => ({ ...p, [postId]: true }));
        fetchComments(postId).then(postComments => {
          setComments(p => ({ ...p, [postId]: postComments }));
          setLoadingComments(p => ({ ...p, [postId]: false }));
        });
      }
      return { ...prev, [postId]: !isExpanded };
    });
  }, [comments, fetchComments]);

  const handleAddComment = useCallback(async (postId: string, content: string) => {
    if (!content?.trim()) return;

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    const success = await addComment(postId, content);

    if (success) {
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      // Refresh comments
      const postComments = await fetchComments(postId);
      setComments(prev => ({ ...prev, [postId]: postComments }));
    }
    setSubmittingComment(prev => ({ ...prev, [postId]: false }));
  }, [addComment, fetchComments]);

  const handleDeleteComment = useCallback(async (commentId: string, postId: string) => {
    const success = await deleteComment(commentId, postId);
    if (success) {
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId]?.filter(c => c.id !== commentId) || [],
      }));
    }
  }, [deleteComment]);

  const formatDate = useCallback((dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary via-primary to-primary-dark pb-20">
        {/* Header compact */}
        <div className="relative bg-gradient-to-br from-probain-blue to-primary py-5 md:py-6 px-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative max-w-4xl mx-auto text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/10 rounded-xl blur-md opacity-50" />
                <div className="relative bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
                  <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
                FLUX
              </h1>
            </div>
          </div>
        </div>

        {/* Loader simple au lieu du skeleton */}
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-white/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-primary to-primary-dark pb-20">
      {/* Header compact */}
      <div className="relative bg-gradient-to-br from-probain-blue to-primary py-5 md:py-6 px-4 overflow-hidden">
        {/* Cercle décoratif */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex flex-col items-center gap-2">
            {/* Icône compacte */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/10 rounded-xl blur-md opacity-50" />
              <div className="relative bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20">
                <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>

            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
              FLUX
            </h1>
          </div>
        </div>
      </div>

      <div className={`p-4 md:p-6 lg:p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 ${posts.length > 0 ? 'stagger-children' : ''}`}>
        {posts.length === 0 ? (
          <div className="bg-white/10 rounded-xl p-8 text-center col-span-full">
            <p className="text-white/60">Aucune publication pour le moment</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl overflow-hidden shadow-lg card-pressable">
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
                  <p className="font-semibold text-gray-900">{post.author_name}</p>
                  <p className="text-gray-500 text-xs">{formatDate(post.created_at)}</p>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4">
                {post.title && (
                  <h2 className="font-bold text-lg text-gray-900 mb-2">{post.title}</h2>
                )}
                <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
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
              <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>{post.likes_count} j'aime{post.likes_count > 1 ? 's' : ''}</span>
                <span>{post.comments_count} commentaire{post.comments_count > 1 ? 's' : ''}</span>
              </div>

              {/* Actions */}
              <div className="px-4 py-2 border-t border-gray-100 flex gap-2">
                <Button
                  variant="ghost"
                  className={`flex-1 ${post.user_has_liked ? 'text-red-500' : 'text-gray-600'}`}
                  onClick={() => toggleLike(post.id)}
                >
                  <Heart className={`h-5 w-5 mr-2 ${post.user_has_liked ? 'fill-current' : ''}`} />
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
                  <div className="max-h-60 overflow-y-auto">
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
                        {comments[post.id]?.map((comment) => (
                          <div key={comment.id} className="flex gap-2">
                            <Avatar className="h-8 w-8 bg-gray-200">
                              {comment.user_avatar ? (
                                <img src={comment.user_avatar} alt={`Avatar de ${comment.user_name}`} className="rounded-full" />
                              ) : (
                                <span className="text-xs font-medium text-gray-600">
                                  {comment.user_name?.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </Avatar>
                            <div className="flex-1 bg-gray-100 rounded-lg p-2">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm text-gray-900">{comment.user_name}</p>
                                {comment.user_id === userId && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                                    onClick={() => handleDeleteComment(comment.id, post.id)}
                                    aria-label="Supprimer le commentaire"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatDate(comment.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="p-4 border-t border-gray-100 flex gap-2">
                    <Input
                      placeholder="Écrire un commentaire..."
                      value={newComment[post.id] || ''}
                      onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(post.id, newComment[post.id] || '');
                        }
                      }}
                      className="flex-1"
                      aria-label="Écrire un commentaire"
                    />
                    <Button
                      size="icon"
                      onClick={() => handleAddComment(post.id, newComment[post.id] || '')}
                      disabled={submittingComment[post.id] || !newComment[post.id]?.trim()}
                      className="bg-primary hover:bg-primary-dark"
                      aria-label="Envoyer le commentaire"
                    >
                      {submittingComment[post.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Flux;
