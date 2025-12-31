import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const validateRequest = (data: unknown): {
  to: string;
  subject: string;
  body: string;
  fromName: string;
  fromEmail?: string;
  replyTo?: string;
  templateId?: string;
  variables: Record<string, string>;
} => {
  if (typeof data !== 'object' || data === null) {
    throw new Error("Invalid request body");
  }
  
  const { to, subject, body, fromName, fromEmail, replyTo, templateId, variables } = data as Record<string, unknown>;
  
  // Validate 'to' email
  if (typeof to !== 'string' || !validateEmail(to)) {
    throw new Error("Invalid 'to' email address");
  }
  
  // Validate subject
  if (typeof subject !== 'string' || subject.trim().length === 0) {
    throw new Error("Subject is required");
  }
  if (subject.length > 500) {
    throw new Error("Subject exceeds maximum length of 500 characters");
  }
  
  // Validate body
  if (typeof body !== 'string' || body.trim().length === 0) {
    throw new Error("Body is required");
  }
  if (body.length > 50000) {
    throw new Error("Body exceeds maximum length of 50000 characters");
  }
  
  // Validate fromEmail if provided
  if (fromEmail !== undefined && fromEmail !== null) {
    if (typeof fromEmail !== 'string' || !validateEmail(fromEmail)) {
      throw new Error("Invalid 'fromEmail' address");
    }
  }
  
  // Validate replyTo if provided
  if (replyTo !== undefined && replyTo !== null) {
    if (typeof replyTo !== 'string' || !validateEmail(replyTo)) {
      throw new Error("Invalid 'replyTo' address");
    }
  }
  
  // Validate variables
  const sanitizedVariables: Record<string, string> = {};
  if (variables !== undefined && variables !== null) {
    if (typeof variables !== 'object') {
      throw new Error("Variables must be an object");
    }
    for (const [key, value] of Object.entries(variables as Record<string, unknown>)) {
      if (typeof value !== 'string') {
        continue;
      }
      // Limit variable key and value length
      if (key.length > 100 || value.length > 1000) {
        throw new Error(`Variable '${key}' exceeds maximum length`);
      }
      sanitizedVariables[key] = value;
    }
  }
  
  return {
    to: to.trim(),
    subject: subject.trim(),
    body: body.trim(),
    fromName: typeof fromName === 'string' ? fromName.trim().substring(0, 100) : "KOPRO",
    fromEmail: fromEmail as string | undefined,
    replyTo: replyTo as string | undefined,
    templateId: typeof templateId === 'string' ? templateId : undefined,
    variables: sanitizedVariables,
  };
};

// Escape HTML to prevent XSS
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Service email non configuré" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    const rawBody = await req.json();
    const { 
      to, 
      subject, 
      body, 
      fromName,
      fromEmail,
      replyTo,
      templateId,
      variables
    } = validateRequest(rawBody);

    // Replace variables in subject and body with escaped values
    let processedSubject = subject;
    let processedBody = body;

    for (const [key, value] of Object.entries(variables)) {
      const escapedValue = escapeHtml(value);
      const regex = new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, "g");
      processedSubject = processedSubject.replace(regex, escapedValue);
      processedBody = processedBody.replace(regex, escapedValue);
    }

    // Build HTML email with professional template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
      white-space: pre-wrap;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 4px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(fromName)}</h1>
    </div>
    <div class="content">
      ${processedBody.replace(/\n/g, "<br>")}
    </div>
    <div class="footer">
      <p>KOPRO - Gestion de copropriété simplifiée</p>
      <p>Cet email a été envoyé automatiquement. Merci de ne pas répondre directement.</p>
    </div>
  </div>
</body>
</html>`;

    console.log(`Sending email to ${to} with subject: ${processedSubject.substring(0, 50)}...`);

    // Use onboarding@resend.dev for testing, or custom verified domain
    const from = fromEmail 
      ? `${fromName} <${fromEmail}>`
      : `${fromName} <onboarding@resend.dev>`;

    // Call Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: processedSubject,
        html: htmlContent,
        reply_to: replyTo,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      return new Response(
        JSON.stringify({ error: emailData.message || "Erreur d'envoi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", emailData);

    // Log the email in audit (without sensitive content)
    await supabase.from("audit_logs").insert({
      action: "email_sent",
      entity_type: "email",
      metadata: {
        to,
        subject: processedSubject.substring(0, 100),
        template_id: templateId,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email envoyé avec succès",
        id: emailData.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
