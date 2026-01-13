import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface NewAccountingEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residenceId?: string;
}

export function NewAccountingEntryDialog({ open, onOpenChange, residenceId }: NewAccountingEntryDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    label: "",
    reference: "",
    debit: "",
    credit: "",
    type: "debit",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residenceId) {
      toast.error("Veuillez sélectionner une résidence");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("accounting_lines").insert({
        residence_id: residenceId,
        date: formData.date,
        label: formData.label,
        reference: formData.reference || null,
        debit: formData.type === "debit" ? parseFloat(formData.debit) || 0 : null,
        credit: formData.type === "credit" ? parseFloat(formData.credit) || 0 : null,
      });

      if (error) throw error;

      toast.success("Écriture comptable créée avec succès");
      queryClient.invalidateQueries({ queryKey: ["accounting"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-stats"] });
      onOpenChange(false);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        label: "",
        reference: "",
        debit: "",
        credit: "",
        type: "debit",
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
          <DialogTitle>Nouvelle écriture comptable</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle écriture au journal comptable
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Débit (Dépense)</SelectItem>
                  <SelectItem value="credit">Crédit (Recette)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Libellé</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Description de l'écriture"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.type === "debit" ? formData.debit : formData.credit}
                onChange={(e) => 
                  setFormData({ 
                    ...formData, 
                    [formData.type === "debit" ? "debit" : "credit"]: e.target.value 
                  })
                }
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Référence</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                placeholder="N° facture, pièce..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Création..." : "Créer l'écriture"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
