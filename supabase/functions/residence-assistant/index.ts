import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const validateRequest = (data: unknown): { question: string; residenceId: string; conversationId?: string } => {
  if (typeof data !== 'object' || data === null) {
    throw new Error("Invalid request body");
  }

  const { question, residenceId, conversationId } = data as Record<string, unknown>;

  if (typeof question !== 'string' || question.trim().length === 0) {
    throw new Error("Question is required and must be a non-empty string");
  }
  if (question.length > 5000) {
    throw new Error("Question exceeds maximum length of 5000 characters");
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof residenceId !== 'string' || !uuidRegex.test(residenceId)) {
    throw new Error("residenceId must be a valid UUID");
  }

  if (conversationId !== undefined && conversationId !== null) {
    if (typeof conversationId !== 'string' || !uuidRegex.test(conversationId)) {
      throw new Error("conversationId must be a valid UUID");
    }
  }

  return {
    question: question.trim(),
    residenceId,
    conversationId: conversationId as string | undefined,
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const rawBody = await req.json();
    const { question, residenceId } = validateRequest(rawBody);

    console.log(`Processing question for residence ${residenceId} by user ${user.id}`);

    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role, residence_id")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Error checking user roles:", rolesError);
      throw new Error("Failed to verify access");
    }

    const hasAccess = userRoles?.some(r =>
      r.role === 'admin' || r.residence_id === residenceId
    );

    if (!hasAccess) {
      throw new Error("Access denied to this residence");
    }

    const simpleResponse = `Je suis l'assistant virtuel de votre résidence. Pour le moment, je suis en mode simplifié et je peux vous aider avec les informations de base.

Pour obtenir de l'aide, vous pouvez :
- Consulter la section Documents pour les règlements et informations
- Utiliser la section Chat pour contacter votre gestionnaire
- Créer un ticket pour tout problème technique
- Consulter les assemblées générales pour les décisions importantes

Votre question : "${question}"

Pour une assistance personnalisée, contactez directement votre gestionnaire via la messagerie.`;

    return new Response(
      JSON.stringify({
        answer: simpleResponse,
        sources: []
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error: unknown) {
    console.error("Error in residence-assistant:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
