import { describe, it, expect } from 'vitest';
import {
  getProfileTypeLabel,
  getContactFromMessage,
  groupMessagesIntoConversations,
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
// groupMessagesIntoConversations
// ---------------------------------------------------------------------------

describe('groupMessagesIntoConversations', () => {
  const currentUserId = 'me';

  it('returns empty array for no messages', () => {
    expect(groupMessagesIntoConversations([], currentUserId)).toEqual([]);
  });

  it('groups messages by contact', () => {
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
    // Conversation with contact-2 should come first (most recent)
    expect(conversations[0].contact.id).toBe('contact-2');
    expect(conversations[0].messages).toHaveLength(1);
    // Conversation with contact-1 has 2 messages
    expect(conversations[1].contact.id).toBe('contact-1');
    expect(conversations[1].messages).toHaveLength(2);
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
      // Sent by current user - should NOT count as unread
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
