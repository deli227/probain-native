import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConversations } from "./useConversations";
import { ConversationList } from "./ConversationList";
import { ConversationView } from "./ConversationView";
import { EmptyState } from "./EmptyState";
import { Loader2, Mail } from "lucide-react";

export const ConversationMailbox = () => {
  const isMobile = useIsMobile();
  const {
    userId,
    conversations,
    isLoading,
    markConversationAsRead,
    deleteMessage,
    deleteConversation,
    sendReply,
    isSending,
  } = useConversations();

  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Sur desktop, selectionner la premiere conversation par defaut
  useEffect(() => {
    if (!isMobile && !selectedContactId && conversations.length > 0) {
      setSelectedContactId(conversations[0].contact.id);
    }
  }, [isMobile, conversations, selectedContactId]);

  const selectedConversation = conversations.find(
    (c) => c.contact.id === selectedContactId
  );

  const handleSelectConversation = (contactId: string) => {
    setSelectedContactId(contactId);
    markConversationAsRead(contactId);
  };

  const handleBack = () => {
    setSelectedContactId(null);
  };

  const handleSendReply = (content: string, subject: string) => {
    if (!selectedContactId) return;
    sendReply({
      recipientId: selectedContactId,
      subject,
      content,
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId);
  };

  const handleDeleteConversation = (messageIds: string[]) => {
    deleteConversation(messageIds);
    setSelectedContactId(null);
  };

  const unreadTotal = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  // Mobile : affichage par navigation (liste OU conversation)
  // min-h-screen + bg-primary-dark couvre tout le viewport immediatement.
  // Utilise bg-primary-dark (#0A1033) pour etre identique au DashboardLayout et
  // au LoadingScreen Suspense, evitant tout flash de couleur lors des transitions.
  if (isMobile) {
    return (
      <div className="min-h-screen bg-primary-dark">
        <div className="h-[calc(100vh-56px-76px)] flex flex-col relative overflow-hidden">
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
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
          ) : selectedContactId && selectedConversation && userId ? (
            <div key={`conversation-${selectedContactId}`} className="absolute inset-0 z-20 bg-primary-dark">
              <ConversationView
                conversation={selectedConversation}
                currentUserId={userId}
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
                selectedContactId={null}
                onSelectConversation={handleSelectConversation}
                onDeleteConversation={handleDeleteConversation}
                unreadTotal={unreadTotal}
              />
            </div>
          )}
        </div>
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
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white/50 animate-spin" />
              </div>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedContactId={selectedContactId}
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
