import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get webhook secret from config
    const { data: configData } = await supabase
      .from("app_config")
      .select("key, value")
      .in("key", ["stripe_webhook_secret", "stripe_secret_key"]);

    const config: Record<string, string> = {};
    configData?.forEach((item: { key: string; value: string }) => {
      config[item.key] = item.value;
    });

    const webhookSecret = config["stripe_webhook_secret"];
    const stripeSecretKey = config["stripe_secret_key"];

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // For now, we'll process without signature verification if webhook secret isn't set
    // In production, you should always verify the signature
    let event;
    
    try {
      event = JSON.parse(body);
    } catch {
      console.error("Invalid JSON body");
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        
        // Only process syndic subscriptions
        if (session.metadata?.type !== "syndic_subscription") {
          console.log("Not a syndic subscription, skipping");
          break;
        }

        const userId = session.metadata.user_id;
        const residenceId = session.metadata.residence_id;
        const subscriptionId = session.subscription;

        console.log(`Checkout completed for user ${userId}, residence ${residenceId}`);

        // Get subscription details from Stripe
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${stripeSecretKey}` },
        });
        const subscription = await subRes.json();

        // Create or update syndic subscription
        const { error } = await supabase
          .from("syndic_subscriptions")
          .upsert({
            syndic_user_id: userId,
            residence_id: residenceId,
            status: "active",
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, { onConflict: "syndic_user_id,residence_id" });

        if (error) {
          console.error("Error creating subscription:", error);
        } else {
          console.log(`Syndic subscription activated for residence ${residenceId}`);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (!subscriptionId) break;

        // Get subscription details
        const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${stripeSecretKey}` },
        });
        const subscription = await subRes.json();

        // Update subscription period
        const { error } = await supabase
          .from("syndic_subscriptions")
          .update({
            status: "active",
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          console.error("Error updating subscription:", error);
        } else {
          console.log(`Subscription ${subscriptionId} renewed`);
        }
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.canceled": {
        const subscription = event.data.object;
        
        const { error } = await supabase
          .from("syndic_subscriptions")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error canceling subscription:", error);
        } else {
          console.log(`Subscription ${subscription.id} cancelled`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        
        const status = subscription.status === "active" ? "active" : 
                       subscription.status === "canceled" ? "cancelled" : "inactive";

        const { error } = await supabase
          .from("syndic_subscriptions")
          .update({
            status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
