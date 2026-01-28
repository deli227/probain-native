import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email de l'admin qui recevra les notifications
const ADMIN_EMAIL = "contact@probain.ch"

interface ClaimRequestPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    email: string
    type: string  // Type de claim: formateur, etablissement, etc.
    selected_trainer_name: string | null
    status: string
    admin_notes: string | null
    created_at: string | null
  }
  schema: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const payload: ClaimRequestPayload = await req.json()

    // Vérifier que c'est bien un INSERT sur account_claim_requests
    if (payload.type !== 'INSERT' || payload.table !== 'account_claim_requests') {
      return new Response(
        JSON.stringify({ message: 'Ignored: not a claim request insert' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const { record } = payload
    const claimTypeLabel = {
      'trainer': 'Revendication Formateur',
      'establishment': 'Revendication Établissement',
    }[record.type] || record.type

    // Envoyer l'email via Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pro Bain Connect <noreply@probain.ch>',
        to: [ADMIN_EMAIL],
        subject: `🔔 Nouvelle demande - ${claimTypeLabel}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">🏊 Pro Bain Connect</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1e293b; margin-top: 0;">Nouvelle demande de revendication</h2>

              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                <p style="margin: 5px 0;"><strong>Email:</strong> ${record.email}</p>
                <p style="margin: 5px 0;"><strong>Type:</strong> ${claimTypeLabel}</p>
                ${record.selected_trainer_name ? `<p style="margin: 5px 0;"><strong>Formateur sélectionné:</strong> ${record.selected_trainer_name}</p>` : ''}
                <p style="margin: 5px 0; color: #64748b;"><strong>Date:</strong> ${record.created_at ? new Date(record.created_at).toLocaleString('fr-CH') : 'N/A'}</p>
              </div>

              <div style="margin-top: 20px; text-align: center;">
                <a href="https://dashboard-admin-pro-bain.vercel.app/claims"
                   style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Voir dans le Dashboard
                </a>
              </div>

              <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; text-align: center;">
                Cet email a été envoyé automatiquement par Pro Bain Connect.
              </p>
            </div>
          </div>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      throw new Error(`Resend API error: ${errorText}`)
    }

    const result = await emailResponse.json()

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Error sending notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
