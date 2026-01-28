// Supabase Edge Function - Lecture du cache SSS
// Simplifié : lit les formations depuis la table sss_formations_cache
// Données mises à jour quotidiennement via GitHub Actions + Python + Playwright

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

/**
 * Décode les séquences Unicode échappées dans une chaîne.
 * Gère: \u00E9, \\u00E9, /u00E9 -> é
 * Gère aussi: &#xE9; et &#233;
 * Limite la longueur des inputs pour éviter DoS
 */
function decodeUnicodeEscapes(text: string | null): string | null {
  if (!text) return text;

  // Protection contre les inputs trop longs (1MB max)
  if (text.length > 1_000_000) return text;

  try {
    let result = text;

    // Pattern pour \uXXXX, \\uXXXX, /uXXXX (limité à 1-4 slashes/backslashes)
    result = result.replace(/[/\\]{1,4}u([0-9a-fA-F]{4})/g, (match, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return match;
      }
    });

    // Gérer les entités HTML hex (&#xE9;) - limité à 6 hex digits
    result = result.replace(/&#x([0-9a-fA-F]{1,6});/g, (match, hex) => {
      try {
        const codePoint = parseInt(hex, 16);
        if (codePoint > 0x10FFFF) return match; // Invalid Unicode
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    });

    // Gérer les entités HTML décimales (&#233;) - limité à 7 digits
    result = result.replace(/&#(\d{1,7});/g, (match, dec) => {
      try {
        const codePoint = parseInt(dec, 10);
        if (codePoint > 0x10FFFF) return match; // Invalid Unicode
        return String.fromCodePoint(codePoint);
      } catch {
        return match;
      }
    });

    // Normaliser les caractères Unicode (NFD -> NFC)
    result = result.normalize('NFC');

    return result;
  } catch {
    return text;
  }
}

/**
 * Vérifie si une URL de formation SSS est valide et sécurisée
 * - Doit être HTTPS
 * - Doit être sur le domaine sss.ch
 * - Doit contenir un key numérique
 */
function isValidFormationUrl(url: string | null): boolean {
  if (!url) return false;

  try {
    // Vérifier que c'est une URL SSS valide
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (!parsed.hostname.endsWith('sss.ch') && !parsed.hostname.endsWith('formation.sss.ch')) return false;

    // Vérifier la présence du hash avec key
    return parsed.hash.includes('detail') && /key=\d+/.test(url);
  } catch {
    return false;
  }
}

interface SSSFormation {
  id: string;
  titre: string;
  date: string;
  lieu: string;
  organisateur: string;
  places: string;
  placesColor: 'red' | 'orange' | 'green' | 'gray';  // Indicateur de disponibilite
  prix: string;
  url: string;
  description?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { filters } = await req.json().catch(() => ({}));

    console.log('📥 Lecture du cache SSS depuis Supabase...');

    // Initialiser client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Lire depuis la table cache (seulement les formations actives)
    let query = supabase
      .from('sss_formations_cache')
      .select('*')
      .eq('active', true)
      .order('debut', { ascending: true });

    // Appliquer filtres si demandés
    if (filters?.region) {
      query = query.ilike('lieu', `%${filters.region}%`);
    }

    if (filters?.type) {
      query = query.ilike('titre', `%${filters.type}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erreur lecture cache:', error);
      throw error;
    }

    // Transformer vers le format attendu par l'app
    // Décoder les séquences Unicode qui pourraient être présentes dans les données
    let validUrlCount = 0;
    let fallbackUrlCount = 0;

    const formations: SSSFormation[] = (data || []).map((row: any) => {
      // Appliquer la validation sur l'URL - utiliser fallback si invalide
      const rawUrl = row.url || 'https://formation.sss.ch/Calendrier-des-Cours';
      const url = isValidFormationUrl(rawUrl) ? rawUrl : 'https://formation.sss.ch/Calendrier-des-Cours';

      // Compter les URLs valides vs fallback
      if (isValidFormationUrl(row.url)) {
        validUrlCount++;
      } else {
        fallbackUrlCount++;
      }

      return {
        id: `sss-${row.id}`,
        titre: decodeUnicodeEscapes(row.titre) || row.titre,
        date: row.debut,
        lieu: decodeUnicodeEscapes(row.lieu) || 'Suisse romande',
        organisateur: decodeUnicodeEscapes(row.organisateur) || 'SSS',
        places: row.places_status || row.places,
        prix: 'Consulter sur le site SSS',
        url: url,
        description: `${decodeUnicodeEscapes(row.titre) || row.titre} - ${decodeUnicodeEscapes(row.lieu) || 'Suisse romande'}`,
        placesColor: row.places_color || 'green'
      };
    });

    console.log(`✅ ${formations.length} formations retournées depuis le cache`);
    console.log(`📊 URLs: ${validUrlCount} valides, ${fallbackUrlCount} fallback`);

    return new Response(
      JSON.stringify({
        success: true,
        formations,
        count: formations.length,
        source: 'cache',
        scrapedAt: new Date().toISOString(),
        message: "Données lues depuis le cache Supabase (mise à jour quotidienne via GitHub Actions)",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error: any) {
    console.error("❌ Erreur:", error);

    return new Response(
      JSON.stringify({
        success: false,
        formations: [],
        count: 0,
        source: "error",
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
