import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2, FileText, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { Message } from "@/types/message";

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
  onDelete: (id: string) => void;
}

/** Detecte les URLs et le pattern "📎 CV joint: URL" pour les rendre cliquables */
const renderMessageContent = (content: string, isSent: boolean) => {
  // Pattern pour "📎 CV joint: URL"
  const cvPattern = /📎\s*CV joint:\s*(https?:\/\/[^\s]+)/g;
  // Pattern generique pour les URLs
  const urlPattern = /https?:\/\/[^\s]+/g;

  // D'abord, separer le contenu par le pattern CV
  const cvMatch = cvPattern.exec(content);

  if (cvMatch) {
    const cvUrl = cvMatch[1];
    const beforeCv = content.slice(0, cvMatch.index);
    const afterCv = content.slice(cvMatch.index + cvMatch[0].length);

    return (
      <>
        {beforeCv && <span className="whitespace-pre-wrap break-words">{beforeCv}</span>}
        <a
          href={cvUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl transition-colors ${
            isSent
              ? "bg-white/20 hover:bg-white/30"
              : "bg-white/10 hover:bg-white/20"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <FileText className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium truncate">Voir le CV</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-auto opacity-60" />
        </a>
        {afterCv && <span className="whitespace-pre-wrap break-words">{afterCv}</span>}
      </>
    );
  }

  // Pas de CV — chercher les URLs generiques
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex
  urlPattern.lastIndex = 0;

  while ((match = urlPattern.exec(content)) !== null) {
    // Texte avant l'URL
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const url = match[0];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-80 break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {url}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  // Texte restant apres la derniere URL
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  // Si aucune URL trouvee, retourner le contenu tel quel
  if (parts.length === 0) {
    return <span className="whitespace-pre-wrap break-words">{content}</span>;
  }

  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => (
        <span key={i}>{part}</span>
      ))}
    </span>
  );
};

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
          <div className="text-sm">{renderMessageContent(message.content, isSent)}</div>

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
