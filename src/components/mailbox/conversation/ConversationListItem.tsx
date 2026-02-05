import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import type { Conversation } from "./types";

interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

function formatMessageDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Hier";
  return format(date, "dd/MM/yy", { locale: fr });
}

export const ConversationListItem = ({
  conversation,
  isSelected,
  onClick,
  onDelete,
}: ConversationListItemProps) => {
  const { contact, lastMessage, unreadCount } = conversation;
  const initials = `${(contact.first_name || "U")[0]}${(contact.last_name || "")[0] || ""}`;

  // Apercu du dernier message (tronque)
  const preview = lastMessage.content.length > 60
    ? lastMessage.content.substring(0, 60) + "..."
    : lastMessage.content;

  return (
    <div
      className={`group w-full flex items-center gap-3 px-4 py-3 transition-all text-left cursor-pointer card-pressable ${
        isSelected
          ? "bg-white/15 border-l-3 border-l-cyan-500"
          : unreadCount > 0
            ? "bg-white/10 hover:bg-white/15"
            : "hover:bg-white/5"
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={contact.avatar_url || undefined}
            alt={`${contact.first_name} ${contact.last_name}`}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate ${
              unreadCount > 0
                ? "font-bold text-white"
                : "font-medium text-white/80"
            }`}
          >
            {contact.first_name} {contact.last_name}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[11px] text-white/40">
              {formatMessageDate(lastMessage.created_at)}
            </span>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded-full text-white/0 group-hover:text-white/40 hover:!text-red-400 hover:bg-red-500/10 transition-all focus:outline-none focus-visible:outline-none"
                aria-label="Supprimer la conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <p
          className={`text-xs mt-0.5 truncate ${
            unreadCount > 0
              ? "text-white/70 font-medium"
              : "text-white/40"
          }`}
        >
          {preview}
        </p>
      </div>
    </div>
  );
};
