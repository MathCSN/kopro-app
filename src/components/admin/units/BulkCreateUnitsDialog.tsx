import { useState } from "react";
import { Plus, Loader2, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { toast } from "sonner";

interface BulkCreateUnitsDialogProps {
  onCreated?: () => void;
}

export function BulkCreateUnitsDialog({ onCreated }: BulkCreateUnitsDialogProps) {
  const { selectedResidence } = useResidence();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [count, setCount] = useState("10");
  const [floor, setFloor] = useState("1");
  const [startNumber, setStartNumber] = useState("1");
  const [endNumber, setEndNumber] = useState("");
  const [prefix, setPrefix] = useState("");
  const [type, setType] = useState("T2");
  const [building, setBuilding] = useState("");
  const [surface, setSurface] = useState("");
  const [rooms, setRooms] = useState("");
  const [rentTarget, setRentTarget] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResidence) {
      toast.error("Veuillez sélectionner une résidence");
      return;
    }

    const start = parseInt(startNumber) || 1;
    const end = endNumber ? parseInt(endNumber) : start + parseInt(count) - 1;
    const numUnits = end - start + 1;

    if (numUnits <= 0 || numUnits > 100) {
      toast.error("Nombre d'appartements invalide (max 100)");
      return;
    }

    setLoading(true);

    try {
      const units = [];
      for (let i = start; i <= end; i++) {
        const door = prefix ? `${prefix}${i}` : String(i);
        units.push({
          door,
          floor: floor ? parseInt(floor) : null,
          type: type || null,
          surface: surface ? parseFloat(surface) : null,
          rooms: rooms ? parseInt(rooms) : null,
          rent_target: rentTarget ? parseFloat(rentTarget) : null,
          building: building || null,
          status: "vacant" as const,
          residence_id: selectedResidence.id,
        });
      }

      const { error } = await supabase.from("units").insert(units);

      if (error) throw error;

      toast.success(`${units.length} biens créés avec succès`);
      setOpen(false);
      resetForm();
      onCreated?.();
    } catch (error: any) {
      console.error("Error creating units:", error);
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCount("10");
    setFloor("1");
    setStartNumber("1");
    setEndNumber("");
    setPrefix("");
    setType("T2");
    setBuilding("");
    setSurface("");
    setRooms("");
    setRentTarget("");
  };

  const calculatedCount = endNumber 
    ? Math.max(0, (parseInt(endNumber) || 0) - (parseInt(startNumber) || 0) + 1)
    : parseInt(count) || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Building2 className="h-4 w-4 mr-2" />
          Ajouter en masse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Création de biens en masse
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Plage de numéros */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Plage de numéros</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="prefix" className="text-xs text-muted-foreground">Préfixe</Label>
                <Input
                  id="prefix"
                  placeholder="Ex: A"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="startNumber" className="text-xs text-muted-foreground">De</Label>
                <Input
                  id="startNumber"
                  type="number"
                  value={startNumber}
                  onChange={(e) => setStartNumber(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endNumber" className="text-xs text-muted-foreground">À</Label>
                <Input
                  id="endNumber"
                  type="number"
                  value={endNumber}
                  onChange={(e) => setEndNumber(e.target.value)}
                  placeholder={String((parseInt(startNumber) || 1) + parseInt(count) - 1)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {calculatedCount} bien{calculatedCount > 1 ? "s" : ""} seront créés : {prefix}{startNumber} → {prefix}{endNumber || ((parseInt(startNumber) || 1) + parseInt(count) - 1)}
            </p>
          </div>

          {/* Localisation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Étage</Label>
              <Input
                id="floor"
                type="number"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building">Bâtiment</Label>
              <Input
                id="building"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="Ex: Bâtiment A"
              />
            </div>
          </div>

          {/* Caractéristiques */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="T1">T1</SelectItem>
                  <SelectItem value="T2">T2</SelectItem>
                  <SelectItem value="T3">T3</SelectItem>
                  <SelectItem value="T4">T4</SelectItem>
                  <SelectItem value="T5">T5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="surface">Surface (m²)</Label>
              <Input
                id="surface"
                type="number"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rooms">Pièces</Label>
              <Input
                id="rooms"
                type="number"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                placeholder="3"
              />
            </div>
          </div>

          {/* Loyer cible */}
          <div className="space-y-2">
            <Label htmlFor="rentTarget">Loyer cible (€/mois)</Label>
            <Input
              id="rentTarget"
              type="number"
              value={rentTarget}
              onChange={(e) => setRentTarget(e.target.value)}
              placeholder="800"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || calculatedCount <= 0}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer {calculatedCount} bien{calculatedCount > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
