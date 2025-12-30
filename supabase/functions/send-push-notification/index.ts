import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  residenceId?: string;
  userIds?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!vapidPrivateKey || !vapidPublicKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const payload: PushPayload = await req.json();

    // Get subscriptions based on target
    let userIds: string[] = [];
    
    if (payload.userIds && payload.userIds.length > 0) {
      userIds = payload.userIds;
    } else if (payload.residenceId) {
      // Get lots in residence first
      const { data: lots } = await supabase
        .from("lots")
        .select("id")
        .eq("residence_id", payload.residenceId);
      
      if (lots && lots.length > 0) {
        const lotIds = lots.map(l => l.id);
        
        // Get all users in the residence through occupancies
        const { data: occupancies } = await supabase
          .from("occupancies")
          .select("user_id")
          .eq("is_active", true)
          .in("lot_id", lotIds);
        
        userIds = occupancies?.map(o => o.user_id) || [];
      }
    }

    // Fetch subscriptions
    let query = supabase.from("push_subscriptions").select("*");
    if (userIds.length > 0) {
      query = query.in("user_id", userIds);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send push notifications
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/newsfeed",
      tag: payload.tag || "announcement",
    });

    let successCount = 0;
    const failedEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        const response = await sendWebPush(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            }
          },
          notificationPayload,
          vapidPublicKey,
          vapidPrivateKey
        );

        if (response.ok) {
          successCount++;
        } else if (response.status === 410 || response.status === 404) {
          failedEndpoints.push(sub.endpoint);
        }
      } catch (err) {
        console.error("Error sending push to", sub.endpoint, err);
        failedEndpoints.push(sub.endpoint);
      }
    }

    // Clean up expired subscriptions
    if (failedEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", failedEndpoints);
    }

    return new Response(
      JSON.stringify({ 
        message: "Push notifications sent", 
        sent: successCount, 
        failed: failedEndpoints.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in send-push-notification:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  _vapidPrivateKey: string
): Promise<Response> {
  const audience = new URL(subscription.endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  // Create simple JWT header for VAPID
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  const claims = btoa(JSON.stringify({
    aud: audience,
    exp: expiration,
    sub: "mailto:contact@kopro.app"
  })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  // For a simple implementation, we use the unsigned token
  // In production, you'd want to use proper ECDSA signing
  const jwt = `${header}.${claims}.`;

  return fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "TTL": "86400",
      "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
    },
    body: payload,
  });
}
