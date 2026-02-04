import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  templateId?: string;
  variables?: Record<string, string>;
  residenceId?: string;
}

interface EmailConfig {
  agencyName: string;
  noreplyEmail: string;
  agencyContactEmail: string;
}

export function useSendEmail() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);

  useEffect(() => {
    const loadEmailConfig = async () => {
      if (!user) return;

      try {
        const { data: noreplyData } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "noreply_email")
          .maybeSingle();

        const noreplyEmail = noreplyData?.value || "noreply@kopro.app";

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("agency_id, role")
          .eq("user_id", user.id)
          .not("agency_id", "is", null)
          .maybeSingle();

        if (!roleData?.agency_id) {
          setEmailConfig({
            agencyName: "KOPRO",
            noreplyEmail,
            agencyContactEmail: "",
          });
          return;
        }

        const { data: agencyData } = await supabase
          .from("agencies")
          .select("name, email")
          .eq("id", roleData.agency_id)
          .maybeSingle();

        setEmailConfig({
          agencyName: agencyData?.name || "KOPRO",
          noreplyEmail,
          agencyContactEmail: agencyData?.email || "",
        });
      } catch (error) {
        console.error("Error loading email config:", error);
        setEmailConfig({
          agencyName: "KOPRO",
          noreplyEmail: "noreply@kopro.app",
          agencyContactEmail: "",
        });
      }
    };

    loadEmailConfig();
  }, [user]);

  const sendEmail = async (params: SendEmailParams): Promise<boolean> => {
    if (!params.to || !params.subject || !params.body) {
      toast({
        title: "Erreur",
        description: "Destinataire, sujet et contenu sont requis",
        variant: "destructive",
      });
      return false;
    }

    setIsSending(true);

    try {
      const fromName = params.fromName || emailConfig?.agencyName || "KOPRO";
      const fromEmail = params.fromEmail || emailConfig?.noreplyEmail || undefined;
      const replyTo = params.replyTo || emailConfig?.agencyContactEmail || undefined;

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: params.to,
          subject: params.subject,
          body: params.body,
          fromName,
          fromEmail,
          replyTo,
          templateId: params.templateId,
          variables: params.variables,
          residenceId: params.residenceId,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Email envoyé",
        description: `L'email a été envoyé à ${params.to}`,
      });

      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur d'envoi";
      toast({
        title: "Erreur d'envoi",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return { sendEmail, isSending, emailConfig };
}
