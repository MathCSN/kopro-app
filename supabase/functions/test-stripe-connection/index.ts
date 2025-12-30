import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get secret key from request body (for testing before saving)
    const { secretKey, action } = await req.json();

    let stripeSecretKey = secretKey;

    // If no key provided, try to get from database
    if (!stripeSecretKey && action === "test_saved") {
      const { data: configData, error: configError } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "stripe_secret_key")
        .single();

      if (configError || !configData?.value) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Aucune clé Stripe configurée" 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
      stripeSecretKey = configData.value;
    }

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Clé secrète Stripe requise" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Test Stripe connection by fetching account info
    console.log("Testing Stripe connection...");
    
    const stripeResponse = await fetch("https://api.stripe.com/v1/account", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      console.error("Stripe API error:", errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorData.error?.message || "Clé API invalide",
          code: errorData.error?.code 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    const accountData = await stripeResponse.json();
    console.log("Stripe connection successful for account:", accountData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        account: {
          id: accountData.id,
          business_name: accountData.business_profile?.name || accountData.settings?.dashboard?.display_name,
          country: accountData.country,
          default_currency: accountData.default_currency,
          charges_enabled: accountData.charges_enabled,
          payouts_enabled: accountData.payouts_enabled,
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: unknown) {
    console.error("Error testing Stripe connection:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur lors du test de connexion";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
