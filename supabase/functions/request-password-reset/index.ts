import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error("Error fetching users:", userError);
      return new Response(
        JSON.stringify({ success: true, message: "Si cet email existe, un lien de réinitialisation a été envoyé" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      return new Response(
        JSON.stringify({ success: true, message: "Si cet email existe, un lien de réinitialisation a été envoyé" }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id);

    const token = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: token,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error("Error inserting token:", insertError);
      throw new Error("Failed to create reset token");
    }

    const resetLink = `${new URL(req.url).origin}/reset-password?token=${token}`;

    const { data: noreplyConfig } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "noreply_email")
      .maybeSingle();

    const noreplyEmail = noreplyConfig?.value || "noreply@kopro.app";

    const emailBody = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Réinitialisation de votre mot de passe</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <p style="margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
        <p style="color: #666; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
      </div>
    `;

    const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;
    const emailResponse = await fetch(sendEmailUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: "Réinitialisation de votre mot de passe KOPRO",
        body: emailBody,
        fromName: "KOPRO",
        fromEmail: noreplyEmail,
        variables: {},
      }),
    });

    if (!emailResponse.ok) {
      console.error("Error sending email:", await emailResponse.text());
      throw new Error("Failed to send email");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Un email de réinitialisation a été envoyé"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in request-password-reset:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Une erreur est survenue"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
