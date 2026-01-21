import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";
import { AVAILABLE_PERMISSIONS } from "@/components/admin/clients/AgencyRolesManagement";

const COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#84cc16", "#22c55e", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6b7280",
];

interface Agency {
  id: string;
  name: string;
  type: string | null;
}

interface AdminCreateRoleForAgencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agency: Agency | null;
  onSuccess: () => void;
}

export function AdminCreateRoleForAgencyDialog({
  open,
  onOpenChange,
  agency,
  onSuccess,
}: AdminCreateRoleForAgencyDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!agency) throw new Error("Aucune agence sélectionnée");

      // Create the role
      const { data: role, error: roleError } = await supabase
        .from("agency_custom_roles")
        .insert({
          agency_id: agency.id,
          name,
          description: description || null,
          color,
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Create permissions
      const permissionEntries = Object.entries(permissions)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => ({
          custom_role_id: role.id,
          permission_key: key,
          enabled: true,
        }));

      if (permissionEntries.length > 0) {
        const { error: permError } = await supabase
          .from("custom_role_permissions")
          .insert(permissionEntries);
        if (permError) throw permError;
      }

      return role;
    },
    onSuccess: () => {
      toast.success("Rôle créé avec succès");
      queryClient.invalidateQueries({ queryKey: ["agency-custom-roles"] });
      resetForm();
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor(COLORS[0]);
    setPermissions({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom du rôle est requis");
      return;
    }
    createMutation.mutate();
  };

  const togglePermission = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const enabledCount = Object.values(permissions).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Créer un rôle pour {agency?.name}
          </DialogTitle>
          <DialogDescription>
            Ce rôle sera disponible uniquement pour cette agence ({agency?.type === 'syndic' ? 'Syndic' : 'Bailleur'})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du rôle *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Comptable, Technicien, Assistant..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez les responsabilités de ce rôle..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur du badge</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-7 h-7 rounded-full transition-all ${
                      color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <span className="text-xs text-muted-foreground">
                  {enabledCount} / {AVAILABLE_PERMISSIONS.length} activées
                </span>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                {AVAILABLE_PERMISSIONS.map((perm) => (
                  <div
                    key={perm.key}
                    className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <perm.icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{perm.label}</p>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={permissions[perm.key] || false}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer le rôle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
