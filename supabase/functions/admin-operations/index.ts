import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

interface AdminOperationRequest {
  operation: string;
  data: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create user client to verify token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the user's token
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid or expired token')
    }

    // Verify user is an active admin
    const { data: adminData, error: adminError } = await userClient
      .from('admins')
      .select('id, email, role, is_active')
      .eq('email', user.email)
      .eq('is_active', true)
      .single()

    if (adminError || !adminData) {
      throw new Error('Unauthorized: Not an active admin')
    }

    // Parse request body
    const { operation, data }: AdminOperationRequest = await req.json()

    if (!operation) {
      throw new Error('Missing operation parameter')
    }

    // Create admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Route to the appropriate handler
    let result: unknown

    switch (operation) {
      // ============ CLAIMS OPERATIONS ============
      case 'claims.list':
        result = await handleClaimsList(adminClient, data)
        break

      case 'claims.approve':
        result = await handleClaimsApprove(adminClient, data, adminData.email)
        break

      case 'claims.reject':
        result = await handleClaimsReject(adminClient, data, adminData.email)
        break

      // ============ USER OPERATIONS ============
      case 'users.list':
        result = await handleUsersList(adminClient, data)
        break

      case 'users.create':
        result = await handleUsersCreate(adminClient, data)
        break

      case 'users.delete':
        result = await handleUsersDelete(adminClient, data)
        break

      // ============ FLUX OPERATIONS ============
      case 'flux.list':
        result = await handleFluxList(adminClient)
        break

      case 'flux.create':
        result = await handleFluxCreate(adminClient, data)
        break

      case 'flux.update':
        result = await handleFluxUpdate(adminClient, data)
        break

      case 'flux.delete':
        result = await handleFluxDelete(adminClient, data)
        break

      case 'flux.publish':
        result = await handleFluxPublish(adminClient, data)
        break

      // ============ STORAGE OPERATIONS ============
      case 'storage.upload':
        result = await handleStorageUpload(adminClient, data)
        break

      case 'storage.getPublicUrl':
        result = await handleStorageGetPublicUrl(adminClient, data)
        break

      // ============ AUDIT OPERATIONS ============
      case 'audit.clearOld':
        result = await handleAuditClearOld(adminClient, data)
        break

      case 'audit.log':
        result = await handleAuditLog(adminClient, data, adminData.email)
        break

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Admin operation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

// ============ CLAIMS HANDLERS ============

async function handleClaimsList(client: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  const { status } = data

  let query = client
    .from('account_claim_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: claims, error } = await query
  if (error) throw new Error(error.message)
  return claims
}

async function handleClaimsApprove(client: ReturnType<typeof createClient>, data: Record<string, unknown>, adminEmail: string) {
  const { claimId, email, profileType, organizationName, adminNotes, appUrl } = data as {
    claimId: string
    email: string
    profileType: 'formateur' | 'etablissement'
    organizationName: string
    adminNotes?: string
    appUrl: string
  }

  let createdUserId: string | null = null

  try {
    // 1. Invite the user
    const { data: inviteData, error: inviteError } = await client.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/set-password`,
      data: {
        profile_type: profileType,
        organization_name: organizationName
      }
    })

    if (inviteError) {
      if (inviteError.message.includes('already been registered') || inviteError.message.includes('already exists')) {
        throw new Error('Cet email est deja enregistre dans le systeme.')
      }
      throw new Error(inviteError.message)
    }
    if (!inviteData.user) throw new Error('Erreur lors de la creation du compte')

    createdUserId = inviteData.user.id

    // 2. Wait for trigger handle_new_user (creates profiles entry)
    await new Promise(resolve => setTimeout(resolve, 500))

    // 3. Create specific profile FIRST (before updating profiles)
    // This prevents the handle_profile_type_selection trigger from failing
    // because it tries to INSERT without organization_name
    if (profileType === 'formateur') {
      const { error: trainerError } = await client.from('trainer_profiles').insert({
        id: createdUserId,
        organization_name: organizationName
      })
      if (trainerError && !trainerError.message.includes('duplicate key')) {
        throw new Error(`Profil formateur: ${trainerError.message}`)
      }
    } else {
      const { error: estabError } = await client.from('establishment_profiles').insert({
        id: createdUserId,
        organization_name: organizationName
      })
      if (estabError && !estabError.message.includes('duplicate key')) {
        throw new Error(`Profil etablissement: ${estabError.message}`)
      }
    }

    // 4. Update profile (trigger will do ON CONFLICT DO UPDATE now)
    const { error: profileError } = await client.from('profiles').update({
      email: email,
      profile_type: profileType,
      profile_type_selected: true,
      onboarding_completed: false,
      is_active: true
    }).eq('id', createdUserId)

    if (profileError) throw new Error(`Profil: ${profileError.message}`)

    // 5. Update claim status to approved
    const { error: updateError } = await client
      .from('account_claim_requests')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes || null
      })
      .eq('id', claimId)

    if (updateError) throw new Error(`Mise a jour claim: ${updateError.message}`)

    // 6. Audit log
    await client.from('admin_audit_logs').insert({
      action: 'user_created',
      admin_email: adminEmail,
      target_user_id: createdUserId,
      target_user_email: email,
      details: {
        source: 'claim_approval',
        claim_id: claimId,
        profile_type: profileType,
        organization_name: organizationName
      }
    })

    return { userId: createdUserId, email }

  } catch (error) {
    // Rollback if user was created
    if (createdUserId) {
      console.warn('Attempting rollback for user:', createdUserId)
      try {
        await client.auth.admin.deleteUser(createdUserId)
        console.log('Rollback successful')
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr)
      }
    }
    throw error
  }
}

async function handleClaimsReject(client: ReturnType<typeof createClient>, data: Record<string, unknown>, adminEmail: string) {
  const { claimId, claimEmail, adminNotes } = data as {
    claimId: string
    claimEmail: string
    adminNotes?: string
  }

  const { error: updateError } = await client
    .from('account_claim_requests')
    .update({
      status: 'rejected',
      processed_at: new Date().toISOString(),
      admin_notes: adminNotes || null
    })
    .eq('id', claimId)

  if (updateError) throw new Error(updateError.message)

  // Audit log
  await client.from('admin_audit_logs').insert({
    action: 'user_updated',
    admin_email: adminEmail,
    target_user_email: claimEmail,
    details: {
      source: 'claim_rejection',
      claim_id: claimId,
      reason: adminNotes || 'Non specifie'
    }
  })

  return { success: true }
}

// ============ USER HANDLERS ============

async function handleUsersList(client: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  const { profileType, searchTerm } = data as { profileType?: string; searchTerm?: string }

  let query = client
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profileType && profileType !== 'all') {
    query = query.eq('profile_type', profileType)
  }

  if (searchTerm) {
    query = query.or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
  }

  const { data: users, error } = await query
  if (error) throw new Error(error.message)
  return users
}

async function handleUsersCreate(client: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  const { email, password, profileType, firstName, lastName } = data as {
    email: string
    password: string
    profileType: string
    firstName?: string
    lastName?: string
  }

  const { data: authData, error: authError } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      profile_type: profileType,
      first_name: firstName,
      last_name: lastName
    }
  })

  if (authError) throw new Error(authError.message)
  return { user: authData.user }
}

async function handleUsersDelete(client: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  const { userId } = data as { userId: string }

  // Delete auth user
  const { error: authError } = await client.auth.admin.deleteUser(userId)
  if (authError) throw new Error(authError.message)

  // Delete specific profiles in parallel
  await Promise.all([
    client.from('rescuer_profiles').delete().eq('id', userId),
    client.from('trainer_profiles').delete().eq('id', userId),
    client.from('establishment_profiles').delete().eq('id', userId),
  ])

  // Delete main profile
  const { error: profileError } = await client
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileError) {
    console.error('Error deleting profile:', profileError)
  }

  return { success: true }
}

// ============ FLUX HANDLERS ============

async function handleFluxList(client: ReturnType<typeof createClient>) {
  const { data, error } = await client
    .from('flux_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

async function handleFluxCreate(client: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  const { title, content, imageUrl, authorName, authorAvatarUrl, visibility, isPublished, scheduledAt } = data as {
    title?: string
    content: string
    imageUrl?: string
    authorName: string
    authorAvatarUrl?: string
    visibility: string
    isPublished: boolean
    scheduledAt?: string
  }

  const { data: post, error } = await client.from('flux_posts').insert({
    title,
    content,
    image_url: imageUrl,
    author_name: authorName,
    author_avatar_url: authorAvatarUrl,
    visibility,
    is_published: isPublished,
    scheduled_at: scheduledAt
  }).select().single()

  if (error) throw new Error(error.message)
  return post
}

async function handleFluxUpdate(client: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  const { id, title, content, imageUrl, visibility, isPublished, scheduledAt } = data as {
    id: string
    title?: string
    content: string
    imageUrl?: string
    visibility: string
    isPublished: boolean
    scheduledAt?: string
  }

  const { data: post, error } = await client.from('flux_posts').update({
    title,
    content,
    image_url: imageUrl,
    visibility,
    is_published: isPublished,
    scheduled_at: scheduledAt
  }).eq('id', id).select().single()

  if (error) throw new Error(error.message)
  return post
}

async function handleFluxDelete(client: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  const { id } = data as { id: string }

  const { error } = await client
    .from('flux_posts')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return { success: true }
}

async function handleFluxPublish(client: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  const { id, isPublished } = data as { id: string; isPublished: boolean }

  const { data: post, error } = await client.from('flux_posts').update({
    is_published: isPublished
  }).eq('id', id).select().single()

  if (error) throw new Error(error.message)
  return post
}

// ============ STORAGE HANDLERS ============

async function handleStorageUpload(client: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  const { bucket, path, fileBase64, contentType } = data as {
    bucket: string
    path: string
    fileBase64: string
    contentType: string
  }

  // Decode base64 to Uint8Array
  const binaryString = atob(fileBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const { error } = await client.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType,
      upsert: true
    })

  if (error) throw new Error(error.message)
  return { path }
}

async function handleStorageGetPublicUrl(client: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  const { bucket, path } = data as { bucket: string; path: string }

  const { data: urlData } = client.storage
    .from(bucket)
    .getPublicUrl(path)

  return { publicUrl: urlData.publicUrl }
}

// ============ AUDIT HANDLERS ============

async function handleAuditClearOld(client: ReturnType<typeof createClient>, data: Record<string, unknown>) {
  const { olderThanDays } = data as { olderThanDays: number }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const { error } = await client
    .from('admin_audit_logs')
    .delete()
    .lt('created_at', cutoffDate.toISOString())

  if (error) throw new Error(error.message)
  return { success: true }
}

async function handleAuditLog(client: ReturnType<typeof createClient>, data: Record<string, unknown>, adminEmail: string) {
  const { action, targetUserId, targetUserEmail, details } = data as {
    action: string
    targetUserId?: string
    targetUserEmail?: string
    details?: Record<string, unknown>
  }

  const { error } = await client.from('admin_audit_logs').insert({
    action,
    admin_email: adminEmail,
    target_user_id: targetUserId,
    target_user_email: targetUserEmail,
    details
  })

  if (error) throw new Error(error.message)
  return { success: true }
}
