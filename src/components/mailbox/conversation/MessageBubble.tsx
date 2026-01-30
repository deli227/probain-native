import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { Message } from "@/types/message";

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  onDelete: (id: string) => void;
}

export const MessageBubble = ({ message, isSent, onDelete }: MessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`flex ${isSent ? "justify-end" : "justify-start"} mb-3 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`relative max-w-[80%] sm:max-w-[70%]`}>
        {/* Sujet si present et pas un "Re:" */}
        {message.subject && !message.subject.startsWith("Re:") && (
          <p
            className={`text-[10px] font-semibold mb-1 px-1 text-white/40 ${
              isSent ? "text-right" : "text-left"
            }`}
          >
            {message.subject}
          </p>
        )}

        <div
          className={`relative rounded-2xl px-4 py-2.5 ${
            isSent
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-md"
              : "bg-white/10 backdrop-blur text-white rounded-bl-md"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Bouton supprimer au hover */}
          {showActions && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(message.id);
              }}
              className={`absolute -top-2 ${
                isSent ? "-left-8" : "-right-8"
              } p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-all opacity-0 group-hover:opacity-100`}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        <p
          className={`text-[10px] mt-1 px-1 text-white/30 ${
            isSent ? "text-right" : "text-left"
          }`}
        >
          {format(new Date(message.created_at), "HH:mm", { locale: fr })}
        </p>
      </div>
    </div>
  );
};
