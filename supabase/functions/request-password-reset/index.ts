// Supabase Edge Function for password reset
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

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

    // Look for user
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
      // Don't reveal that user doesn't exist
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

    // Delete existing tokens for this user
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id);

    // Create new token
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

    // Build reset link with the app URL
    const resetLink = `https://kopro-app.lovable.app/reset-password?token=${token}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600;">KOPRO</h1>
    </div>
    <div style="padding: 32px 24px;">
      <h2 style="margin: 0 0 16px; color: #333;">Réinitialisation de votre mot de passe</h2>
      <p style="color: #555; line-height: 1.6;">Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p style="color: #555; line-height: 1.6;">Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
          Réinitialiser mon mot de passe
        </a>
      </div>
      <p style="color: #888; font-size: 14px;">Ce lien expire dans 1 heure.</p>
      <p style="color: #888; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
    </div>
    <div style="background: #f8f9fa; padding: 20px 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
      <p style="margin: 4px 0;">KOPRO - Gestion de copropriété simplifiée</p>
    </div>
  </div>
</body>
</html>`;

    // Send email with Resend
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      // Use Resend test domain for now - replace with verified domain later
      const { error: emailError } = await resend.emails.send({
        from: "KOPRO <onboarding@resend.dev>",
        to: [email],
        subject: "Réinitialisation de votre mot de passe KOPRO",
        html: emailHtml,
      });

      if (emailError) {
        console.error("Error sending email with Resend:", emailError);
        throw new Error("Failed to send email");
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping email");
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
