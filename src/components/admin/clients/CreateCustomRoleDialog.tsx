import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_default: boolean;
}

interface CreateCustomRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  editingRole: CustomRole | null;
  onSuccess: () => void;
}

const COLOR_PRESETS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#3b82f6", // Blue
  "#64748b", // Slate
];

export function CreateCustomRoleDialog({
  open,
  onOpenChange,
  agencyId,
  editingRole,
  onSuccess,
}: CreateCustomRoleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingRole) {
      setName(editingRole.name);
      setDescription(editingRole.description || "");
      setColor(editingRole.color);
      setIsDefault(editingRole.is_default);
    } else {
      setName("");
      setDescription("");
      setColor(COLOR_PRESETS[0]);
      setIsDefault(false);
    }
  }, [editingRole, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from("agency_custom_roles")
          .update({
            name: name.trim(),
            description: description.trim() || null,
            color,
            is_default: isDefault,
          })
          .eq("id", editingRole.id);

        if (error) throw error;
        toast.success("Rôle modifié");
      } else {
        // Create new role
        const { error } = await supabase
          .from("agency_custom_roles")
          .insert({
            agency_id: agencyId,
            name: name.trim(),
            description: description.trim() || null,
            color,
            is_default: isDefault,
          });

        if (error) throw error;
        toast.success("Rôle créé");
      }

      onSuccess();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Un rôle avec ce nom existe déjà");
      } else {
        toast.error(error.message || "Une erreur est survenue");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingRole ? "Modifier le rôle" : "Créer un rôle"}</DialogTitle>
          <DialogDescription>
            {editingRole
              ? "Modifiez les informations du rôle"
              : "Définissez un nouveau rôle pour votre équipe"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du rôle *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Comptable, Technicien..."
              required
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
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === preset ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div>
              <Label htmlFor="is-default" className="font-medium">
                Rôle par défaut
              </Label>
              <p className="text-xs text-muted-foreground">
                Assigné automatiquement aux nouveaux membres
              </p>
            </div>
            <Switch
              id="is-default"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRole ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
