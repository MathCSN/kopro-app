import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface NewCoproCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residenceId?: string;
}

export function NewCoproCallDialog({ open, onOpenChange, residenceId }: NewCoproCallDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    call_type: "quarterly",
    quarter: "1",
    due_date: "",
    total_amount: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residenceId) {
      toast.error("Veuillez sélectionner une résidence");
      return;
    }

    setIsLoading(true);
    try {
      // Generate call number
      const year = new Date().getFullYear();
      const callNumber = `AF-${year}-${formData.quarter.padStart(2, "0")}`;

      const { error } = await supabase.from("copro_calls").insert({
        residence_id: residenceId,
        label: formData.label,
        call_number: callNumber,
        call_type: formData.call_type,
        quarter: parseInt(formData.quarter),
        due_date: formData.due_date,
        total_amount: parseFloat(formData.total_amount) || 0,
        status: "draft",
      });

      if (error) throw error;

      toast.success("Appel de fonds créé avec succès");
      queryClient.invalidateQueries({ queryKey: ["copro-calls"] });
      queryClient.invalidateQueries({ queryKey: ["syndic-stats"] });
      onOpenChange(false);
      setFormData({
        label: "",
        call_type: "quarterly",
        quarter: "1",
        due_date: "",
        total_amount: "",
      });
    } catch (error: any) {
      toast.error("Erreur lors de la création: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvel appel de fonds</DialogTitle>
          <DialogDescription>
            Créez un nouvel appel de fonds pour la copropriété
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Libellé</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Ex: Appel de charges Q1 2026"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="call_type">Type d'appel</Label>
              <Select value={formData.call_type} onValueChange={(v) => setFormData({ ...formData, call_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Trimestriel</SelectItem>
                  <SelectItem value="exceptional">Exceptionnel</SelectItem>
                  <SelectItem value="works">Travaux</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quarter">Trimestre</Label>
              <Select value={formData.quarter} onValueChange={(v) => setFormData({ ...formData, quarter: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">T1 (Jan-Mar)</SelectItem>
                  <SelectItem value="2">T2 (Avr-Juin)</SelectItem>
                  <SelectItem value="3">T3 (Juil-Sep)</SelectItem>
                  <SelectItem value="4">T4 (Oct-Déc)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Date d'échéance</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_amount">Montant total (€)</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Création..." : "Créer l'appel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
