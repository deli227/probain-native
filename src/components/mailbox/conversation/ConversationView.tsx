import { useEffect, useRef, useState } from "react";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageBubble } from "./MessageBubble";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationInput } from "./ConversationInput";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { Conversation } from "./types";

interface ConversationViewProps {
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
  onSendReply: (content: string, subject: string) => void;
  onDeleteMessage: (id: string) => void;
  onDeleteConversation: (messageIds: string[]) => void;
  isSending: boolean;
  showBackButton: boolean;
}

export const ConversationView = ({
  conversation,
  currentUserId,
  onBack,
  onSendReply,
  onDeleteMessage,
  onDeleteConversation,
  isSending,
  showBackButton,
}: ConversationViewProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"message" | "conversation">("message");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  // Scroll vers le bas quand les messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages.length]);

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteType("message");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConversation = () => {
    setDeleteType("conversation");
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteType === "conversation") {
      onDeleteConversation(conversation.messages.map((m) => m.id));
      onBack();
    } else if (messageToDelete) {
      onDeleteMessage(messageToDelete);
    }
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const handleSend = (content: string, subject: string) => {
    onSendReply(content, subject);
  };

  // Dernier sujet de la conversation
  const lastSubject = conversation.messages[conversation.messages.length - 1]?.subject;

  // Grouper les messages par jour
  let lastDate: Date | null = null;

  return (
    <div className="flex flex-col h-full">
      <ConversationHeader
        contact={conversation.contact}
        onBack={onBack}
        onDeleteConversation={handleDeleteConversation}
        showBackButton={showBackButton}
      />

      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {conversation.messages.map((message) => {
          const messageDate = new Date(message.created_at);
          const showDateSeparator = !lastDate || !isSameDay(lastDate, messageDate);
          lastDate = messageDate;

          return (
            <div key={message.id}>
              {showDateSeparator && (
                <div className="flex items-center justify-center my-4">
                  <span className="text-[11px] text-white/30 bg-white/5 px-3 py-1 rounded-full">
                    {format(messageDate, "d MMMM yyyy", { locale: fr })}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                isSent={message.sender_id === currentUserId}
                onDelete={handleDeleteMessage}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <ConversationInput
        onSend={handleSend}
        isSending={isSending}
        lastSubject={lastSubject}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        type={deleteType}
      />
    </div>
  );
};
