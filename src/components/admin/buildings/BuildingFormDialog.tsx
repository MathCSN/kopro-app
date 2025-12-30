import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Building {
  id: string;
  name: string;
  address: string | null;
  residence_id: string;
}

interface BuildingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: Building | null;
  residenceId: string;
}

export function BuildingFormDialog({
  open,
  onOpenChange,
  building,
  residenceId,
}: BuildingFormDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (building) {
      setName(building.name);
      setAddress(building.address || "");
    } else {
      setName("");
      setAddress("");
    }
  }, [building, open]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("buildings").insert({
        name,
        address: address || null,
        residence_id: residenceId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast.success("Bâtiment créé avec succès");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!building) return;
      const { error } = await supabase
        .from("buildings")
        .update({
          name,
          address: address || null,
        })
        .eq("id", building.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      toast.success("Bâtiment mis à jour avec succès");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom du bâtiment est requis");
      return;
    }
    if (building) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {building ? "Modifier le bâtiment" : "Ajouter un bâtiment"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du bâtiment *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bâtiment A"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: 12 rue de la Paix"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : building ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
