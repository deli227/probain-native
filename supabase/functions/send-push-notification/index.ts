import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// URL de l'icone ProBain pour les notifications
const PROBAIN_ICON = 'https://www.probain.ch/lovable-uploads/20286da1-b072-432d-b68e-3b0e839dd1b9.png';

// Configuration des notifications par type d'evenement
const NOTIFICATION_CONFIG: Record<string, {
  preferenceKey: string;
  title: string;
  bodyTemplate: string;
  urlByProfile: Record<string, string>;
}> = {
  new_message: {
    preferenceKey: 'notify_messages',
    title: 'Nouveau message',
    bodyTemplate: 'Vous avez recu un nouveau message',
    urlByProfile: {
      maitre_nageur: '/rescuer/mail',
      formateur: '/trainer-profile/mail',
      etablissement: '/establishment-profile/mail',
    },
  },
  new_flux_post: {
    preferenceKey: 'notify_formations',
    title: 'Nouvelle publication',
    bodyTemplate: 'Une nouvelle publication dans le flux',
    urlByProfile: {
      maitre_nageur: '/flux',
      formateur: '/flux',
      etablissement: '/flux',
    },
  },
  new_formation: {
    preferenceKey: 'notify_formations',
    title: 'Nouvelle formation',
    bodyTemplate: 'Une nouvelle formation SSS est disponible',
    urlByProfile: {
      maitre_nageur: '/training',
      formateur: '/training',
      etablissement: '/training',
    },
  },
  new_job_posting: {
    preferenceKey: 'notify_formations',
    title: "Nouvelle offre d'emploi",
    bodyTemplate: "Une nouvelle offre d'emploi est disponible",
    urlByProfile: {
      maitre_nageur: '/jobs',
      formateur: '/jobs',
      etablissement: '/jobs',
    },
  },
  new_job_application: {
    preferenceKey: 'notify_messages',
    title: 'Nouvelle candidature reçue',
    bodyTemplate: 'Un sauveteur a postule a votre offre',
    urlByProfile: {
      etablissement: '/establishment-profile/announcements',
    },
  },
  new_student: {
    preferenceKey: 'notify_messages',
    title: 'Nouvel eleve',
    bodyTemplate: 'Un nouvel eleve est maintenant lie a votre profil',
    urlByProfile: {
      formateur: '/trainer-profile/students',
    },
  },
  new_course_registration: {
    preferenceKey: 'notify_formations',
    title: "Inscription a un cours",
    bodyTemplate: "Un eleve s'est inscrit a votre cours",
    urlByProfile: {
      formateur: '/trainer-profile',
    },
  },
};

interface PushPayload {
  event_type: string;
  recipient_id: string;
  data: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal credentials not configured')
    }

    const payload: PushPayload = await req.json()
    const { event_type, recipient_id, data } = payload

    console.log(`[Push] Event: ${event_type}, recipient: ${recipient_id}, broadcast: ${data.broadcast}`)

    const config = NOTIFICATION_CONFIG[event_type]
    if (!config) {
      return new Response(
        JSON.stringify({ message: `Unknown event type: ${event_type}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Creer un client Supabase (service_role pour bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Pour les broadcasts (flux, formations, job postings), envoyer a tous les profils cibles
    const isBroadcast = data.broadcast === true

    if (isBroadcast) {
      const broadcastProfileType = getBroadcastTargetProfile(event_type)

      // Recuperer les user IDs depuis la table profiles
      let query = supabase.from('profiles').select('id').eq('is_active', true)

      if (broadcastProfileType) {
        query = query.eq('profile_type', broadcastProfileType)
      }

      const { data: profiles, error: profileError } = await query

      if (profileError) {
        console.error('[Push] Error fetching broadcast profiles:', profileError)
        throw new Error(`Failed to fetch profiles: ${profileError.message}`)
      }

      const userIds = profiles?.map((p: { id: string }) => p.id).filter(Boolean) || []

      console.log(`[Push] Broadcast to ${userIds.length} users (filter: ${broadcastProfileType || 'all'})`)

      if (userIds.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No users for broadcast', event_type }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      const body = buildNotificationBody(config, data)

      const onesignalPayload = {
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: userIds },
        target_channel: 'push',
        contents: { fr: body, en: body },
        headings: { fr: config.title, en: config.title },
        small_icon: PROBAIN_ICON,
        large_icon: PROBAIN_ICON,
        url: `https://www.probain.ch${Object.values(config.urlByProfile)[0] || '/'}`,
      }

      const result = await callOneSignalAPI(onesignalPayload, ONESIGNAL_REST_API_KEY)

      return new Response(
        JSON.stringify({ success: true, broadcast: true, userCount: userIds.length, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // === Notification individuelle ===

    // Verifier les preferences de notification du destinataire
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', recipient_id)
      .single()

    // Si les preferences existent et que la notification est desactivee, ne pas envoyer
    if (prefs && prefs[config.preferenceKey] === false) {
      return new Response(
        JSON.stringify({ message: 'Notification disabled by user preference', event_type }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Recuperer le profile_type du destinataire pour le routing URL
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_type')
      .eq('id', recipient_id)
      .single()

    const profileType = profile?.profile_type || 'maitre_nageur'
    const targetUrl = config.urlByProfile[profileType] || '/'

    const body = buildNotificationBody(config, data)

    // Cibler via include_aliases (format OneSignal actuel)
    // L'external_id est defini sur le device par Despia via setonesignalplayerid://
    const onesignalPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [recipient_id] },
      target_channel: 'push',
      contents: { fr: body, en: body },
      headings: { fr: config.title, en: config.title },
      small_icon: PROBAIN_ICON,
      large_icon: PROBAIN_ICON,
      url: `https://www.probain.ch${targetUrl}`,
    }

    console.log(`[Push] Individual notification to user ${recipient_id} via include_aliases`)

    const result = await callOneSignalAPI(onesignalPayload, ONESIGNAL_REST_API_KEY)

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error sending push notification:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

/**
 * Construire le corps de la notification a partir du template et des donnees
 */
function buildNotificationBody(
  config: typeof NOTIFICATION_CONFIG[string],
  data: Record<string, unknown>
): string {
  let body = config.bodyTemplate

  // Enrichir avec les donnees contextuelles si disponibles
  if (data.job_title) {
    if (config.title === 'Nouvelle candidature reçue') {
      body = `Un sauveteur a postule a votre offre "${data.job_title}"`
    } else {
      body = `${data.job_title}`
    }
  }
  if (data.title && config.title === 'Nouvelle formation') {
    body = `${data.title}`
  }
  if (data.course_title) {
    body = `Inscription a votre cours "${data.course_title}"`
  }

  return body
}

/**
 * Determiner le profile_type cible pour les broadcasts
 */
function getBroadcastTargetProfile(eventType: string): string | null {
  switch (eventType) {
    case 'new_formation':
    case 'new_job_posting':
      // Cibler les sauveteurs uniquement
      return 'maitre_nageur'
    case 'new_flux_post':
      // Cibler tous les profils (pas de filtre)
      return null
    default:
      return null
  }
}

/**
 * Appeler l'API OneSignal REST v1
 * Utilise include_aliases + target_channel (format actuel, remplace include_external_user_ids)
 * L'external_id est defini sur le device par Despia via setonesignalplayerid://
 */
async function callOneSignalAPI(
  payload: Record<string, unknown>,
  apiKey: string
): Promise<unknown> {
  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseBody = await response.json()

  if (!response.ok) {
    console.error(`[Push] OneSignal API error (${response.status}):`, JSON.stringify(responseBody))
    throw new Error(`OneSignal API error (${response.status}): ${JSON.stringify(responseBody)}`)
  }

  console.log('[Push] OneSignal API response:', JSON.stringify(responseBody))
  return responseBody
}
