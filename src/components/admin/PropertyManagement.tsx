import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, ChevronDown, Building2, Landmark, Home, Trash2, Edit, Users, MapPin } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BuildingFormDialog } from "./buildings/BuildingFormDialog";
import { LotFormDialog } from "./lots/LotFormDialog";
import { AssignLotDialog } from "./lots/AssignLotDialog";
import { BulkCreateDialog } from "./lots/BulkCreateDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Residence {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  created_at: string | null;
}

interface Building {
  id: string;
  name: string;
  address: string | null;
  residence_id: string;
}

interface Occupancy {
  id: string;
  type: string;
  is_active: boolean | null;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface Lot {
  id: string;
  lot_number: string;
  type: string | null;
  floor: number | null;
  door: string | null;
  surface: number | null;
  rooms: number | null;
  tantiemes: number | null;
  building_id: string | null;
  residence_id: string;
  notes: string | null;
  occupancies?: Occupancy[];
}

export function PropertyManagement() {
  const queryClient = useQueryClient();
  const [expandedResidenceId, setExpandedResidenceId] = useState<string | null>(null);
  const [expandedBuildingId, setExpandedBuildingId] = useState<string | null>(null);
  
  // Dialogs state
  const [residenceDialogOpen, setResidenceDialogOpen] = useState(false);
  const [editingResidence, setEditingResidence] = useState<Residence | null>(null);
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningLotId, setAssigningLotId] = useState<string | null>(null);
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false);
  
  // Delete dialogs
  const [deleteResidenceId, setDeleteResidenceId] = useState<string | null>(null);
  const [deleteBuildingId, setDeleteBuildingId] = useState<string | null>(null);
  const [deleteLotId, setDeleteLotId] = useState<string | null>(null);
  
  // Residence form state
  const [residenceForm, setResidenceForm] = useState({
    name: "",
    address: "",
    city: "",
    postal_code: "",
    country: "France"
  });

  // Queries
  const { data: residences = [], isLoading: loadingResidences } = useQuery({
    queryKey: ["residences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residences")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Residence[];
    }
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ["buildings", expandedResidenceId],
    queryFn: async () => {
      if (!expandedResidenceId) return [];
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .eq("residence_id", expandedResidenceId)
        .order("name");
      if (error) throw error;
      return data as Building[];
    },
    enabled: !!expandedResidenceId
  });

  const { data: lots = [] } = useQuery({
    queryKey: ["lots", expandedBuildingId, expandedResidenceId],
    queryFn: async () => {
      if (!expandedResidenceId || !expandedBuildingId) return [];
      const { data, error } = await supabase
        .from("lots")
        .select("*")
        .eq("residence_id", expandedResidenceId)
        .eq("building_id", expandedBuildingId)
        .order("lot_number");
      if (error) throw error;
      
      // Fetch occupancies separately
      const lotIds = data.map(l => l.id);
      if (lotIds.length === 0) return data as Lot[];
      
      const { data: occupancies } = await supabase
        .from("occupancies")
        .select("id, lot_id, type, is_active, user_id")
        .in("lot_id", lotIds)
        .eq("is_active", true);
      
      // Fetch profiles for active occupancies
      const userIds = [...new Set((occupancies || []).map(o => o.user_id))];
      let profiles: Record<string, { first_name: string | null; last_name: string | null; email: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", userIds);
        
        profiles = (profilesData || []).reduce((acc, p) => {
          acc[p.id] = { first_name: p.first_name, last_name: p.last_name, email: p.email };
          return acc;
        }, {} as Record<string, { first_name: string | null; last_name: string | null; email: string | null }>);
      }
      
      // Merge occupancies with lots
      return data.map(lot => ({
        ...lot,
        occupancies: (occupancies || [])
          .filter(o => o.lot_id === lot.id)
          .map(o => ({
            id: o.id,
            type: o.type,
            is_active: o.is_active,
            user: profiles[o.user_id] || null
          }))
      })) as Lot[];
    },
    enabled: !!expandedResidenceId && !!expandedBuildingId
  });

  // Get counts for each residence
  const { data: buildingCounts = {} } = useQuery({
    queryKey: ["building-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("residence_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach(b => {
        counts[b.residence_id] = (counts[b.residence_id] || 0) + 1;
      });
      return counts;
    }
  });

  const { data: lotCounts = { residences: {}, buildings: {} } } = useQuery({
    queryKey: ["lot-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lots")
        .select("residence_id, building_id");
      if (error) throw error;
      const residenceCounts: Record<string, number> = {};
      const buildingCounts: Record<string, number> = {};
      data.forEach(l => {
        residenceCounts[l.residence_id] = (residenceCounts[l.residence_id] || 0) + 1;
        if (l.building_id) {
          buildingCounts[l.building_id] = (buildingCounts[l.building_id] || 0) + 1;
        }
      });
      return { residences: residenceCounts, buildings: buildingCounts };
    }
  });

  // Mutations
  const saveResidenceMutation = useMutation({
    mutationFn: async (data: typeof residenceForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("residences")
          .update({ name: data.name, address: data.address, city: data.city, postal_code: data.postal_code, country: data.country })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("residences")
          .insert({ name: data.name, address: data.address, city: data.city, postal_code: data.postal_code, country: data.country });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residences"] });
      setResidenceDialogOpen(false);
      setEditingResidence(null);
      setResidenceForm({ name: "", address: "", city: "", postal_code: "", country: "France" });
      toast.success(editingResidence ? "Résidence modifiée" : "Résidence créée");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde")
  });

  const deleteResidenceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: buildingsData } = await supabase
        .from("buildings")
        .select("id")
        .eq("residence_id", id)
        .limit(1);
      if (buildingsData && buildingsData.length > 0) {
        throw new Error("Supprimez d'abord les bâtiments de cette résidence");
      }
      const { data: lotsData } = await supabase
        .from("lots")
        .select("id")
        .eq("residence_id", id)
        .limit(1);
      if (lotsData && lotsData.length > 0) {
        throw new Error("Supprimez d'abord les lots de cette résidence");
      }
      await supabase.from("user_roles").delete().eq("residence_id", id);
      const { error } = await supabase.from("residences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residences"] });
      queryClient.invalidateQueries({ queryKey: ["building-counts"] });
      queryClient.invalidateQueries({ queryKey: ["lot-counts"] });
      if (expandedResidenceId === deleteResidenceId) {
        setExpandedResidenceId(null);
        setExpandedBuildingId(null);
      }
      setDeleteResidenceId(null);
      toast.success("Résidence supprimée");
    },
    onError: (error: Error) => toast.error(error.message || "Erreur lors de la suppression")
  });

  const deleteBuildingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: lotsData } = await supabase
        .from("lots")
        .select("id")
        .eq("building_id", id)
        .limit(1);
      if (lotsData && lotsData.length > 0) {
        throw new Error("Supprimez d'abord les lots de ce bâtiment");
      }
      const { error } = await supabase.from("buildings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      queryClient.invalidateQueries({ queryKey: ["building-counts"] });
      if (expandedBuildingId === deleteBuildingId) {
        setExpandedBuildingId(null);
      }
      setDeleteBuildingId(null);
      toast.success("Bâtiment supprimé");
    },
    onError: (error: Error) => toast.error(error.message || "Erreur lors de la suppression")
  });

  const deleteLotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      queryClient.invalidateQueries({ queryKey: ["lot-counts"] });
      setDeleteLotId(null);
      toast.success("Lot supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression")
  });

  // Handlers
  const toggleResidence = (id: string) => {
    if (expandedResidenceId === id) {
      setExpandedResidenceId(null);
      setExpandedBuildingId(null);
    } else {
      setExpandedResidenceId(id);
      setExpandedBuildingId(null);
    }
  };

  const toggleBuilding = (id: string) => {
    setExpandedBuildingId(expandedBuildingId === id ? null : id);
  };

  const openEditResidence = (residence: Residence) => {
    setEditingResidence(residence);
    setResidenceForm({
      name: residence.name,
      address: residence.address || "",
      city: residence.city || "",
      postal_code: residence.postal_code || "",
      country: residence.country || "France"
    });
    setResidenceDialogOpen(true);
  };

  const openNewResidence = () => {
    setEditingResidence(null);
    setResidenceForm({ name: "", address: "", city: "", postal_code: "", country: "France" });
    setResidenceDialogOpen(true);
  };

  const openEditBuilding = (building: Building) => {
    setEditingBuilding(building);
    setBuildingDialogOpen(true);
  };

  const openNewBuilding = () => {
    setEditingBuilding(null);
    setBuildingDialogOpen(true);
  };

  const openEditLot = (lot: Lot) => {
    setEditingLot(lot);
    setLotDialogOpen(true);
  };

  const openNewLot = () => {
    setEditingLot(null);
    setLotDialogOpen(true);
  };

  const openAssignDialog = (lotId: string) => {
    setAssigningLotId(lotId);
    setAssignDialogOpen(true);
  };

  if (loadingResidences) {
    return <div className="p-6 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gestion du patrimoine</h2>
          <p className="text-sm text-muted-foreground">
            Résidences → Bâtiments → Lots
          </p>
        </div>
        <Button type="button" onClick={(e) => { e.preventDefault(); openNewResidence(); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle résidence
        </Button>
      </div>


      {/* Hierarchical list */}
      <div className="space-y-2">
        {residences.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-lg">
            Aucune résidence. Créez-en une pour commencer.
          </div>
        ) : (
          residences.map((residence) => (
            <div key={residence.id} className="border rounded-lg overflow-hidden">
              {/* Residence header */}
              <div
                className={cn(
                  "flex items-center justify-between p-4 cursor-pointer transition-colors",
                  expandedResidenceId === residence.id ? "bg-accent" : "hover:bg-muted/50"
                )}
                onClick={() => toggleResidence(residence.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedResidenceId === residence.id ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-medium">{residence.name}</span>
                    {residence.city && (
                      <span className="text-sm text-muted-foreground ml-2">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {residence.city}
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {buildingCounts[residence.id] || 0} bâtiment(s)
                  </Badge>
                  <Badge variant="outline">
                    {lotCounts.residences[residence.id] || 0} lot(s)
                  </Badge>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => openEditResidence(residence)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteResidenceId(residence.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Expanded residence content - Buildings */}
              {expandedResidenceId === residence.id && (
                <div className="border-t bg-muted/20">
                  <div className="p-3 border-b flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground pl-8">
                      Bâtiments de {residence.name}
                    </span>
                    <Button size="sm" variant="outline" onClick={openNewBuilding}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter un bâtiment
                    </Button>
                  </div>

                  <div className="pl-6">
                    {buildings.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        Aucun bâtiment dans cette résidence
                      </div>
                    ) : (
                      buildings.map((building) => (
                        <div key={building.id} className="border-l-2 border-primary/20">
                          {/* Building header */}
                          <div
                            className={cn(
                              "flex items-center justify-between p-3 cursor-pointer transition-colors",
                              expandedBuildingId === building.id ? "bg-accent/50" : "hover:bg-muted/30"
                            )}
                            onClick={() => toggleBuilding(building.id)}
                          >
                            <div className="flex items-center gap-3">
                              {expandedBuildingId === building.id ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <Landmark className="h-4 w-4 text-orange-500" />
                              <span className="font-medium">{building.name}</span>
                              {building.address && (
                                <span className="text-sm text-muted-foreground">
                                  - {building.address}
                                </span>
                              )}
                              <Badge variant="outline" className="ml-2">
                                {lotCounts.buildings[building.id] || 0} lot(s)
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" onClick={() => openEditBuilding(building)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteBuildingId(building.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          {/* Expanded building content - Lots */}
                          {expandedBuildingId === building.id && (
                            <div className="border-t bg-background">
                              <div className="p-3 border-b flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground pl-6">
                                  Lots du bâtiment {building.name}
                                </span>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => setBulkCreateOpen(true)}>
                                    Création en masse
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={openNewLot}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Ajouter un lot
                                  </Button>
                                </div>
                              </div>

                              <div className="pl-8 pr-4 py-2">
                                {lots.length === 0 ? (
                                  <div className="text-center py-4 text-muted-foreground text-sm">
                                    Aucun lot dans ce bâtiment
                                  </div>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Lot</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Étage</TableHead>
                                        <TableHead>Surface</TableHead>
                                        <TableHead>Résident</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {lots.map((lot) => {
                                        const activeOccupancy = lot.occupancies?.find(o => o.is_active && o.user);
                                        const occupantName = activeOccupancy?.user 
                                          ? `${activeOccupancy.user.first_name || ""} ${activeOccupancy.user.last_name || ""}`.trim() || activeOccupancy.user.email || "—"
                                          : null;
                                        const occupantInitials = activeOccupancy?.user
                                          ? (activeOccupancy.user.first_name && activeOccupancy.user.last_name 
                                              ? `${activeOccupancy.user.first_name[0]}${activeOccupancy.user.last_name[0]}`.toUpperCase()
                                              : activeOccupancy.user.email?.[0]?.toUpperCase() || "?")
                                          : null;
                                        
                                        return (
                                          <TableRow 
                                            key={lot.id} 
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => openAssignDialog(lot.id)}
                                          >
                                            <TableCell className="font-medium">{lot.lot_number}</TableCell>
                                            <TableCell>
                                              <Badge variant="outline">{lot.type || "—"}</Badge>
                                            </TableCell>
                                            <TableCell>{lot.floor ?? "—"}</TableCell>
                                            <TableCell>{lot.surface ? `${lot.surface} m²` : "—"}</TableCell>
                                            <TableCell>
                                              {activeOccupancy ? (
                                                <div className="flex items-center gap-2">
                                                  <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-xs">{occupantInitials}</AvatarFallback>
                                                  </Avatar>
                                                  <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{occupantName}</span>
                                                    <Badge variant="secondary" className="w-fit text-xs">
                                                      {activeOccupancy.type === "owner" ? "Propriétaire" : 
                                                       activeOccupancy.type === "tenant" ? "Locataire" : "Occupant"}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              ) : (
                                                <span className="text-muted-foreground italic text-sm">Vacant</span>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                              <div className="flex justify-end gap-1">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => openAssignDialog(lot.id)}>
                                                  <Users className="h-4 w-4" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => openEditLot(lot)}>
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteLotId(lot.id)}>
                                                  <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Residence Dialog */}
      <Dialog open={residenceDialogOpen} onOpenChange={setResidenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingResidence ? "Modifier la résidence" : "Nouvelle résidence"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={residenceForm.name}
                onChange={(e) => setResidenceForm({ ...residenceForm, name: e.target.value })}
                placeholder="Ex: Résidence Les Jardins"
              />
            </div>
            <div>
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={residenceForm.address}
                onChange={(e) => setResidenceForm({ ...residenceForm, address: e.target.value })}
                placeholder="12 rue des Fleurs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={residenceForm.city}
                  onChange={(e) => setResidenceForm({ ...residenceForm, city: e.target.value })}
                  placeholder="Paris"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Code postal</Label>
                <Input
                  id="postal_code"
                  value={residenceForm.postal_code}
                  onChange={(e) => setResidenceForm({ ...residenceForm, postal_code: e.target.value })}
                  placeholder="75001"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResidenceDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => saveResidenceMutation.mutate({ ...residenceForm, id: editingResidence?.id })}
              disabled={!residenceForm.name || saveResidenceMutation.isPending}
            >
              {editingResidence ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Building Dialog */}
      {expandedResidenceId && (
        <BuildingFormDialog
          open={buildingDialogOpen}
          onOpenChange={setBuildingDialogOpen}
          building={editingBuilding}
          residenceId={expandedResidenceId}
        />
      )}

      {/* Lot Dialog */}
      {expandedResidenceId && (
        <LotFormDialog
          open={lotDialogOpen}
          onOpenChange={setLotDialogOpen}
          lot={editingLot}
          residenceId={expandedResidenceId}
          buildings={buildings}
        />
      )}

      {/* Assign Dialog */}
      <AssignLotDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        preselectedLotId={assigningLotId}
        residenceId={expandedResidenceId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["lots"] });
          queryClient.invalidateQueries({ queryKey: ["occupancies"] });
        }}
      />

      {/* Bulk Create Dialog */}
      {expandedResidenceId && (
        <BulkCreateDialog
          open={bulkCreateOpen}
          onOpenChange={setBulkCreateOpen}
          residenceId={expandedResidenceId}
          buildings={buildings}
        />
      )}

      {/* Delete Residence Confirmation */}
      <AlertDialog open={!!deleteResidenceId} onOpenChange={() => setDeleteResidenceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la résidence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Assurez-vous d'avoir supprimé tous les bâtiments et lots avant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteResidenceId && deleteResidenceMutation.mutate(deleteResidenceId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Building Confirmation */}
      <AlertDialog open={!!deleteBuildingId} onOpenChange={() => setDeleteBuildingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le bâtiment ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Assurez-vous d'avoir supprimé tous les lots avant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBuildingId && deleteBuildingMutation.mutate(deleteBuildingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lot Confirmation */}
      <AlertDialog open={!!deleteLotId} onOpenChange={() => setDeleteLotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le lot ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLotId && deleteLotMutation.mutate(deleteLotId)}
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
