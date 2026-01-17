import { supabase } from "@/integrations/supabase/client";

interface NotifySyndicParams {
  residenceId: string;
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
  ticketCategory: string;
  reporterName: string;
}

export async function notifySyndicForCommonTicket({
  residenceId,
  ticketId,
  ticketTitle,
  ticketDescription,
  ticketCategory,
  reporterName,
}: NotifySyndicParams): Promise<boolean> {
  try {
    // Get residence info
    const { data: residence } = await supabase
      .from("residences")
      .select("name, address")
      .eq("id", residenceId)
      .single();

    if (!residence) {
      console.error("Residence not found");
      return false;
    }

    // Check for active syndic assignment
    const { data: assignment } = await supabase
      .from("syndic_assignments")
      .select("syndic_user_id")
      .eq("residence_id", residenceId)
      .eq("status", "active")
      .single();

    let syndicEmail: string | null = null;
    let syndicName: string | null = null;

    if (assignment?.syndic_user_id) {
      // Get syndic profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, first_name, last_name")
        .eq("id", assignment.syndic_user_id)
        .single();

      if (profile) {
        syndicEmail = profile.email;
        syndicName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
      }
    } else {
      // Check for pending invitation
      const { data: invitation } = await supabase
        .from("syndic_invitations")
        .select("email, syndic_name, token")
        .eq("residence_id", residenceId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (invitation) {
        syndicEmail = invitation.email;
        syndicName = invitation.syndic_name;
      }
    }

    if (!syndicEmail) {
      console.log("No syndic configured for this residence");
      return false;
    }

    // Build portal URL
    const portalUrl = `${window.location.origin}/syndic-portal`;

    // Send notification email
    const { error } = await supabase.functions.invoke("send-email", {
      body: {
        to: syndicEmail,
        subject: `🔔 Nouvel incident signalé - ${residence.name}`,
        fromName: "Kopro",
        body: `Bonjour ${syndicName || ""},

Un nouvel incident concernant les parties communes a été signalé dans la résidence ${residence.name}.

📍 Résidence : ${residence.name}
${residence.address ? `📮 Adresse : ${residence.address}` : ""}

🎫 Détails de l'incident :
• Titre : ${ticketTitle}
• Catégorie : ${ticketCategory}
• Signalé par : ${reporterName}

📝 Description :
${ticketDescription}

---

Vous pouvez consulter et gérer cet incident directement sur votre portail Syndic :
${portalUrl}

Cordialement,
L'équipe Kopro`,
      },
    });

    if (error) {
      console.error("Error sending syndic notification:", error);
      return false;
    }

    // Update ticket to mark syndic as notified
    await supabase
      .from("tickets")
      .update({ syndic_notified_at: new Date().toISOString() })
      .eq("id", ticketId);

    console.log("Syndic notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error in notifySyndicForCommonTicket:", error);
    return false;
  }
}

interface NotifyManagerParams {
  residenceId: string;
  ticketTitle: string;
  ticketCategory: string;
  reporterName: string;
  syndicNotified: boolean;
}

export async function notifyManagerForCommonTicket({
  residenceId,
  ticketTitle,
  ticketCategory,
  reporterName,
  syndicNotified,
}: NotifyManagerParams): Promise<boolean> {
  try {
    // Get residence info with agency
    const { data: residence } = await supabase
      .from("residences")
      .select("name, agency_id")
      .eq("id", residenceId)
      .single();

    if (!residence?.agency_id) {
      console.log("No agency linked to this residence");
      return false;
    }

    // Get managers for this residence
    const { data: managers } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("residence_id", residenceId)
      .eq("role", "manager");

    if (!managers || managers.length === 0) {
      console.log("No managers found for this residence");
      return false;
    }

    // Get manager emails
    const managerIds = managers.map(m => m.user_id);
    const { data: managerProfiles } = await supabase
      .from("profiles")
      .select("email, first_name")
      .in("id", managerIds);

    if (!managerProfiles || managerProfiles.length === 0) {
      return false;
    }

    // Send notification to each manager
    for (const manager of managerProfiles) {
      if (!manager.email) continue;

      await supabase.functions.invoke("send-email", {
        body: {
          to: manager.email,
          subject: `📋 Incident parties communes - ${residence.name}`,
          fromName: "Kopro",
          body: `Bonjour ${manager.first_name || ""},

Un incident concernant les parties communes a été signalé dans la résidence ${residence.name}.

🎫 Détails :
• Titre : ${ticketTitle}
• Catégorie : ${ticketCategory}
• Signalé par : ${reporterName}

${syndicNotified 
  ? "✅ Le syndic a été notifié automatiquement et prendra en charge cet incident."
  : "⚠️ Aucun syndic n'est configuré pour cette résidence. L'incident vous est directement adressé."}

Vous pouvez suivre cet incident depuis votre tableau de bord Kopro.

Cordialement,
L'équipe Kopro`,
        },
      });
    }

    console.log("Manager notifications sent");
    return true;
  } catch (error) {
    console.error("Error notifying managers:", error);
    return false;
  }
}
