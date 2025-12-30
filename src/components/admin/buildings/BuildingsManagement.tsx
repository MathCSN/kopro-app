import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Building2, Trash2, Edit, Home } from "lucide-react";
import { toast } from "sonner";
import { BuildingFormDialog } from "./BuildingFormDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Building {
  id: string;
  name: string;
  address: string | null;
  residence_id: string;
  created_at: string | null;
}

export function BuildingsManagement() {
  const { selectedResidence } = useResidence();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [deletingBuildingId, setDeletingBuildingId] = useState<string | null>(null);

  const { data: buildings, isLoading } = useQuery({
    queryKey: ["buildings", selectedResidence?.id],
    queryFn: async () => {
      if (!selectedResidence?.id) return [];
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .eq("residence_id", selectedResidence.id)
        .order("name");
      if (error) throw error;
      return data as Building[];
    },
    enabled: !!selectedResidence?.id,
  });

  const { data: lotsCount } = useQuery({
    queryKey: ["lots-count-by-building", selectedResidence?.id],
    queryFn: async () => {
      if (!selectedResidence?.id) return {};
      const { data, error } = await supabase
        .from("lots")
        .select("building_id")
        .eq("residence_id", selectedResidence.id);
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach((lot) => {
        if (lot.building_id) {
          counts[lot.building_id] = (counts[lot.building_id] || 0) + 1;
        }
      });
      return counts;
    },
    enabled: !!selectedResidence?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (buildingId: string) => {
      // Check if building has lots
      const { data: lots } = await supabase
        .from("lots")
        .select("id")
        .eq("building_id", buildingId)
        .limit(1);
      
      if (lots && lots.length > 0) {
        throw new Error("Ce bâtiment contient des lots. Veuillez d'abord réassigner ou supprimer les lots.");
      }

      const { error } = await supabase.from("buildings").delete().eq("id", buildingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      toast.success("Bâtiment supprimé avec succès");
      setDeletingBuildingId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredBuildings = buildings?.filter(
    (building) =>
      building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      building.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedResidence) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Sélectionnez une résidence pour gérer les bâtiments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un bâtiment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un bâtiment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{buildings?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total bâtiments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Object.values(lotsCount || {}).reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Lots assignés</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des bâtiments</CardTitle>
          <CardDescription>
            {filteredBuildings?.length || 0} bâtiment(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredBuildings?.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun bâtiment trouvé</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>
                Créer le premier bâtiment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Nombre de lots</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBuildings?.map((building) => (
                    <TableRow key={building.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {building.name}
                        </div>
                      </TableCell>
                      <TableCell>{building.address || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          {lotsCount?.[building.id] || 0} lot(s)
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingBuilding(building)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingBuildingId(building.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <BuildingFormDialog
        open={isFormOpen || !!editingBuilding}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingBuilding(null);
          }
        }}
        building={editingBuilding}
        residenceId={selectedResidence.id}
      />

      <AlertDialog open={!!deletingBuildingId} onOpenChange={() => setDeletingBuildingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce bâtiment ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBuildingId && deleteMutation.mutate(deletingBuildingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
