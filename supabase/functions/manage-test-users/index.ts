import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "manager" | "resident";
  agencyType?: "bailleur" | "syndic";
  agencyName?: string;
}

const testUsers: TestUser[] = [
  {
    email: "bailleur@test.com",
    password: "Test1234!",
    firstName: "Jean",
    lastName: "Bailleur",
    role: "manager",
    agencyType: "bailleur",
    agencyName: "Bailleur Test",
  },
  {
    email: "syndic@test.com",
    password: "Test1234!",
    firstName: "Marie",
    lastName: "Syndic",
    role: "manager",
    agencyType: "syndic",
    agencyName: "Syndic Test",
  },
  {
    email: "resident@test.com",
    password: "Test1234!",
    firstName: "Pierre",
    lastName: "Résident",
    role: "resident",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const adminEmail = "cousinmathis31@gmail.com";

    // 1. Get all users except admin
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .neq("email", adminEmail);

    // 2. Delete non-admin users
    for (const profile of profiles || []) {
      // Delete from auth.users (cascades to profiles, user_roles, etc.)
      await supabaseAdmin.auth.admin.deleteUser(profile.id);
      console.log(`Deleted user: ${profile.email}`);
    }

    // 3. Create test users
    const createdUsers = [];
    
    for (const testUser of testUsers) {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          first_name: testUser.firstName,
          last_name: testUser.lastName,
        },
      });

      if (authError) {
        console.error(`Error creating user ${testUser.email}:`, authError);
        continue;
      }

      const userId = authData.user.id;

      // Update profile
      await supabaseAdmin
        .from("profiles")
        .update({
          first_name: testUser.firstName,
          last_name: testUser.lastName,
        })
        .eq("id", userId);

      // Create agency if needed
      let agencyId = null;
      if (testUser.agencyType && testUser.agencyName) {
        const { data: agencyData } = await supabaseAdmin
          .from("agencies")
          .insert({
            name: testUser.agencyName,
            type: testUser.agencyType,
            status: "active",
          })
          .select()
          .single();

        agencyId = agencyData?.id;
      }

      // Assign role
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: testUser.role,
        agency_id: agencyId,
      });

      createdUsers.push({
        email: testUser.email,
        password: testUser.password,
        role: testUser.role,
        agencyType: testUser.agencyType,
      });

      console.log(`Created user: ${testUser.email}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test users created successfully",
        users: createdUsers,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
