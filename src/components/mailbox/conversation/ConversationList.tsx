import { useState } from "react";
import { Mail } from "lucide-react";
import { ConversationListItem } from "./ConversationListItem";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EmptyState } from "./EmptyState";
import type { Conversation } from "./types";

interface ConversationListProps {
  conversations: Conversation[];
  selectedContactId: string | null;
  onSelectConversation: (contactId: string) => void;
  onDeleteConversation?: (messageIds: string[]) => void;
  unreadTotal: number;
}

export const ConversationList = ({
  conversations,
  selectedContactId,
  onSelectConversation,
  onDeleteConversation,
  unreadTotal,
}: ConversationListProps) => {
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);

  const handleConfirmDelete = () => {
    if (deleteTarget && onDeleteConversation) {
      const messageIds = deleteTarget.messages.map((m) => m.id);
      onDeleteConversation(messageIds);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header de la liste */}
      <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-br from-primary via-probain-blue to-primary-dark flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-white/10">
              <Mail className="h-5 w-5 text-cyan-400" />
            </div>
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadTotal > 9 ? "9+" : unreadTotal}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              MESSAGERIE
            </h2>
            <p className="text-[11px] text-white/40">
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {conversations.length === 0 ? (
          <EmptyState type="no-conversations" />
        ) : (
          conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.contact.id}
              conversation={conversation}
              isSelected={conversation.contact.id === selectedContactId}
              onClick={() => onSelectConversation(conversation.contact.id)}
              onDelete={onDeleteConversation ? () => setDeleteTarget(conversation) : undefined}
            />
          ))
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        type="conversation"
      />
    </div>
  );
};
