import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Get authenticated user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { question, residenceId, conversationId } = await req.json();

    if (!question || !residenceId) {
      throw new Error("Missing required fields: question and residenceId");
    }

    console.log(`Processing question for residence ${residenceId}: ${question}`);

    // Get AI settings for this residence
    const { data: aiSettings, error: settingsError } = await supabase
      .from("residence_ai_settings")
      .select("*")
      .eq("residence_id", residenceId)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching AI settings:", settingsError);
      throw new Error("Failed to fetch AI settings");
    }

    if (!aiSettings?.enabled) {
      return new Response(JSON.stringify({ 
        error: "L'assistant IA n'est pas activé pour cette résidence." 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get knowledge documents for this residence
    const { data: documents, error: docsError } = await supabase
      .from("ai_knowledge_documents")
      .select("name, description, content_text")
      .eq("residence_id", residenceId);

    if (docsError) {
      console.error("Error fetching documents:", docsError);
    }

    // Build context from documents
    let documentContext = "";
    const relevantDocs: string[] = [];

    if (documents && documents.length > 0) {
      documentContext = documents.map(doc => {
        const content = doc.content_text || "";
        if (content.toLowerCase().includes(question.toLowerCase().split(" ").slice(0, 3).join(" "))) {
          relevantDocs.push(doc.name);
        }
        return `=== Document: ${doc.name} ===\n${doc.description || ""}\n${content}\n`;
      }).join("\n\n");
    }

    // Build fallback contact info
    let fallbackInfo = "";
    if (aiSettings.fallback_contact_name || aiSettings.fallback_contact_email || aiSettings.fallback_contact_phone) {
      fallbackInfo = `\n\nSi vous ne trouvez pas la réponse dans les documents, indiquez au résident de contacter:
- Nom: ${aiSettings.fallback_contact_name || "Non renseigné"}
- Email: ${aiSettings.fallback_contact_email || "Non renseigné"}
- Téléphone: ${aiSettings.fallback_contact_phone || "Non renseigné"}`;
    }

    // Create system prompt
    const systemPrompt = `Tu es l'assistant IA de la résidence. Tu aides les résidents à trouver des informations dans les documents de leur résidence (règlement intérieur, procédures, contacts, etc.).

RÈGLES IMPORTANTES:
1. Réponds UNIQUEMENT en te basant sur les documents fournis ci-dessous.
2. Si tu trouves la réponse dans un document, cite le nom du document.
3. Si tu ne trouves pas l'information dans les documents, dis-le clairement et fournis les coordonnées du contact responsable.
4. Sois concis, amical et professionnel.
5. Réponds toujours en français.

DOCUMENTS DE LA RÉSIDENCE:
${documentContext || "Aucun document n'est disponible pour le moment."}
${fallbackInfo}`;

    console.log("Calling Lovable AI Gateway...");

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Trop de requêtes. Veuillez réessayer dans quelques instants." 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error("AI Gateway error");
    }

    const aiResponse = await response.json();
    const answer = aiResponse.choices?.[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.";

    console.log("AI response received successfully");

    // Save to conversation if conversationId provided
    let newConversationId = conversationId;
    if (!newConversationId) {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from("ai_conversations")
        .insert({
          residence_id: residenceId,
          user_id: user.id,
        })
        .select()
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
      } else {
        newConversationId = newConv.id;
      }
    }

    if (newConversationId) {
      // Save user message
      await supabase.from("ai_messages").insert({
        conversation_id: newConversationId,
        role: "user",
        content: question,
      });

      // Save assistant response
      await supabase.from("ai_messages").insert({
        conversation_id: newConversationId,
        role: "assistant",
        content: answer,
        sources: relevantDocs,
      });
    }

    return new Response(JSON.stringify({ 
      answer,
      conversationId: newConversationId,
      sources: relevantDocs,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in residence-assistant:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
