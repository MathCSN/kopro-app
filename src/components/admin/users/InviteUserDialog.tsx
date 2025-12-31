import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import { z } from "zod";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residenceId: string;
  residenceName: string;
}

type AppRole = "admin" | "manager" | "cs" | "resident";

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  manager: "Responsable",
  cs: "Collaborateur",
  resident: "Résident",
};

const emailSchema = z.string().email("Adresse email invalide");

export function InviteUserDialog({
  open,
  onOpenChange,
  residenceId,
  residenceName,
}: InviteUserDialogProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("resident");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (value: string) => {
    try {
      emailSchema.parse(value);
      setEmailError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
      return false;
    }
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!validateEmail(email)) {
        throw new Error("Email invalide");
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        // User exists, just add the role
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", existingProfile.id)
          .eq("residence_id", residenceId)
          .eq("role", role)
          .maybeSingle();

        if (existingRole) {
          throw new Error("Cet utilisateur a déjà ce rôle dans cette résidence");
        }

        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: existingProfile.id,
          role: role,
          residence_id: residenceId,
        });

        if (roleError) throw roleError;

        return { type: "existing" as const };
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from("residence_invitations")
        .select("id, status")
        .eq("residence_id", residenceId)
        .eq("email", email.toLowerCase())
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvitation) {
        throw new Error("Une invitation est déjà en attente pour cet email");
      }

      // Create invitation record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: inviteError } = await supabase
        .from("residence_invitations")
        .insert({
          residence_id: residenceId,
          email: email.toLowerCase(),
          first_name: firstName || null,
          last_name: lastName || null,
          role: role,
          message: message || null,
          invited_by: user?.id || null,
          expires_at: expiresAt.toISOString(),
        });

      if (inviteError) throw inviteError;

      // Send invitation email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: `Invitation à rejoindre ${residenceName}`,
          body: `
            <p>Bonjour${firstName ? ` ${firstName}` : ""},</p>
            <p>Vous êtes invité(e) à rejoindre la résidence <strong>${residenceName}</strong> en tant que <strong>${ROLE_LABELS[role]}</strong>.</p>
            ${message ? `<p>Message du gestionnaire : ${message}</p>` : ""}
            <p>Pour accepter cette invitation, créez votre compte sur notre plateforme.</p>
            <p>Cette invitation expire dans 7 jours.</p>
            <p>Cordialement,<br/>L'équipe de gestion</p>
          `,
        },
      });

      if (emailError) {
        console.error("Email error:", emailError);
      }

      return { type: "invited" as const, emailSent: !emailError };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["residence-users"] });
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      
      if (result.type === "existing") {
        toast.success("Rôle ajouté à l'utilisateur existant");
      } else if (result.emailSent) {
        toast.success("Invitation envoyée par email");
      } else {
        toast.success("Invitation enregistrée (email non envoyé - vérifiez la configuration SMTP)");
      }
      
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleClose = () => {
    setEmail("");
    setRole("resident");
    setFirstName("");
    setLastName("");
    setMessage("");
    setEmailError(null);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail(email)) {
      inviteMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inviter un utilisateur
          </DialogTitle>
          <DialogDescription>
            Envoyez une invitation par email pour rejoindre {residenceName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="nom@exemple.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              className={emailError ? "border-destructive" : ""}
              required
            />
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                placeholder="Jean"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                placeholder="Dupont"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="resident">Résident</SelectItem>
                <SelectItem value="cs">Collaborateur</SelectItem>
                <SelectItem value="manager">Responsable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message personnalisé (optionnel)</Label>
            <Textarea
              id="message"
              placeholder="Ajoutez un message à l'invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending || !email}>
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer l'invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
