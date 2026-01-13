import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export interface WorkOrderFilters {
  status: string;
  priority: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

interface WorkOrdersFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: WorkOrderFilters;
  onFiltersChange: (filters: WorkOrderFilters) => void;
}

export function WorkOrdersFilterSheet({ open, onOpenChange, filters, onFiltersChange }: WorkOrdersFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<WorkOrderFilters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters: WorkOrderFilters = {
      status: "all",
      priority: "all",
      category: "all",
      dateFrom: "",
      dateTo: "",
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtrer les ordres de service</SheetTitle>
          <SheetDescription>
            Affinez votre recherche avec les filtres ci-dessous
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={localFilters.status} onValueChange={(v) => setLocalFilters({ ...localFilters, status: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select value={localFilters.priority} onValueChange={(v) => setLocalFilters({ ...localFilters, priority: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={localFilters.category} onValueChange={(v) => setLocalFilters({ ...localFilters, category: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="plumbing">Plomberie</SelectItem>
                <SelectItem value="electrical">Électricité</SelectItem>
                <SelectItem value="cleaning">Nettoyage</SelectItem>
                <SelectItem value="security">Sécurité</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date de création</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Du</Label>
                <Input
                  type="date"
                  value={localFilters.dateFrom}
                  onChange={(e) => setLocalFilters({ ...localFilters, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Au</Label>
                <Input
                  type="date"
                  value={localFilters.dateTo}
                  onChange={(e) => setLocalFilters({ ...localFilters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Réinitialiser
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Appliquer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
