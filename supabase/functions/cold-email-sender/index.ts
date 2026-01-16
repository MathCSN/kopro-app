import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Campaign {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  status: string;
  batch_size: number;
  interval_minutes: number;
  start_hour: number;
  end_hour: number;
  active_days: string[];
}

interface Recipient {
  id: string;
  email: string;
  campaign_id: string;
}

const DAYS_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for test mode or manual trigger
    let isTestMode = false;
    let testEmail = "";
    let campaignId = "";
    
    try {
      const body = await req.json();
      isTestMode = body.test === true;
      testEmail = body.email || "";
      campaignId = body.campaignId || "";
    } catch {
      // No body, this is a scheduled run
    }

    // Test mode: send a single test email
    if (isTestMode && testEmail && campaignId) {
      console.log(`Test mode: sending to ${testEmail} for campaign ${campaignId}`);
      
      const { data: campaign, error: campaignError } = await supabase
        .from("cold_email_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (campaignError || !campaign) {
        return new Response(
          JSON.stringify({ error: "Campaign not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: sendError } = await resend.emails.send({
        from: "Kopro <onboarding@resend.dev>",
        to: [testEmail],
        subject: `[TEST] ${campaign.subject}`,
        html: campaign.html_content,
      });

      if (sendError) {
        console.error("Test email error:", sendError);
        return new Response(
          JSON.stringify({ error: sendError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Test email sent successfully to ${testEmail}`);
      return new Response(
        JSON.stringify({ success: true, message: `Test email sent to ${testEmail}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Scheduled mode: check time constraints and send batch
    const now = new Date();
    const currentHour = now.getUTCHours() + 1; // Paris time (UTC+1)
    const currentDay = DAYS_MAP[now.getUTCDay()];

    console.log(`Current time: ${currentHour}h, day: ${currentDay}`);

    // Fetch active campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from("cold_email_campaigns")
      .select("*")
      .eq("status", "active");

    if (campaignsError) {
      console.error("Error fetching campaigns:", campaignsError);
      throw campaignsError;
    }

    if (!campaigns || campaigns.length === 0) {
      console.log("No active campaigns found");
      return new Response(
        JSON.stringify({ message: "No active campaigns" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${campaigns.length} active campaigns`);

    let totalSent = 0;
    let totalErrors = 0;

    for (const campaign of campaigns as Campaign[]) {
      // Check time constraints
      const activeDays = campaign.active_days || [];
      
      if (!activeDays.includes(currentDay)) {
        console.log(`Campaign ${campaign.name}: skipped (not an active day)`);
        continue;
      }

      if (currentHour < campaign.start_hour || currentHour >= campaign.end_hour) {
        console.log(`Campaign ${campaign.name}: skipped (outside hours ${campaign.start_hour}-${campaign.end_hour})`);
        continue;
      }

      console.log(`Processing campaign: ${campaign.name}`);

      // Fetch pending recipients
      const { data: recipients, error: recipientsError } = await supabase
        .from("cold_email_recipients")
        .select("id, email, campaign_id")
        .eq("campaign_id", campaign.id)
        .eq("status", "pending")
        .limit(campaign.batch_size);

      if (recipientsError) {
        console.error(`Error fetching recipients for ${campaign.name}:`, recipientsError);
        continue;
      }

      if (!recipients || recipients.length === 0) {
        console.log(`Campaign ${campaign.name}: no pending recipients, marking as completed`);
        await supabase
          .from("cold_email_campaigns")
          .update({ status: "completed" })
          .eq("id", campaign.id);
        continue;
      }

      console.log(`Sending ${recipients.length} emails for campaign ${campaign.name}`);

      // Send emails
      for (const recipient of recipients as Recipient[]) {
        try {
          const { error: sendError } = await resend.emails.send({
            from: "Kopro <onboarding@resend.dev>",
            to: [recipient.email],
            subject: campaign.subject,
            html: campaign.html_content,
          });

          if (sendError) {
            console.error(`Error sending to ${recipient.email}:`, sendError);
            await supabase
              .from("cold_email_recipients")
              .update({ 
                status: "bounced", 
                error_message: sendError.message,
                sent_at: new Date().toISOString()
              })
              .eq("id", recipient.id);
            totalErrors++;
          } else {
            console.log(`Email sent successfully to ${recipient.email}`);
            await supabase
              .from("cold_email_recipients")
              .update({ 
                status: "sent", 
                sent_at: new Date().toISOString() 
              })
              .eq("id", recipient.id);
            totalSent++;
          }

          // Small delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`Exception sending to ${recipient.email}:`, err);
          await supabase
            .from("cold_email_recipients")
            .update({ 
              status: "bounced", 
              error_message: String(err),
              sent_at: new Date().toISOString()
            })
            .eq("id", recipient.id);
          totalErrors++;
        }
      }
    }

    console.log(`Batch complete: ${totalSent} sent, ${totalErrors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: totalSent, 
        errors: totalErrors 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Cold email sender error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
