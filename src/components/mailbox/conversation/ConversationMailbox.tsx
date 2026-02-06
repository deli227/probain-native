import { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConversations } from "./useConversations";
import { ConversationList } from "./ConversationList";
import { ConversationView } from "./ConversationView";
import { EmptyState } from "./EmptyState";
import { Mail } from "lucide-react";
import { ConversationSkeleton } from "@/components/skeletons/ConversationSkeleton";

export const ConversationMailbox = () => {
  const isMobile = useIsMobile();
  const {
    userId,
    userProfileType,
    conversations,
    isLoading,
    markConversationAsRead,
    deleteMessage,
    deleteConversation,
    sendReply,
    isSending,
  } = useConversations();

  const [selectedConversationKey, setSelectedConversationKey] = useState<string | null>(null);

  // Sur desktop, selectionner la premiere conversation par defaut
  useEffect(() => {
    if (!isMobile && !selectedConversationKey && conversations.length > 0) {
      setSelectedConversationKey(conversations[0].conversationKey);
    }
  }, [isMobile, conversations, selectedConversationKey]);

  const selectedConversation = conversations.find(
    (c) => c.conversationKey === selectedConversationKey
  );

  const handleSelectConversation = (conversationKey: string) => {
    setSelectedConversationKey(conversationKey);
    markConversationAsRead(conversationKey);
  };

  const conversationRef = useRef<HTMLDivElement>(null);

  const handleBack = useCallback(() => {
    const el = conversationRef.current;
    if (el) {
      el.classList.remove("conversation-enter");
      el.classList.add("conversation-exit");
      const onEnd = () => {
        el.removeEventListener("animationend", onEnd);
        setSelectedConversationKey(null);
      };
      el.addEventListener("animationend", onEnd);
    } else {
      setSelectedConversationKey(null);
    }
  }, []);

  const handleSendReply = (content: string, subject: string) => {
    if (!selectedConversation) return;
    sendReply({
      recipientId: selectedConversation.contact.id,
      subject,
      content,
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId);
  };

  const handleDeleteConversation = (messageIds: string[]) => {
    deleteConversation(messageIds);
    setSelectedConversationKey(null);
  };

  const unreadTotal = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  // Mobile : affichage par navigation (liste OU conversation)
  // min-h-screen + bg-primary-dark couvre tout le viewport immediatement.
  // Utilise bg-primary-dark (#0A1033) pour etre identique au DashboardLayout et
  // au LoadingScreen Suspense, evitant tout flash de couleur lors des transitions.
  if (isMobile) {
    return (
      <div
        className="fixed left-0 right-0 bg-primary-dark overflow-hidden"
        style={{
          top: 'calc(56px + env(safe-area-inset-top, 0px))',
          bottom: 'calc(86px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {isLoading ? (
          <div key="loading-state" className="absolute inset-0 z-30 bg-primary-dark flex flex-col">
            {/* Header identique au header final pour eviter le flash */}
            <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-br from-primary via-probain-blue to-primary-dark flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-white/10">
                  <Mail className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">MESSAGERIE</h2>
                  <p className="text-[11px] text-white/40">Chargement...</p>
                </div>
              </div>
            </div>
            <ConversationSkeleton count={6} />
          </div>
        ) : selectedConversationKey && selectedConversation && userId ? (
          <div ref={conversationRef} key={`conversation-${selectedConversationKey}`} className="absolute inset-0 z-20 bg-primary-dark conversation-enter">
            <ConversationView
              conversation={selectedConversation}
              currentUserId={userId}
              userProfileType={userProfileType}
              onBack={handleBack}
              onSendReply={handleSendReply}
              onDeleteMessage={handleDeleteMessage}
              onDeleteConversation={handleDeleteConversation}
              isSending={isSending}
              showBackButton={true}
            />
          </div>
        ) : (
          <div key="list-state" className="absolute inset-0 z-10 bg-primary-dark">
            <ConversationList
              conversations={conversations}
              selectedConversationKey={null}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              unreadTotal={unreadTotal}
            />
          </div>
        )}
      </div>
    );
  }

  // Desktop : split view
  return (
    <div className="h-[calc(100vh-2rem)] max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex h-full gap-4 lg:gap-6">
        {/* Liste des conversations (gauche) */}
        <div className="w-80 lg:w-96 flex-shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col h-full">
              <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-br from-primary via-probain-blue to-primary-dark flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-white/10">
                    <Mail className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">MESSAGERIE</h2>
                    <p className="text-[11px] text-white/40">Chargement...</p>
                  </div>
                </div>
              </div>
              <ConversationSkeleton count={5} />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedConversationKey={selectedConversationKey}
              onSelectConversation={handleSelectConversation}
              onDeleteConversation={handleDeleteConversation}
              unreadTotal={unreadTotal}
            />
          )}
        </div>

        {/* Conversation active (droite) */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          {selectedConversation && userId ? (
            <ConversationView
              conversation={selectedConversation}
              currentUserId={userId}
              userProfileType={userProfileType}
              onBack={handleBack}
              onSendReply={handleSendReply}
              onDeleteMessage={handleDeleteMessage}
              onDeleteConversation={handleDeleteConversation}
              isSending={isSending}
              showBackButton={false}
            />
          ) : (
            <EmptyState type="no-selection" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationMailbox;
