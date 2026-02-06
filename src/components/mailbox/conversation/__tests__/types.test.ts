import { describe, it, expect } from 'vitest';
import {
  getProfileTypeLabel,
  getContactFromMessage,
  groupMessagesIntoConversations,
  getBaseSubject,
  isCandidatureSubject,
  extractJobTitle,
} from '../types';
import type { Message } from '@/types/message';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(overrides: Partial<Message> & { id: string }): Message {
  return {
    subject: '',
    content: 'Hello',
    read: false,
    created_at: '2026-01-30T10:00:00Z',
    sender_id: 'user-a',
    recipient_id: 'user-b',
    sender: { id: 'user-a', first_name: 'Alice', last_name: 'Durand', profile_type: 'maitre_nageur' },
    recipient: { id: 'user-b', first_name: 'Bob', last_name: 'Martin', profile_type: 'formateur' },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getProfileTypeLabel
// ---------------------------------------------------------------------------

describe('getProfileTypeLabel', () => {
  it('returns "Sauveteur" for maitre_nageur', () => {
    expect(getProfileTypeLabel('maitre_nageur')).toBe('Sauveteur');
  });

  it('returns "Formateur" for formateur', () => {
    expect(getProfileTypeLabel('formateur')).toBe('Formateur');
  });

  it('returns "Établissement" for etablissement', () => {
    expect(getProfileTypeLabel('etablissement')).toBe('Établissement');
  });

  it('returns "Utilisateur" for null or unknown', () => {
    expect(getProfileTypeLabel(null)).toBe('Utilisateur');
    expect(getProfileTypeLabel('unknown')).toBe('Utilisateur');
  });
});

// ---------------------------------------------------------------------------
// getBaseSubject
// ---------------------------------------------------------------------------

describe('getBaseSubject', () => {
  it('returns subject as-is when no "Re: " prefix', () => {
    expect(getBaseSubject('Candidature: Chef Nageur')).toBe('Candidature: Chef Nageur');
  });

  it('strips a single "Re: " prefix', () => {
    expect(getBaseSubject('Re: Candidature: Chef Nageur')).toBe('Candidature: Chef Nageur');
  });

  it('strips multiple "Re: " prefixes', () => {
    expect(getBaseSubject('Re: Re: Re: Candidature: Chef Nageur')).toBe('Candidature: Chef Nageur');
  });

  it('strips "Re: " from non-candidature subjects', () => {
    expect(getBaseSubject('Re: Hello')).toBe('Hello');
  });

  it('returns empty string for empty string', () => {
    expect(getBaseSubject('')).toBe('');
  });

  it('does not strip "Re:" without the space', () => {
    expect(getBaseSubject('Re:NoSpace')).toBe('Re:NoSpace');
  });
});

// ---------------------------------------------------------------------------
// isCandidatureSubject
// ---------------------------------------------------------------------------

describe('isCandidatureSubject', () => {
  it('returns true for direct candidature subject', () => {
    expect(isCandidatureSubject('Candidature: Chef Nageur')).toBe(true);
  });

  it('returns true for reply to candidature', () => {
    expect(isCandidatureSubject('Re: Candidature: Pool Manager')).toBe(true);
  });

  it('returns true for multiple Re: prefixes', () => {
    expect(isCandidatureSubject('Re: Re: Candidature: Lifeguard')).toBe(true);
  });

  it('returns false for non-candidature subject', () => {
    expect(isCandidatureSubject('Hello')).toBe(false);
  });

  it('returns false for reply to non-candidature', () => {
    expect(isCandidatureSubject('Re: Hello')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isCandidatureSubject('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// extractJobTitle
// ---------------------------------------------------------------------------

describe('extractJobTitle', () => {
  it('extracts title from direct candidature subject', () => {
    expect(extractJobTitle('Candidature: Chef Nageur')).toBe('Chef Nageur');
  });

  it('extracts title from reply to candidature', () => {
    expect(extractJobTitle('Re: Candidature: Pool Manager')).toBe('Pool Manager');
  });

  it('extracts title from multiple Re: prefixes', () => {
    expect(extractJobTitle('Re: Re: Re: Candidature: Lifeguard')).toBe('Lifeguard');
  });

  it('returns empty string for non-candidature subject', () => {
    expect(extractJobTitle('Hello')).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(extractJobTitle('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// getContactFromMessage
// ---------------------------------------------------------------------------

describe('getContactFromMessage', () => {
  it('returns sender info when current user is the recipient', () => {
    const msg = makeMessage({ id: 'm1' });
    const contact = getContactFromMessage(msg, 'user-b');
    expect(contact.id).toBe('user-a');
    expect(contact.first_name).toBe('Alice');
  });

  it('returns recipient info when current user is the sender', () => {
    const msg = makeMessage({ id: 'm1' });
    const contact = getContactFromMessage(msg, 'user-a');
    expect(contact.id).toBe('user-b');
    expect(contact.first_name).toBe('Bob');
  });

  it('falls back to "Utilisateur" when profile is null', () => {
    const msg = makeMessage({ id: 'm1', sender: null });
    const contact = getContactFromMessage(msg, 'user-b');
    expect(contact.first_name).toBe('Utilisateur');
    expect(contact.last_name).toBe('');
  });
});

// ---------------------------------------------------------------------------
// groupMessagesIntoConversations — comportement par defaut (retrocompatibilite)
// ---------------------------------------------------------------------------

describe('groupMessagesIntoConversations', () => {
  const currentUserId = 'me';

  it('returns empty array for no messages', () => {
    expect(groupMessagesIntoConversations([], currentUserId)).toEqual([]);
  });

  it('groups messages by contact (default behavior)', () => {
    const messages: Message[] = [
      makeMessage({ id: 'm1', sender_id: 'contact-1', recipient_id: currentUserId, created_at: '2026-01-30T10:00:00Z',
        sender: { id: 'contact-1', first_name: 'A', last_name: 'B', profile_type: null } }),
      makeMessage({ id: 'm2', sender_id: currentUserId, recipient_id: 'contact-1', created_at: '2026-01-30T11:00:00Z',
        recipient: { id: 'contact-1', first_name: 'A', last_name: 'B', profile_type: null } }),
      makeMessage({ id: 'm3', sender_id: 'contact-2', recipient_id: currentUserId, created_at: '2026-01-30T12:00:00Z',
        sender: { id: 'contact-2', first_name: 'C', last_name: 'D', profile_type: null } }),
    ];

    const conversations = groupMessagesIntoConversations(messages, currentUserId);

    expect(conversations).toHaveLength(2);
    expect(conversations[0].contact.id).toBe('contact-2');
    expect(conversations[0].messages).toHaveLength(1);
    expect(conversations[0].conversationKey).toBe('contact-2');
    expect(conversations[0].jobTitle).toBeUndefined();
    expect(conversations[1].contact.id).toBe('contact-1');
    expect(conversations[1].messages).toHaveLength(2);
    expect(conversations[1].conversationKey).toBe('contact-1');
  });

  it('sorts messages within a conversation by date ascending', () => {
    const messages: Message[] = [
      makeMessage({ id: 'm2', sender_id: currentUserId, recipient_id: 'contact-1', created_at: '2026-01-30T12:00:00Z',
        recipient: { id: 'contact-1', first_name: 'A', last_name: 'B', profile_type: null } }),
      makeMessage({ id: 'm1', sender_id: 'contact-1', recipient_id: currentUserId, created_at: '2026-01-30T10:00:00Z',
        sender: { id: 'contact-1', first_name: 'A', last_name: 'B', profile_type: null } }),
    ];

    const conversations = groupMessagesIntoConversations(messages, currentUserId);
    expect(conversations[0].messages[0].id).toBe('m1');
    expect(conversations[0].messages[1].id).toBe('m2');
  });

  it('sets lastMessage to the most recent message', () => {
    const messages: Message[] = [
      makeMessage({ id: 'm1', sender_id: 'contact-1', recipient_id: currentUserId, created_at: '2026-01-30T10:00:00Z',
        sender: { id: 'contact-1', first_name: 'A', last_name: 'B', profile_type: null } }),
      makeMessage({ id: 'm2', sender_id: currentUserId, recipient_id: 'contact-1', created_at: '2026-01-30T14:00:00Z',
        recipient: { id: 'contact-1', first_name: 'A', last_name: 'B', profile_type: null } }),
    ];

    const conversations = groupMessagesIntoConversations(messages, currentUserId);
    expect(conversations[0].lastMessage.id).toBe('m2');
  });

  it('counts unread messages correctly', () => {
    const messages: Message[] = [
      makeMessage({ id: 'm1', sender_id: 'contact-1', recipient_id: currentUserId, read: false, created_at: '2026-01-30T10:00:00Z',
        sender: { id: 'contact-1', first_name: 'A', last_name: 'B', profile_type: null } }),
      makeMessage({ id: 'm2', sender_id: 'contact-1', recipient_id: currentUserId, read: true, created_at: '2026-01-30T11:00:00Z',
        sender: { id: 'contact-1', first_name: 'A', last_name: 'B', profile_type: null } }),
      makeMessage({ id: 'm3', sender_id: 'contact-1', recipient_id: currentUserId, read: false, created_at: '2026-01-30T12:00:00Z',
        sender: { id: 'contact-1', first_name: 'A', last_name: 'B', profile_type: null } }),
      makeMessage({ id: 'm4', sender_id: currentUserId, recipient_id: 'contact-1', read: false, created_at: '2026-01-30T13:00:00Z',
        recipient: { id: 'contact-1', first_name: 'A', last_name: 'B', profile_type: null } }),
    ];

    const conversations = groupMessagesIntoConversations(messages, currentUserId);
    expect(conversations[0].unreadCount).toBe(2);
  });

  it('sorts conversations by most recent message first', () => {
    const messages: Message[] = [
      makeMessage({ id: 'm1', sender_id: 'old-contact', recipient_id: currentUserId, created_at: '2026-01-28T10:00:00Z',
        sender: { id: 'old-contact', first_name: 'Old', last_name: '', profile_type: null } }),
      makeMessage({ id: 'm2', sender_id: 'new-contact', recipient_id: currentUserId, created_at: '2026-01-30T10:00:00Z',
        sender: { id: 'new-contact', first_name: 'New', last_name: '', profile_type: null } }),
    ];

    const conversations = groupMessagesIntoConversations(messages, currentUserId);
    expect(conversations[0].contact.id).toBe('new-contact');
    expect(conversations[1].contact.id).toBe('old-contact');
  });
});

// ---------------------------------------------------------------------------
// groupMessagesIntoConversations — grouping asymetrique par profil
// ---------------------------------------------------------------------------

describe('groupMessagesIntoConversations — asymmetric grouping', () => {
  const currentUserId = 'rescuer-1';
  const estProfile = { id: 'est-1', first_name: 'Piscine Geneve', last_name: '', profile_type: 'etablissement' };

  const candidatureMessages: Message[] = [
    makeMessage({
      id: 'm1',
      sender_id: currentUserId,
      recipient_id: 'est-1',
      subject: 'Candidature: Chef Nageur',
      content: 'Je postule au poste de Chef Nageur',
      created_at: '2026-01-30T10:00:00Z',
      sender: { id: currentUserId, first_name: 'Jean', last_name: 'Dupont', profile_type: 'maitre_nageur' },
      recipient: estProfile,
    }),
    makeMessage({
      id: 'm2',
      sender_id: 'est-1',
      recipient_id: currentUserId,
      subject: 'Re: Candidature: Chef Nageur',
      content: 'Merci pour votre candidature',
      created_at: '2026-01-30T11:00:00Z',
      sender: estProfile,
      recipient: { id: currentUserId, first_name: 'Jean', last_name: 'Dupont', profile_type: 'maitre_nageur' },
    }),
    makeMessage({
      id: 'm3',
      sender_id: currentUserId,
      recipient_id: 'est-1',
      subject: 'Candidature: Maitre Nageur',
      content: 'Je postule au poste de Maitre Nageur',
      created_at: '2026-01-30T12:00:00Z',
      sender: { id: currentUserId, first_name: 'Jean', last_name: 'Dupont', profile_type: 'maitre_nageur' },
      recipient: estProfile,
    }),
  ];

  it('rescuer sees 2 separate conversations for 2 candidatures to same establishment', () => {
    const conversations = groupMessagesIntoConversations(candidatureMessages, currentUserId, 'maitre_nageur');

    expect(conversations).toHaveLength(2);

    // Plus recent d'abord : Maitre Nageur (m3 a 12:00)
    expect(conversations[0].jobTitle).toBe('Maitre Nageur');
    expect(conversations[0].messages).toHaveLength(1);
    expect(conversations[0].conversationKey).toBe('est-1__candidature__Candidature: Maitre Nageur');

    // Chef Nageur (m2 a 11:00 est le dernier)
    expect(conversations[1].jobTitle).toBe('Chef Nageur');
    expect(conversations[1].messages).toHaveLength(2);
    expect(conversations[1].conversationKey).toBe('est-1__candidature__Candidature: Chef Nageur');
  });

  it('establishment sees 1 unified conversation for same rescuer', () => {
    const conversations = groupMessagesIntoConversations(candidatureMessages, 'est-1', 'etablissement');

    expect(conversations).toHaveLength(1);
    expect(conversations[0].contact.id).toBe(currentUserId);
    expect(conversations[0].messages).toHaveLength(3);
    expect(conversations[0].jobTitle).toBeUndefined();
    expect(conversations[0].conversationKey).toBe(currentUserId);
  });

  it('without profileType (backward compat), groups by contact only', () => {
    const conversations = groupMessagesIntoConversations(candidatureMessages, currentUserId);

    expect(conversations).toHaveLength(1);
    expect(conversations[0].contact.id).toBe('est-1');
    expect(conversations[0].messages).toHaveLength(3);
    expect(conversations[0].jobTitle).toBeUndefined();
    expect(conversations[0].conversationKey).toBe('est-1');
  });

  it('rescuer with mixed candidature and non-candidature messages sees separate conversations', () => {
    const mixedMessages: Message[] = [
      ...candidatureMessages,
      makeMessage({
        id: 'm4',
        sender_id: 'est-1',
        recipient_id: currentUserId,
        subject: 'Question sur votre profil',
        content: 'Bonjour, une question...',
        created_at: '2026-01-30T13:00:00Z',
        sender: estProfile,
        recipient: { id: currentUserId, first_name: 'Jean', last_name: 'Dupont', profile_type: 'maitre_nageur' },
      }),
    ];

    const conversations = groupMessagesIntoConversations(mixedMessages, currentUserId, 'maitre_nageur');

    // 3 conversations : 2 candidatures + 1 generale
    expect(conversations).toHaveLength(3);

    // La plus recente : message general (m4 a 13:00)
    const general = conversations.find(c => !c.jobTitle);
    expect(general).toBeDefined();
    expect(general!.conversationKey).toBe('est-1');
    expect(general!.messages).toHaveLength(1);

    // Les 2 candidatures
    const candidatures = conversations.filter(c => c.jobTitle);
    expect(candidatures).toHaveLength(2);
    expect(candidatures.map(c => c.jobTitle).sort()).toEqual(['Chef Nageur', 'Maitre Nageur']);
  });

  it('reply "Re: Candidature: X" goes to same conversation as "Candidature: X"', () => {
    const conversations = groupMessagesIntoConversations(candidatureMessages, currentUserId, 'maitre_nageur');
    const chefNageur = conversations.find(c => c.jobTitle === 'Chef Nageur');
    expect(chefNageur).toBeDefined();
    // m1 (Candidature: Chef Nageur) + m2 (Re: Candidature: Chef Nageur) are together
    expect(chefNageur!.messages).toHaveLength(2);
    expect(chefNageur!.messages[0].id).toBe('m1');
    expect(chefNageur!.messages[1].id).toBe('m2');
  });
});
