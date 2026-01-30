import type { Message, MessageProfile } from "@/types/message";

export interface ConversationContact {
  id: string;
  first_name: string;
  last_name: string;
  profile_type: string;
  avatar_url: string | null;
}

export interface Conversation {
  contact: ConversationContact;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

export function getProfileTypeLabel(type: string | null): string {
  switch (type) {
    case "maitre_nageur": return "Sauveteur";
    case "formateur": return "Formateur";
    case "etablissement": return "Établissement";
    default: return "Utilisateur";
  }
}

export function getContactFromMessage(message: Message, currentUserId: string): ConversationContact {
  const isReceived = message.recipient_id === currentUserId;
  const profile = isReceived ? message.sender : message.recipient;

  return {
    id: isReceived ? message.sender_id : message.recipient_id,
    first_name: profile?.first_name || "Utilisateur",
    last_name: profile?.last_name || "",
    profile_type: profile?.profile_type || "",
    avatar_url: (profile as MessageProfile & { avatar_url?: string | null })?.avatar_url || null,
  };
}

export function groupMessagesIntoConversations(
  messages: Message[],
  currentUserId: string
): Conversation[] {
  const conversationMap = new Map<string, { contact: ConversationContact; messages: Message[] }>();

  for (const message of messages) {
    const contact = getContactFromMessage(message, currentUserId);

    if (!conversationMap.has(contact.id)) {
      conversationMap.set(contact.id, { contact, messages: [] });
    }

    conversationMap.get(contact.id)!.messages.push(message);
  }

  const conversations: Conversation[] = [];

  for (const [, { contact, messages: msgs }] of conversationMap) {
    // Trier par date ascendante (ancien → recent) pour l'affichage bulles
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    conversations.push({
      contact,
      messages: sorted,
      lastMessage: sorted[sorted.length - 1],
      unreadCount: sorted.filter(
        (m) => m.recipient_id === currentUserId && !m.read
      ).length,
    });
  }

  // Trier les conversations par dernier message (recent d'abord)
  conversations.sort(
    (a, b) =>
      new Date(b.lastMessage.created_at).getTime() -
      new Date(a.lastMessage.created_at).getTime()
  );

  return conversations;
}
