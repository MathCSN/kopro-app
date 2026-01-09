import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Building2, Trash2, Edit, Upload, Home, X, Download, Users } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/exportCsv";
import { LotFormDialog } from "./LotFormDialog";
import { BulkCreateDialog } from "./BulkCreateDialog";
import { TenantManagementDialog } from "./TenantManagementDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface Occupant {
  id: string;
  type: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

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
  occupants?: Occupant[];
}

export function LotsManagement() {
  const { selectedResidence } = useResidence();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [managingTenantLot, setManagingTenantLot] = useState<Lot | null>(null);
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
      toast.success("Appartement supprimé avec succès");
      setDeletingLotId(null);
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression: " + error.message);
    },
  });

  const filteredLots = lots?.filter((lot) => {
    // Filter by building
    if (selectedBuildingId && lot.building_id !== selectedBuildingId) {
      return false;
    }
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        lot.lot_number.toLowerCase().includes(search) ||
        lot.door?.toLowerCase().includes(search) ||
        lot.buildings?.name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const totalTantiemes = lots?.reduce((sum, lot) => sum + (lot.tantiemes || 0), 0) || 0;
  const filteredTantiemes = filteredLots?.reduce((sum, lot) => sum + (lot.tantiemes || 0), 0) || 0;

  if (!selectedResidence) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Sélectionnez une résidence pour gérer les appartements</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un appt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedBuildingId || "all"}
                onValueChange={(value) => setSelectedBuildingId(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Tous les bâtiments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les bâtiments</SelectItem>
                  {buildings?.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBuildingId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedBuildingId(null)}
                  className="h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!filteredLots || filteredLots.length === 0) {
                  toast.error("Aucun appartement à exporter");
                  return;
                }
                exportToCsv(
                  filteredLots.map((lot) => ({
                    lot_number: lot.lot_number,
                    floor: lot.floor,
                    door: lot.door,
                    type: lot.type || "Appartement",
                    surface: lot.surface,
                    rooms: lot.rooms,
                    tantiemes: lot.tantiemes,
                    building: lot.buildings?.name || "",
                    join_code: lot.join_code,
                  })),
                  `lots-${selectedResidence.name.replace(/\s+/g, "-").toLowerCase()}`,
                  [
                    { key: "lot_number", header: "N° Lot" },
                    { key: "floor", header: "Étage" },
                    { key: "door", header: "Porte" },
                    { key: "type", header: "Type" },
                    { key: "surface", header: "Surface (m²)" },
                    { key: "rooms", header: "Pièces" },
                    { key: "tantiemes", header: "Tantièmes" },
                    { key: "building", header: "Bâtiment" },
                    { key: "join_code", header: "Code" },
                  ]
                );
                toast.success("Export CSV téléchargé");
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exporter</span>
            </Button>
            <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Création en masse</span>
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ajouter</span>
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Ajouter</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{lots?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Total appts</p>
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
          <CardTitle>Liste des appartements</CardTitle>
          <CardDescription>
            {filteredLots?.length || 0} appt(s) trouvé(s)
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
              <p className="text-muted-foreground">Aucun appartement trouvé</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsFormOpen(true)}>
                Créer le premier appt
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Appt</TableHead>
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
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setManagingTenantLot(lot)}
                            title="Gérer les locataires"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
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

      {managingTenantLot && selectedResidence && (
        <TenantManagementDialog
          open={!!managingTenantLot}
          onOpenChange={(open) => {
            if (!open) setManagingTenantLot(null);
          }}
          lotId={managingTenantLot.id}
          lotNumber={managingTenantLot.lot_number}
          residenceId={selectedResidence.id}
          residenceName={selectedResidence.name}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["lots"] })}
        />
      )}

      <AlertDialog open={!!deletingLotId} onOpenChange={() => setDeletingLotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet appartement ? Cette action est irréversible.
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
