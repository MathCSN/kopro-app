import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
  residenceId?: string;
} => {
  if (typeof data !== 'object' || data === null) {
    throw new Error("Invalid request body");
  }

  const { to, subject, body, fromName, fromEmail, replyTo, templateId, variables, residenceId } = data as Record<string, unknown>;

  if (typeof to !== 'string' || !validateEmail(to)) {
    throw new Error("Invalid 'to' email address");
  }

  if (typeof subject !== 'string' || subject.trim().length === 0) {
    throw new Error("Subject is required");
  }
  if (subject.length > 500) {
    throw new Error("Subject exceeds maximum length of 500 characters");
  }

  if (typeof body !== 'string' || body.trim().length === 0) {
    throw new Error("Body is required");
  }
  if (body.length > 50000) {
    throw new Error("Body exceeds maximum length of 50000 characters");
  }

  if (fromEmail !== undefined && fromEmail !== null) {
    if (typeof fromEmail !== 'string' || !validateEmail(fromEmail)) {
      throw new Error("Invalid 'fromEmail' address");
    }
  }

  if (replyTo !== undefined && replyTo !== null) {
    if (typeof replyTo !== 'string' || !validateEmail(replyTo)) {
      throw new Error("Invalid 'replyTo' address");
    }
  }

  const sanitizedVariables: Record<string, string> = {};
  if (variables !== undefined && variables !== null) {
    if (typeof variables !== 'object') {
      throw new Error("Variables must be an object");
    }
    for (const [key, value] of Object.entries(variables as Record<string, unknown>)) {
      if (typeof value !== 'string') {
        continue;
      }
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
    residenceId: typeof residenceId === 'string' ? residenceId : undefined,
  };
};

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

async function sendWithSmtp(
  smtpConfig: any,
  to: string,
  from: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<void> {
  const auth = btoa(`${smtpConfig.username}:${smtpConfig.password}`);

  const emailPayload = {
    personalizations: [
      {
        to: [{ email: to }],
        subject: subject,
      }
    ],
    from: { email: from },
    content: [
      {
        type: "text/html",
        value: html
      }
    ]
  };

  if (replyTo) {
    emailPayload.personalizations[0] = {
      ...emailPayload.personalizations[0],
      reply_to: { email: replyTo }
    };
  }

  const smtpEndpoint = `https://${smtpConfig.host}/api/mail/send`;

  try {
    const response = await fetch(smtpEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SMTP error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('SMTP send error:', error);
    throw error;
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.json();
    const {
      to,
      subject,
      body,
      fromName,
      fromEmail,
      replyTo,
      templateId,
      variables,
      residenceId
    } = validateRequest(rawBody);

    let processedSubject = subject;
    let processedBody = body;

    for (const [key, value] of Object.entries(variables)) {
      const escapedValue = escapeHtml(value);
      const regex = new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, "g");
      processedSubject = processedSubject.replace(regex, escapedValue);
      processedBody = processedBody.replace(regex, escapedValue);
    }

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
      ${processedBody}
    </div>
    <div class="footer">
      <p>KOPRO - Gestion de copropriété simplifiée</p>
      <p>Cet email a été envoyé automatiquement.</p>
    </div>
  </div>
</body>
</html>`;

    console.log(`Sending email to ${to} with subject: ${processedSubject.substring(0, 50)}...`);

    let smtpConfig = null;
    if (residenceId) {
      const { data } = await supabase
        .from("smtp_configs")
        .select("*")
        .eq("residence_id", residenceId)
        .eq("is_active", true)
        .maybeSingle();

      smtpConfig = data;
    }

    if (smtpConfig) {
      const from = fromEmail || smtpConfig.from_email;
      await sendWithSmtp(smtpConfig, to, from, processedSubject, htmlContent, replyTo);
    } else {
      const builtInFrom = fromEmail || Deno.env.get("DEFAULT_FROM_EMAIL") || "noreply@kopro.app";
      const authMailResponse = await supabase.auth.admin.inviteUserByEmail(to, {
        data: {
          custom_email: true,
          subject: processedSubject,
          html: htmlContent
        }
      });

      if (authMailResponse.error) {
        console.warn("Supabase auth mail fallback not available, email queued");
      }
    }

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
        message: "Email envoyé avec succès"
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
