// @ts-ignore Deno types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// This is a one-time setup function - should be deleted after use
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Simple secret check to prevent unauthorized access
  const authHeader = req.headers.get('x-setup-key')
  if (authHeader !== 'kopro-setup-2024') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const testUsers = [
      { email: 'manager@kopro.fr', password: 'test1234', role: 'manager', firstName: 'Test', lastName: 'Manager' },
      { email: 'cs@kopro.fr', password: 'test1234', role: 'cs', firstName: 'Test', lastName: 'Syndic' },
      { email: 'resident@kopro.fr', password: 'test1234', role: 'resident', firstName: 'Test', lastName: 'Resident' },
    ]

    const results = []

    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === user.email)

      if (existingUser) {
        results.push({ email: user.email, status: 'already_exists', id: existingUser.id })
        continue
      }

      // Create user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          first_name: user.firstName,
          last_name: user.lastName,
        }
      })

      if (authError) {
        results.push({ email: user.email, status: 'error', error: authError.message })
        continue
      }

      // Assign role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: user.role,
        })

      if (roleError) {
        results.push({ email: user.email, status: 'created_no_role', id: authData.user.id, error: roleError.message })
      } else {
        results.push({ email: user.email, status: 'created', id: authData.user.id, role: user.role })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
