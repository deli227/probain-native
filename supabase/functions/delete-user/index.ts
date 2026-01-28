import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client with the user's token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify the user's token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Invalid or expired token')
    }

    // Get the user ID to delete from request body (optional, defaults to current user)
    const { userId: targetUserId } = await req.json().catch(() => ({}))

    // Users can only delete themselves unless they're admin
    const userIdToDelete = targetUserId || user.id

    if (userIdToDelete !== user.id) {
      // Check if current user is admin (you can add admin check here if needed)
      throw new Error('You can only delete your own account')
    }

    // Create admin client to delete the user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // First, delete the profile (this will cascade delete related data)
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userIdToDelete)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      // Continue anyway, the auth user should still be deleted
    }

    // Delete the user from auth.users
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userIdToDelete)

    if (deleteError) {
      throw new Error(`Failed to delete user: ${deleteError.message}`)
    }

    console.log(`User ${userIdToDelete} deleted successfully`)

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Delete user error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
