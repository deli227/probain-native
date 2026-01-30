import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import type { Conversation } from "./types";

interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
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
}: ConversationListItemProps) => {
  const { contact, lastMessage, unreadCount } = conversation;
  const initials = `${(contact.first_name || "U")[0]}${(contact.last_name || "")[0] || ""}`;

  // Apercu du dernier message (tronque)
  const preview = lastMessage.content.length > 60
    ? lastMessage.content.substring(0, 60) + "..."
    : lastMessage.content;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left ${
        isSelected
          ? "bg-white/15 border-l-3 border-l-cyan-500"
          : unreadCount > 0
            ? "bg-white/10 hover:bg-white/15"
            : "hover:bg-white/5"
      }`}
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
          <span className="text-[11px] text-white/40 flex-shrink-0">
            {formatMessageDate(lastMessage.created_at)}
          </span>
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
    </button>
  );
};
