import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Building2, Mail, Phone, Send, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  email: z.string().email("Email invalide"),
  syndic_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  syndic_phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InviteSyndicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residenceId: string;
  residenceName: string;
  onSuccess?: () => void;
}

export function InviteSyndicDialog({
  open,
  onOpenChange,
  residenceId,
  residenceName,
  onSuccess,
}: InviteSyndicDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      syndic_name: "",
      syndic_phone: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Check if invitation already exists
      const { data: existing } = await supabase
        .from("syndic_invitations")
        .select("id, status")
        .eq("residence_id", residenceId)
        .eq("email", values.email)
        .eq("status", "pending")
        .single();

      if (existing) {
        toast.error("Une invitation est déjà en attente pour cet email");
        return;
      }

      // Create invitation
      const { data: invitation, error } = await supabase
        .from("syndic_invitations")
        .insert({
          residence_id: residenceId,
          email: values.email,
          syndic_name: values.syndic_name,
          syndic_phone: values.syndic_phone || null,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      const inviteUrl = `${window.location.origin}/syndic-portal?token=${invitation.token}`;
      
      await supabase.functions.invoke("send-email", {
        body: {
          to: values.email,
          subject: `Invitation Kopro - Gérez les incidents de ${residenceName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Bienvenue sur Kopro</h2>
              <p>Bonjour ${values.syndic_name},</p>
              <p>Vous avez été désigné comme syndic de la résidence <strong>${residenceName}</strong> sur Kopro.</p>
              <p>Les résidents peuvent désormais vous signaler les incidents concernant les parties communes directement via l'application.</p>
              <div style="margin: 30px 0;">
                <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Accéder aux incidents
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">Ce lien est valable 30 jours. Vous pouvez créer un compte pour un accès permanent.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
              <p style="color: #999; font-size: 12px;">Kopro - Gestion immobilière simplifiée</p>
            </div>
          `,
        },
      });

      toast.success("Invitation envoyée au syndic");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error inviting syndic:", error);
      toast.error(error.message || "Erreur lors de l'envoi de l'invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Inviter le Syndic
          </DialogTitle>
          <DialogDescription>
            Le syndic recevra un email pour accéder aux incidents des parties communes de <strong>{residenceName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="syndic_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nom du syndic *
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Cabinet Dupont Immobilier" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email *
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="syndic@immo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="syndic_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="01 23 45 67 89" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Envoi..." : "Envoyer l'invitation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
