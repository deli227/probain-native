import { describe, it, expect } from 'vitest';

/**
 * Tests pour le décodage Unicode utilisé dans les formations SSS
 * Ces tests vérifient que les caractères spéciaux suisses sont correctement décodés
 */

// Fonction de décodage (copie de celle utilisée dans l'Edge Function)
function decodeUnicodeEscapes(text: string | null): string | null {
  if (!text) return text;
  if (text.length > 1_000_000) return text;

  try {
    let result = text;

    // Pattern pour \uXXXX, \\uXXXX, /uXXXX
    result = result.replace(/[/\\]{1,4}u([0-9a-fA-F]{4})/g, (match, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return match;
      }
    });

    // Gérer les entités HTML hex
    result = result.replace(/&#x([0-9a-fA-F]{1,6});/g, (match, hex) => {
      try {
        const codePoint = parseInt(hex, 16);
        if (codePoint > 0x10FFFF) return match;
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    });

    // Gérer les entités HTML décimales
    result = result.replace(/&#(\d{1,7});/g, (match, dec) => {
      try {
        const codePoint = parseInt(dec, 10);
        if (codePoint > 0x10FFFF) return match;
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    });

    result = result.normalize('NFC');
    return result;
  } catch {
    return text;
  }
}

// Fonction de validation d'URL
function isValidFormationUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (!parsed.hostname.endsWith('sss.ch')) return false;
    return parsed.hash.includes('detail') && /key=\d+/.test(url);
  } catch {
    return false;
  }
}

describe('decodeUnicodeEscapes', () => {
  describe('Format /uXXXX (SSS specific)', () => {
    it('should decode /u00fc to ü (Zürich)', () => {
      // /u00fc = ü (lowercase), not Ü (uppercase)
      expect(decodeUnicodeEscapes('Z/u00fcrich')).toBe('Zürich');
    });

    it('should decode /u00E9 to é (St-Légier)', () => {
      expect(decodeUnicodeEscapes('St-L/u00E9gier')).toBe('St-Légier');
    });

    it('should decode /u00f6 to ö (Högg)', () => {
      expect(decodeUnicodeEscapes('SLRG H/u00f6NGG')).toBe('SLRG HöNGG');
    });
  });

  describe('Format \\uXXXX (escaped)', () => {
    it('should decode \\u00E9 to é', () => {
      expect(decodeUnicodeEscapes('St-L\\u00E9gier')).toBe('St-Légier');
    });

    it('should decode double backslash', () => {
      expect(decodeUnicodeEscapes('Test\\\\u00E9')).toBe('Testé');
    });
  });

  describe('HTML entities', () => {
    it('should decode &#xE9; to é', () => {
      expect(decodeUnicodeEscapes('caf&#xE9;')).toBe('café');
    });

    it('should decode &#233; to é', () => {
      expect(decodeUnicodeEscapes('caf&#233;')).toBe('café');
    });

    it('should handle invalid code points gracefully', () => {
      expect(decodeUnicodeEscapes('test&#xFFFFFFFF;')).toBe('test&#xFFFFFFFF;');
    });
  });

  describe('Edge cases', () => {
    it('should return null for null input', () => {
      expect(decodeUnicodeEscapes(null)).toBeNull();
    });

    it('should return empty string for empty input', () => {
      expect(decodeUnicodeEscapes('')).toBe('');
    });

    it('should return unchanged text without escapes', () => {
      expect(decodeUnicodeEscapes('Normal text')).toBe('Normal text');
    });

    it('should handle multiple escapes in one string', () => {
      expect(decodeUnicodeEscapes('Z/u00fcrich - Gen/u00e8ve')).toBe('Zürich - Genève');
    });
  });

  describe('Swiss characters', () => {
    it('should decode common Swiss German characters', () => {
      // ü ö ä
      expect(decodeUnicodeEscapes('/u00fc/u00f6/u00e4')).toBe('üöä');
    });

    it('should decode French accented characters', () => {
      // é è à ê
      expect(decodeUnicodeEscapes('/u00e9/u00e8/u00e0/u00ea')).toBe('éèàê');
    });
  });
});

describe('isValidFormationUrl', () => {
  describe('Valid URLs', () => {
    it('should accept valid SSS formation URL', () => {
      expect(isValidFormationUrl('https://formation.sss.ch/Calendrier-des-Cours#detail&key=12345')).toBe(true);
    });

    it('should accept URL with different key format', () => {
      expect(isValidFormationUrl('https://formation.sss.ch/test#detail&key=99999')).toBe(true);
    });
  });

  describe('Invalid URLs', () => {
    it('should reject null', () => {
      expect(isValidFormationUrl(null)).toBe(false);
    });

    it('should reject HTTP (non-HTTPS)', () => {
      expect(isValidFormationUrl('http://formation.sss.ch/Calendrier#detail&key=123')).toBe(false);
    });

    it('should reject non-sss.ch domain', () => {
      expect(isValidFormationUrl('https://evil.com/#detail&key=123')).toBe(false);
    });

    it('should reject javascript: protocol (XSS)', () => {
      expect(isValidFormationUrl('javascript:alert(1)#detail&key=123')).toBe(false);
    });

    it('should reject data: URL (XSS)', () => {
      expect(isValidFormationUrl('data:text/html,<script>alert(1)</script>#detail&key=123')).toBe(false);
    });

    it('should reject URL without key', () => {
      expect(isValidFormationUrl('https://formation.sss.ch/Calendrier#detail')).toBe(false);
    });

    it('should reject URL with non-numeric key', () => {
      expect(isValidFormationUrl('https://formation.sss.ch/Calendrier#detail&key=abc')).toBe(false);
    });
  });
});
