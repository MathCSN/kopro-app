import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { residenceId, userId, successUrl, cancelUrl } = await req.json();

    if (!residenceId || !userId) {
      return new Response(
        JSON.stringify({ error: "residenceId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating checkout for user ${userId}, residence ${residenceId}`);

    // Get Stripe config from app_config
    const { data: configData } = await supabase
      .from("app_config")
      .select("key, value")
      .in("key", ["stripe_secret_key", "stripe_price_id_syndic_monthly"]);

    const config: Record<string, string> = {};
    configData?.forEach((item: { key: string; value: string }) => {
      config[item.key] = item.value;
    });

    const stripeSecretKey = config["stripe_secret_key"];
    if (!stripeSecretKey) {
      console.error("Stripe secret key not configured");
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", userId)
      .single();

    // Get residence info
    const { data: residence } = await supabase
      .from("residences")
      .select("name")
      .eq("id", residenceId)
      .single();

    // Get syndic pricing
    const { data: pricing } = await supabase
      .from("pricing_config")
      .select("syndic_monthly_price_per_residence")
      .eq("is_active", true)
      .single();

    const pricePerMonth = pricing?.syndic_monthly_price_per_residence || 29.90;
    const priceInCents = Math.round(pricePerMonth * 100);

    // Create or get Stripe customer
    let customerId: string;

    // Check if customer already exists
    const customerSearchRes = await fetch(
      `https://api.stripe.com/v1/customers/search?query=email:'${profile?.email}'`,
      {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
      }
    );
    const customerSearch = await customerSearchRes.json();

    if (customerSearch.data && customerSearch.data.length > 0) {
      customerId = customerSearch.data[0].id;
      console.log(`Found existing customer: ${customerId}`);
    } else {
      // Create new customer
      const createCustomerRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: profile?.email || "",
          name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
          "metadata[user_id]": userId,
          "metadata[type]": "syndic",
        }),
      });
      const newCustomer = await createCustomerRes.json();
      customerId = newCustomer.id;
      console.log(`Created new customer: ${customerId}`);
    }

    // Create Stripe Checkout Session
    const checkoutParams = new URLSearchParams({
      "mode": "subscription",
      "customer": customerId,
      "success_url": successUrl || `${supabaseUrl.replace('.supabase.co', '')}/syndic-portal?success=true`,
      "cancel_url": cancelUrl || `${supabaseUrl.replace('.supabase.co', '')}/syndic-portal?canceled=true`,
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][product_data][name]": `Kopro Pro - ${residence?.name || "Résidence"}`,
      "line_items[0][price_data][product_data][description]": "Abonnement mensuel syndic - Accès complet au portail de gestion",
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][price_data][unit_amount]": priceInCents.toString(),
      "line_items[0][quantity]": "1",
      "metadata[user_id]": userId,
      "metadata[residence_id]": residenceId,
      "metadata[type]": "syndic_subscription",
      "subscription_data[metadata][user_id]": userId,
      "subscription_data[metadata][residence_id]": residenceId,
    });

    const checkoutRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: checkoutParams,
    });

    const session = await checkoutRes.json();

    if (session.error) {
      console.error("Stripe error:", session.error);
      return new Response(
        JSON.stringify({ error: session.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating checkout:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
