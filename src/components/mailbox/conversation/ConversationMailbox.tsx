import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConversations } from "./useConversations";
import { ConversationList } from "./ConversationList";
import { ConversationView } from "./ConversationView";
import { EmptyState } from "./EmptyState";
import { LoadingScreen } from "@/components/shared/LoadingScreen";

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

  if (isLoading) {
    return <LoadingScreen message="Chargement des messages..." />;
  }

  // Mobile : affichage par navigation (liste OU conversation)
  if (isMobile) {
    if (selectedContactId && selectedConversation && userId) {
      return (
        <div className="h-[calc(100vh-56px-76px)] flex flex-col bg-[#0a1628]">
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
      );
    }

    return (
      <div className="h-[calc(100vh-56px-76px)] flex flex-col bg-[#0a1628]">
        <ConversationList
          conversations={conversations}
          selectedContactId={null}
          onSelectConversation={handleSelectConversation}
          unreadTotal={unreadTotal}
        />
      </div>
    );
  }

  // Desktop : split view
  return (
    <div className="h-[calc(100vh-2rem)] max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex h-full gap-4 lg:gap-6">
        {/* Liste des conversations (gauche) */}
        <div className="w-80 lg:w-96 flex-shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <ConversationList
            conversations={conversations}
            selectedContactId={selectedContactId}
            onSelectConversation={handleSelectConversation}
            unreadTotal={unreadTotal}
          />
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
