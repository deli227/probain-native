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
  conversationKey: string;
  jobTitle?: string;
}

export function getProfileTypeLabel(type: string | null): string {
  switch (type) {
    case "maitre_nageur": return "Sauveteur";
    case "formateur": return "Formateur";
    case "etablissement": return "Établissement";
    default: return "Utilisateur";
  }
}

/** Strip tous les prefixes "Re: " d'un subject pour obtenir le sujet de base */
export function getBaseSubject(subject: string): string {
  let s = subject;
  while (s.startsWith("Re: ")) s = s.slice(4);
  return s;
}

/** Verifie si un subject est lie a une candidature (avec ou sans "Re: ") */
export function isCandidatureSubject(subject: string): boolean {
  return getBaseSubject(subject).startsWith("Candidature:");
}

/** Extrait le titre de l'offre d'emploi depuis un subject candidature */
export function extractJobTitle(subject: string): string {
  const base = getBaseSubject(subject);
  return base.startsWith("Candidature: ") ? base.slice("Candidature: ".length).trim() : "";
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

/**
 * Groupe les messages en conversations.
 * - Sauveteur (maitre_nageur) : conversations separees par candidature (subject)
 * - Autres profils : conversations groupees par contact (comportement par defaut)
 */
export function groupMessagesIntoConversations(
  messages: Message[],
  currentUserId: string,
  userProfileType?: string | null
): Conversation[] {
  const conversationMap = new Map<string, { contact: ConversationContact; messages: Message[] }>();

  for (const message of messages) {
    const contact = getContactFromMessage(message, currentUserId);

    // Cle de groupement : sauveteur + candidature → contactId__candidature__BaseSubject
    let key = contact.id;
    if (userProfileType === "maitre_nageur" && message.subject) {
      const base = getBaseSubject(message.subject);
      if (base.startsWith("Candidature:")) {
        key = `${contact.id}__candidature__${base}`;
      }
    }

    if (!conversationMap.has(key)) {
      conversationMap.set(key, { contact, messages: [] });
    }

    conversationMap.get(key)!.messages.push(message);
  }

  const conversations: Conversation[] = [];

  for (const [key, { contact, messages: msgs }] of conversationMap) {
    // Trier par date ascendante (ancien → recent) pour l'affichage bulles
    const sorted = [...msgs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const isCandidatureConv = key.includes("__candidature__");

    conversations.push({
      contact,
      messages: sorted,
      lastMessage: sorted[sorted.length - 1],
      unreadCount: sorted.filter(
        (m) => m.recipient_id === currentUserId && !m.read
      ).length,
      conversationKey: key,
      jobTitle: isCandidatureConv ? extractJobTitle(sorted[0].subject) : undefined,
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
