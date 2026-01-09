import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  onSuccess: () => void;
}

export function AddTeamMemberDialog({ open, onOpenChange, agencyId, onSuccess }: AddTeamMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"manager" | "cs">("manager");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user already exists by email
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle();

      let userId: string;

      if (existingProfile) {
        userId = existingProfile.id;
      } else {
        // Create a new user via admin API would require edge function
        // For now, create a profile placeholder that will be linked when user signs up
        toast({
          title: "Utilisateur non trouvé",
          description: "L'utilisateur doit d'abord créer un compte avec cet email.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("agency_id", agencyId)
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Membre existant",
          description: "Cet utilisateur fait déjà partie de l'équipe.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Add user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          agency_id: agencyId,
          role: role,
        });

      if (roleError) throw roleError;

      toast({
        title: "Membre ajouté",
        description: `${firstName || email} a été ajouté à l'équipe.`,
      });

      onSuccess();
      onOpenChange(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      setRole("manager");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="membre@email.fr"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "manager" | "cs")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Gestionnaire</SelectItem>
                <SelectItem value="cs">Collaborateur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
