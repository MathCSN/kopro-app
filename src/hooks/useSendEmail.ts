import { useState } from "react";
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

export function useSendEmail() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

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
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: params,
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

  return { sendEmail, isSending };
}
