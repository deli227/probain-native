// Types partagés pour la messagerie

export interface MessageProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_type: string | null;
  avatar_url?: string | null;
}

export interface Message {
  id: string;
  subject: string;
  content: string;
  read: boolean | null;
  created_at: string;
  sender_id: string;
  recipient_id: string;
  sender: MessageProfile | null;
  recipient: MessageProfile | null;
}
