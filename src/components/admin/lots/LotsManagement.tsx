import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building2, Trash2, Edit, Upload, Home } from "lucide-react";
import { toast } from "sonner";
import { LotFormDialog } from "./LotFormDialog";
import { BulkCreateDialog } from "./BulkCreateDialog";
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

interface Lot {
  id: string;
  lot_number: string;
  floor: number | null;
  door: string | null;
  surface: number | null;
  rooms: number | null;
  tantiemes: number | null;
  type: string | null;
  notes: string | null;
  building_id: string | null;
  residence_id: string;
  join_code: string | null;
  buildings?: { name: string } | null;
}

export function LotsManagement() {
  const { selectedResidence } = useResidence();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [deletingLotId, setDeletingLotId] = useState<string | null>(null);

  const { data: lots, isLoading } = useQuery({
    queryKey: ["lots", selectedResidence?.id],
    queryFn: async () => {
      if (!selectedResidence?.id) return [];
      const { data, error } = await supabase
        .from("lots")
        .select("*, buildings(name)")
        .eq("residence_id", selectedResidence.id)
        .order("floor", { ascending: true })
        .order("lot_number", { ascending: true });
      if (error) throw error;
      return data as Lot[];
    },
    enabled: !!selectedResidence?.id,
  });

  const { data: buildings } = useQuery({
    queryKey: ["buildings", selectedResidence?.id],
    queryFn: async () => {
      if (!selectedResidence?.id) return [];
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .eq("residence_id", selectedResidence.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedResidence?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (lotId: string) => {
      const { error } = await supabase.from("lots").delete().eq("id", lotId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      toast.success("Lot supprimé avec succès");
      setDeletingLotId(null);
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression: " + error.message);
    },
  });

  const filteredLots = lots?.filter(
    (lot) =>
      lot.lot_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.door?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lot.buildings?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTantiemes = lots?.reduce((sum, lot) => sum + (lot.tantiemes || 0), 0) || 0;

  if (!selectedResidence) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Sélectionnez une résidence pour gérer les lots</p>
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
            placeholder="Rechercher un lot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Création en masse
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un lot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{lots?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total lots</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalTantiemes.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total tantièmes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{buildings?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Bâtiments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des lots</CardTitle>
          <CardDescription>
            {filteredLots?.length || 0} lot(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredLots?.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun lot trouvé</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>
                Créer le premier lot
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Lot</TableHead>
                    <TableHead>Étage</TableHead>
                    <TableHead>Porte</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Surface</TableHead>
                    <TableHead>Pièces</TableHead>
                    <TableHead>Tantièmes</TableHead>
                    <TableHead>Bâtiment</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLots?.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.lot_number}</TableCell>
                      <TableCell>{lot.floor ?? "-"}</TableCell>
                      <TableCell>{lot.door || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lot.type || "Appartement"}</Badge>
                      </TableCell>
                      <TableCell>{lot.surface ? `${lot.surface} m²` : "-"}</TableCell>
                      <TableCell>{lot.rooms ?? "-"}</TableCell>
                      <TableCell>{lot.tantiemes?.toLocaleString() ?? "-"}</TableCell>
                      <TableCell>{lot.buildings?.name || "-"}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {lot.join_code || "-"}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingLot(lot)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingLotId(lot.id)}
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

      <LotFormDialog
        open={isFormOpen || !!editingLot}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingLot(null);
          }
        }}
        lot={editingLot}
        residenceId={selectedResidence.id}
        buildings={buildings || []}
      />

      <BulkCreateDialog
        open={isBulkOpen}
        onOpenChange={setIsBulkOpen}
        residenceId={selectedResidence.id}
        buildings={buildings || []}
      />

      <AlertDialog open={!!deletingLotId} onOpenChange={() => setDeletingLotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce lot ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingLotId && deleteMutation.mutate(deletingLotId)}
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
