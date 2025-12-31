import { useState } from "react";
import { Building2, Mail, Send, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NoApartmentAvailableProps {
  residenceId: string;
  residenceName: string;
  userId: string;
  userName: string;
  userEmail: string;
  managerEmail?: string;
  onRequestSent?: () => void;
}

export function NoApartmentAvailable({
  residenceId,
  residenceName,
  userId,
  userName,
  userEmail,
  managerEmail,
  onRequestSent,
}: NoApartmentAvailableProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSendRequest = async () => {
    if (!residenceId || !userId) return;

    setIsSubmitting(true);
    try {
      // Create apartment request in database
      const { error: requestError } = await supabase
        .from("apartment_requests")
        .insert({
          user_id: userId,
          residence_id: residenceId,
          message: message.trim() || `Bonjour, je souhaite rejoindre la résidence ${residenceName}. Merci de créer un appartement pour moi.`,
          status: "pending",
        });

      if (requestError) throw requestError;

      // Send email notification to manager if we have their email
      if (managerEmail) {
        await supabase.functions.invoke("send-email", {
          body: {
            to: managerEmail,
            subject: `Nouvelle demande d'appartement - ${residenceName}`,
            body: `Bonjour,

Un nouveau résident souhaite rejoindre votre résidence "${residenceName}" mais aucun appartement n'est disponible.

Informations du résident :
- Nom : ${userName}
- Email : ${userEmail}

Message du résident :
${message.trim() || "Aucun message supplémentaire."}

Veuillez vous connecter à KOPRO pour créer un appartement et valider cette demande.

Cordialement,
L'équipe KOPRO`,
            fromName: "KOPRO",
          },
        });
      }

      setRequestSent(true);
      toast({
        title: "Demande envoyée",
        description: "Le gestionnaire a été notifié de votre demande.",
      });
      onRequestSent?.();
    } catch (error: any) {
      console.error("Error sending request:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la demande.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requestSent) {
    return (
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <Send className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Demande envoyée !</CardTitle>
          <CardDescription>
            Votre gestionnaire a été notifié. Vous recevrez une notification dès qu'il aura créé votre appartement.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>Vous pouvez fermer cette page. Nous vous préviendrons par email lorsque votre demande sera traitée.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-soft">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <CardTitle className="text-2xl">Aucun appartement disponible</CardTitle>
        <CardDescription>
          Votre gestionnaire n'a pas encore créé d'appartement dans la résidence "{residenceName}".
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground text-center">
            Vous ne pouvez pas utiliser l'application tant qu'un appartement ne vous a pas été attribué.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message pour le gestionnaire (optionnel)</Label>
          <Textarea
            id="message"
            placeholder="Ex: Je suis le nouveau locataire de l'appartement 3B..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleSendRequest}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Contacter le gestionnaire
            </>
          )}
        </Button>

        {managerEmail && (
          <p className="text-xs text-center text-muted-foreground">
            Un email sera envoyé à votre gestionnaire pour lui demander de créer votre appartement.
          </p>
        )}
      </CardContent>
    </Card>
  );
}