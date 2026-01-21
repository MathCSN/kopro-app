import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  onSuccess: () => void;
}

interface CustomRole {
  id: string;
  name: string;
  color: string;
}

export function AddTeamMemberDialog({ open, onOpenChange, agencyId, onSuccess }: AddTeamMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleType, setRoleType] = useState<"system" | "custom">("system");
  const [systemRole, setSystemRole] = useState<"manager" | "cs">("manager");
  const [customRoleId, setCustomRoleId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch custom roles for this agency
  const { data: customRoles = [] } = useQuery({
    queryKey: ["agency-custom-roles", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_custom_roles")
        .select("id, name, color")
        .eq("agency_id", agencyId)
        .order("name");

      if (error) throw error;
      return data as CustomRole[];
    },
    enabled: open,
  });

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

      // Add user role with optional custom_role_id
      const insertData: {
        user_id: string;
        agency_id: string;
        role: "manager" | "cs";
        custom_role_id?: string;
      } = {
        user_id: userId,
        agency_id: agencyId,
        role: roleType === "system" ? systemRole : "cs", // Custom roles use 'cs' as base
      };

      if (roleType === "custom" && customRoleId) {
        insertData.custom_role_id = customRoleId;
      }

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert(insertData);

      if (roleError) throw roleError;

      toast({
        title: "Membre ajouté",
        description: `${firstName || email} a été ajouté à l'équipe.`,
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
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

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setRoleType("system");
    setSystemRole("manager");
    setCustomRoleId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un membre</DialogTitle>
          <DialogDescription>
            Ajoutez un collaborateur à votre équipe
          </DialogDescription>
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
            <Label>Type de rôle *</Label>
            <Select value={roleType} onValueChange={(v) => setRoleType(v as "system" | "custom")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Rôle standard</SelectItem>
                {customRoles.length > 0 && (
                  <SelectItem value="custom">Rôle personnalisé</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {roleType === "system" ? (
            <div className="space-y-2">
              <Label htmlFor="systemRole">Rôle *</Label>
              <Select value={systemRole} onValueChange={(v) => setSystemRole(v as "manager" | "cs")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Gestionnaire (tous les droits)</SelectItem>
                  <SelectItem value="cs">Collaborateur (droits limités)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="customRole">Rôle personnalisé *</Label>
              <Select value={customRoleId} onValueChange={setCustomRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle..." />
                </SelectTrigger>
                <SelectContent>
                  {customRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        {role.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customRoles.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucun rôle personnalisé créé. Créez-en dans l'onglet "Rôles".
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (roleType === "custom" && !customRoleId)}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
