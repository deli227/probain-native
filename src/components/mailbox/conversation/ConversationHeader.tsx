import { ArrowLeft, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getProfileTypeLabel } from "./types";
import type { ConversationContact } from "./types";

interface ConversationHeaderProps {
  contact: ConversationContact;
  onBack: () => void;
  onDeleteConversation: () => void;
  showBackButton: boolean;
  jobTitle?: string;
}

export const ConversationHeader = ({
  contact,
  onBack,
  onDeleteConversation,
  showBackButton,
  jobTitle,
}: ConversationHeaderProps) => {
  const initials = `${(contact.first_name || "U")[0]}${(contact.last_name || "")[0] || ""}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-xl">
      {showBackButton && (
        <button
          onClick={onBack}
          className="p-1.5 -ml-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white/70" />
        </button>
      )}

      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage
          src={contact.avatar_url || undefined}
          alt={`${contact.first_name} ${contact.last_name}`}
          className="object-cover"
        />
        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate text-sm">
          {contact.first_name} {contact.last_name}
        </h3>
        {jobTitle ? (
          <p className="text-xs text-cyan-400/60 truncate">
            Candidature : {jobTitle}
          </p>
        ) : (
          <p className="text-xs text-white/40">
            {getProfileTypeLabel(contact.profile_type)}
          </p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onDeleteConversation}
        className="h-9 w-9 text-white/40 hover:text-red-400 hover:bg-red-500/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
