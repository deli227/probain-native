import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../authErrors';
import { AuthError } from '@supabase/supabase-js';

// Helper to create a fake AuthError with a specific message
function makeAuthError(message: string): AuthError {
  return { message, name: 'AuthApiError', status: 400 } as AuthError;
}

describe('authErrors', () => {
  describe('getErrorMessage', () => {
    it('translates "Invalid login credentials"', () => {
      expect(getErrorMessage(makeAuthError('Invalid login credentials')))
        .toBe('Email ou mot de passe incorrect. Veuillez vérifier vos informations.');
    });

    it('translates "User not found"', () => {
      expect(getErrorMessage(makeAuthError('User not found')))
        .toBe('Aucun utilisateur trouvé avec ces informations.');
    });

    it('translates "Email not confirmed"', () => {
      expect(getErrorMessage(makeAuthError('Email not confirmed')))
        .toBe('Veuillez vérifier votre adresse email avant de vous connecter.');
    });

    it('translates "Invalid grant"', () => {
      expect(getErrorMessage(makeAuthError('Invalid grant')))
        .toBe('Identifiants de connexion invalides.');
    });

    it('returns generic message for unknown errors', () => {
      expect(getErrorMessage(makeAuthError('Something unexpected')))
        .toBe('Une erreur est survenue. Veuillez réessayer.');
    });

    it('returns generic message for empty error message', () => {
      expect(getErrorMessage(makeAuthError('')))
        .toBe('Une erreur est survenue. Veuillez réessayer.');
    });
  });
});
