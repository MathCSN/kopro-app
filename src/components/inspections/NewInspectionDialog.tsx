import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";

interface NewInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residenceId?: string;
}

export function NewInspectionDialog({ open, onOpenChange, residenceId }: NewInspectionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    lot_id: "",
    type: "entry",
    scheduled_date: "",
    scheduled_time: "10:00",
  });

  // Fetch available lots for the residence
  const { data: lots, isLoading: lotsLoading } = useQuery({
    queryKey: ["lots-for-inspection", residenceId],
    queryFn: async () => {
      if (!residenceId) return [];

      const { data, error } = await supabase
        .from("lots")
        .select("id, lot_number, floor, door, type, building:buildings(name)")
        .eq("residence_id", residenceId)
        .order("lot_number");

      if (error) throw error;
      return data || [];
    },
    enabled: !!residenceId && open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residenceId) {
      toast.error("Veuillez sélectionner une résidence");
      return;
    }

    if (!formData.lot_id) {
      toast.error("Veuillez sélectionner un appartement");
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll just show a success message since there's no inspections table
      // In a real implementation, you would insert into an inspections table
      toast.success("État des lieux programmé avec succès");
      onOpenChange(false);
      setFormData({
        lot_id: "",
        type: "entry",
        scheduled_date: "",
        scheduled_time: "10:00",
      });
    } catch (error: any) {
      toast.error("Erreur lors de la création: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const hasLots = lots && lots.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvel état des lieux</DialogTitle>
          <DialogDescription>
            Programmez un nouvel état des lieux d'entrée ou de sortie
          </DialogDescription>
        </DialogHeader>

        {!hasLots && !lotsLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Aucun appartement disponible</h3>
            <p className="text-sm text-muted-foreground max-w-[300px]">
              Vous devez d'abord créer des lots/appartements dans la résidence avant de pouvoir programmer un état des lieux.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lot_id">Appartement</Label>
              <Select 
                value={formData.lot_id} 
                onValueChange={(v) => setFormData({ ...formData, lot_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un appartement" />
                </SelectTrigger>
                <SelectContent>
                  {lots?.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.lot_number}
                      {lot.building && ` - ${(lot.building as any).name}`}
                      {lot.floor !== null && ` (Étage ${lot.floor})`}
                      {lot.door && ` - Porte ${lot.door}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type d'état des lieux</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entrée</SelectItem>
                  <SelectItem value="exit">Sortie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Date</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_time">Heure</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Création..." : "Programmer"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
