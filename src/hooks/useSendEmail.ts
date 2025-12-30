import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  templateId?: string;
  variables?: Record<string, string>;
}

interface EmailConfig {
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
}

export function useSendEmail() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);

  // Load email config on mount
  useEffect(() => {
    const loadEmailConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("app_config")
          .select("key, value")
          .in("key", ["email_sender_name", "email_sender_email", "email_reply_to"]);

        if (error) throw error;

        const config: Record<string, string> = {};
        data?.forEach(item => {
          config[item.key] = item.value || "";
        });

        setEmailConfig({
          senderName: config.email_sender_name || "KOPRO",
          senderEmail: config.email_sender_email || "",
          replyToEmail: config.email_reply_to || "",
        });
      } catch (error) {
        console.error("Error loading email config:", error);
      }
    };

    loadEmailConfig();
  }, []);

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
      // Use configured email settings or defaults
      const fromName = params.fromName || emailConfig?.senderName || "KOPRO";
      const fromEmail = params.fromEmail || emailConfig?.senderEmail || undefined;
      const replyTo = params.replyTo || emailConfig?.replyToEmail || undefined;

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          ...params,
          fromName,
          fromEmail,
          replyTo,
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
