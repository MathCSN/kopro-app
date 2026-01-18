import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteCheckoutRequest {
  quoteId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { quoteId, userId, successUrl, cancelUrl }: QuoteCheckoutRequest = await req.json();

    if (!quoteId || !userId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Import Supabase client
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Stripe secret key from app_config
    const { data: stripeConfig } = await supabase
      .from("app_config")
      .select("key, value")
      .in("key", ["stripe_secret_key"]);

    const stripeSecretKey = stripeConfig?.find((c: any) => c.key === "stripe_secret_key")?.value;

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get quote details
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ error: "Quote not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", userId)
      .single();

    // Initialize Stripe
    const Stripe = (await import("https://esm.sh/stripe@14.21.0")).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Create or get Stripe customer
    let customerId: string;
    const email = profile?.email || quote.client_email;
    
    if (email) {
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: email,
          name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : quote.client_name,
          metadata: {
            user_id: userId,
          },
        });
        customerId = customer.id;
      }
    } else {
      const customer = await stripe.customers.create({
        name: quote.client_name,
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;
    }

    // Build line items based on quote
    const lineItems: any[] = [];

    // Add activation fee if present
    if (quote.activation_price && Number(quote.activation_price) > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Frais d'activation",
          },
          unit_amount: Math.round(Number(quote.activation_price) * 100),
        },
        quantity: 1,
      });
    }

    // Add monthly price if present (as one-time for the quote)
    if (quote.monthly_price && Number(quote.monthly_price) > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `Abonnement mensuel (${quote.apartments_count || 1} appartement${quote.apartments_count > 1 ? 's' : ''})`,
          },
          unit_amount: Math.round(Number(quote.monthly_price) * 100),
        },
        quantity: 1,
      });
    }

    // If no line items, add total as single item
    if (lineItems.length === 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Devis Kopro",
          },
          unit_amount: Math.round(Number(quote.total_ttc || quote.total_ht || 0) * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&quote_id=${quoteId}`,
      cancel_url: cancelUrl,
      metadata: {
        quote_id: quoteId,
        user_id: userId,
        quote_number: quote.quote_number,
      },
    });

    console.log("Quote checkout session created:", session.id);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating quote checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
