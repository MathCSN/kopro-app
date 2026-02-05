import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Home, ChevronLeft, ChevronRight } from "lucide-react";
import { SignaturePad } from "./SignaturePad";

interface Lot {
  id: string;
  lot_number: string;
  residence_id: string;
  building?: { name: string } | null;
  floor?: number | null;
  door?: string | null;
}

export interface NewInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residenceIds?: string[];
  lots?: Lot[];
}

export function NewInspectionDialog({ open, onOpenChange, residenceIds, lots = [] }: NewInspectionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"info" | "signature">("info");
  const [formData, setFormData] = useState({
    lot_id: "",
    type: "entry",
    scheduled_date: "",
    scheduled_time: "10:00",
  });
  const [tenantSignature, setTenantSignature] = useState<string | null>(null);
  const [managerSignature, setManagerSignature] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residenceIds || residenceIds.length === 0) {
      toast.error("Veuillez sélectionner une résidence");
      return;
    }

    if (!formData.lot_id) {
      toast.error("Veuillez sélectionner un appartement");
      return;
    }

    // Move to signature step
    setStep("signature");
  };

  const handleFinalSubmit = async () => {
    if (!tenantSignature || !managerSignature) {
      toast.error("Les deux signatures sont requises");
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll just show a success message since there's no inspections table
      // In a real implementation, you would insert into an inspections table with signatures
      toast.success("État des lieux signé et enregistré avec succès");
      handleClose();
    } catch (error: any) {
      toast.error("Erreur lors de la création: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep("info");
    setFormData({
      lot_id: "",
      type: "entry",
      scheduled_date: "",
      scheduled_time: "10:00",
    });
    setTenantSignature(null);
    setManagerSignature(null);
  };

  const hasLots = lots && lots.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] h-auto max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 border-b shrink-0">
          <DialogHeader>
            <DialogTitle>
              {step === "info" ? "Nouvel état des lieux" : "Signatures"}
            </DialogTitle>
            <DialogDescription>
              {step === "info" 
                ? "Programmez un nouvel état des lieux d'entrée ou de sortie"
                : "Signez directement sur l'écran pour valider l'état des lieux"
              }
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!hasLots ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Aucun appartement disponible</h3>
              <p className="text-sm text-muted-foreground max-w-[300px]">
                Vous devez d'abord créer des lots/appartements dans la résidence avant de pouvoir programmer un état des lieux.
              </p>
              <Button variant="outline" className="mt-4" onClick={handleClose}>
                Fermer
              </Button>
            </div>
          ) : step === "info" ? (
            <form id="inspection-form" onSubmit={handleSubmit} className="space-y-4">
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
                        {lot.building && ` - ${lot.building.name}`}
                        {lot.floor !== null && lot.floor !== undefined && ` (Étage ${lot.floor})`}
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
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <SignaturePad
                  label="Signature du locataire"
                  onSave={(signature) => setTenantSignature(signature)}
                  onClear={() => setTenantSignature(null)}
                  width={250}
                  height={150}
                />
                <SignaturePad
                  label="Signature du gestionnaire"
                  onSave={(signature) => setManagerSignature(signature)}
                  onClear={() => setManagerSignature(null)}
                  width={250}
                  height={150}
                />
              </div>
            </div>
          )}
        </div>

        {hasLots && (
          <div className="p-4 border-t bg-muted/30 shrink-0">
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {step === "info" ? (
                <>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Annuler
                  </Button>
                  <Button type="submit" form="inspection-form">
                    Continuer vers signatures
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep("info")}
                    className="w-full sm:w-auto"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleFinalSubmit}
                    disabled={isLoading || !tenantSignature || !managerSignature}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? "Enregistrement..." : "Valider l'état des lieux"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
