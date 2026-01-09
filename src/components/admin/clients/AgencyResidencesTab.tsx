import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Building2, 
  MapPin, 
  Home,
  Edit,
  Trash2,
  QrCode,
  ChevronDown,
  ChevronRight,
  User,
  Layers,
  Users
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ResidenceFormDialog } from "./ResidenceFormDialog";
import { ResidenceQRDialog } from "@/components/residence/ResidenceQRDialog";
import { BuildingFormDialog } from "@/components/admin/buildings/BuildingFormDialog";
import { LotFormDialog } from "@/components/admin/lots/LotFormDialog";
import { BulkCreateDialog } from "@/components/admin/lots/BulkCreateDialog";
import { TenantManagementDialog } from "@/components/admin/lots/TenantManagementDialog";

interface AgencyResidencesTabProps {
  agencyId: string;
}

interface Lot {
  id: string;
  lot_number: string;
  type: string | null;
  floor: number | null;
  surface: number | null;
  rooms: number | null;
  building_id: string | null;
  door: string | null;
  tantiemes: number | null;
  notes: string | null;
  primary_resident?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface Building {
  id: string;
  name: string;
  address: string | null;
  lots: Lot[];
}

interface Residence {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  buildings: Building[];
  unassignedLots: Lot[];
}

export function AgencyResidencesTab({ agencyId }: AgencyResidencesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Expansion states
  const [expandedResidences, setExpandedResidences] = useState<Set<string>>(new Set());
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());

  // Residence dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResidence, setEditingResidence] = useState<any>(null);
  const [deletingResidence, setDeletingResidence] = useState<any>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedQrResidence, setSelectedQrResidence] = useState<{ id: string; name: string } | null>(null);

  // Building & Lot dialog states
  const [buildingDialogOpen, setBuildingDialogOpen] = useState(false);
  const [selectedResidenceId, setSelectedResidenceId] = useState<string | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null);
  const [deletingLot, setDeletingLot] = useState<Lot | null>(null);
  const [tenantManagementLot, setTenantManagementLot] = useState<{ lot: Lot; residenceId: string; residenceName: string } | null>(null);

  const { data: residences = [], isLoading, refetch } = useQuery({
    queryKey: ["agency-residences-full", agencyId],
    queryFn: async () => {
      // Get residences
      const { data: residencesData, error: residencesError } = await supabase
        .from("residences")
        .select("id, name, address, city, postal_code")
        .eq("agency_id", agencyId)
        .order("name");

      if (residencesError) throw residencesError;

      const residenceIds = residencesData.map(r => r.id);
      if (residenceIds.length === 0) return [];

      // Get buildings
      const { data: buildings } = await supabase
        .from("buildings")
        .select("id, name, address, residence_id")
        .in("residence_id", residenceIds)
        .order("name");

      // Get lots with primary resident
      const { data: lots } = await supabase
        .from("lots")
        .select(`
          id,
          lot_number,
          type,
          floor,
          surface,
          rooms,
          building_id,
          residence_id,
          primary_resident_id,
          door,
          tantiemes,
          notes
        `)
        .in("residence_id", residenceIds)
        .order("lot_number");

      // Get profiles for primary residents
      const residentIds = (lots || [])
        .map(l => l.primary_resident_id)
        .filter(Boolean) as string[];
      
      const { data: profiles } = residentIds.length > 0 
        ? await supabase.from("profiles").select("id, first_name, last_name").in("id", residentIds)
        : { data: [] };
      
      const profilesMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      // Build hierarchy
      return residencesData.map(residence => {
        const residenceBuildings = (buildings || [])
          .filter(b => b.residence_id === residence.id)
          .map(building => ({
            ...building,
            lots: (lots || [])
              .filter(l => l.building_id === building.id)
              .map(l => ({
                ...l,
                primary_resident: l.primary_resident_id ? profilesMap.get(l.primary_resident_id) : null,
              })),
          }));

        const unassignedLots = (lots || [])
          .filter(l => l.residence_id === residence.id && !l.building_id)
          .map(l => ({
            ...l,
            primary_resident: l.primary_resident_id ? profilesMap.get(l.primary_resident_id) : null,
          }));

        return {
          ...residence,
          buildings: residenceBuildings,
          unassignedLots,
        } as Residence;
      });
    },
  });

  const toggleResidence = (id: string) => {
    const newSet = new Set(expandedResidences);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedResidences(newSet);
  };

  const toggleBuilding = (id: string) => {
    const newSet = new Set(expandedBuildings);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedBuildings(newSet);
  };

  const getLotTypeBadge = (type: string | null) => {
    switch (type) {
      case "apartment":
      case "appartement":
        return <Badge variant="secondary">Appartement</Badge>;
      case "parking":
        return <Badge variant="outline">Parking</Badge>;
      case "storage":
      case "cave":
        return <Badge variant="outline">Cave</Badge>;
      case "commercial":
      case "commerce":
        return <Badge variant="secondary">Commercial</Badge>;
      case "studio":
        return <Badge variant="secondary">Studio</Badge>;
      case "duplex":
        return <Badge variant="secondary">Duplex</Badge>;
      case "bureau":
        return <Badge variant="secondary">Bureau</Badge>;
      default:
        return <Badge variant="outline">Lot</Badge>;
    }
  };

  const handleDeleteResidence = async () => {
    if (!deletingResidence) return;

    try {
      const { error } = await supabase
        .from("residences")
        .delete()
        .eq("id", deletingResidence.id);

      if (error) throw error;

      toast({
        title: "Résidence supprimée",
        description: "La résidence a été supprimée avec succès.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingResidence(null);
    }
  };

  const handleDeleteBuilding = async () => {
    if (!deletingBuilding) return;

    try {
      const { error } = await supabase
        .from("buildings")
        .delete()
        .eq("id", deletingBuilding.id);

      if (error) throw error;

      toast({
        title: "Bâtiment supprimé",
        description: "Le bâtiment a été supprimé avec succès.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingBuilding(null);
    }
  };

  const handleDeleteLot = async () => {
    if (!deletingLot) return;

    try {
      const { error } = await supabase
        .from("lots")
        .delete()
        .eq("id", deletingLot.id);

      if (error) throw error;

      toast({
        title: "Appartement supprimé",
        description: "L'appartement a été supprimé avec succès.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingLot(null);
    }
  };

  const openBuildingDialog = (residenceId: string, building?: Building) => {
    setSelectedResidenceId(residenceId);
    setEditingBuilding(building || null);
    setBuildingDialogOpen(true);
  };

  const openLotDialog = (residenceId: string, lot?: Lot) => {
    setSelectedResidenceId(residenceId);
    setEditingLot(lot || null);
    setLotDialogOpen(true);
  };

  const openBulkDialog = (residenceId: string) => {
    setSelectedResidenceId(residenceId);
    setBulkDialogOpen(true);
  };

  const getBuildingsForResidence = (residenceId: string): { id: string; name: string }[] => {
    const residence = residences.find(r => r.id === residenceId);
    return residence?.buildings.map(b => ({ id: b.id, name: b.name })) || [];
  };

  const totalLots = residences.reduce((sum, r) => 
    sum + r.unassignedLots.length + r.buildings.reduce((bSum, b) => bSum + b.lots.length, 0), 0
  );

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Résidences ({residences.length})</h3>
          <p className="text-sm text-muted-foreground">{totalLots} appt(s) au total</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {residences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune résidence</h3>
            <p className="text-muted-foreground mb-4">
              Cette agence n'a pas encore de résidence
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une résidence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {residences.map((residence) => (
            <Card key={residence.id}>
              <CardHeader 
                className="py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleResidence(residence.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedResidences.has(residence.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{residence.name}</CardTitle>
                    {(residence.address || residence.city) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {[residence.address, residence.postal_code, residence.city]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="hidden sm:flex">
                    {residence.buildings.length} bât. • {residence.buildings.reduce((s, b) => s + b.lots.length, 0) + residence.unassignedLots.length} appts
                  </Badge>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedQrResidence({ id: residence.id, name: residence.name });
                        setQrDialogOpen(true);
                      }}
                      title="QR Code d'invitation"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openBuildingDialog(residence.id)}>
                          <Building2 className="h-4 w-4 mr-2" />
                          Ajouter un bâtiment
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openLotDialog(residence.id)}>
                          <Home className="h-4 w-4 mr-2" />
                          Ajouter un appt
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openBulkDialog(residence.id)}>
                          <Layers className="h-4 w-4 mr-2" />
                          Création en masse
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingResidence(residence)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingResidence(residence)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedResidences.has(residence.id) && (
                <CardContent className="pt-0 pb-4">
                  <div className="space-y-2 ml-7">
                    {/* Buildings */}
                    {residence.buildings.map((building) => (
                      <div key={building.id} className="border rounded-lg">
                        <div 
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleBuilding(building.id)}
                        >
                          {expandedBuildings.has(building.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium flex-1">{building.name}</span>
                          <Badge variant="outline">{building.lots.length} appts</Badge>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openBuildingDialog(residence.id, building)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingBuilding(building)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {expandedBuildings.has(building.id) && building.lots.length > 0 && (
                          <div className="border-t bg-muted/30">
                            {building.lots.map((lot) => (
                              <div 
                                key={lot.id} 
                                className="flex items-center gap-3 p-3 border-b last:border-b-0"
                              >
                                <div className="ml-7 flex-1 flex items-center gap-3">
                                  <span className="font-mono text-sm">{lot.lot_number}</span>
                                  {getLotTypeBadge(lot.type)}
                                  {lot.floor !== null && (
                                    <span className="text-xs text-muted-foreground">
                                      Étage {lot.floor}
                                    </span>
                                  )}
                                  {lot.surface && (
                                    <span className="text-xs text-muted-foreground">
                                      {lot.surface} m²
                                    </span>
                                  )}
                                </div>
                                {lot.primary_resident ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {lot.primary_resident.first_name} {lot.primary_resident.last_name}
                                    </span>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-amber-600">Vacant</Badge>
                                )}
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setTenantManagementLot({ lot, residenceId: residence.id, residenceName: residence.name })}
                                    title="Gérer les locataires"
                                  >
                                    <Users className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openLotDialog(residence.id, lot)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => setDeletingLot(lot)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Unassigned Lots */}
                    {residence.unassignedLots.length > 0 && (
                      <div className="border rounded-lg">
                        <div className="p-3 bg-muted/50">
                          <span className="font-medium text-muted-foreground">
                            Appts sans bâtiment ({residence.unassignedLots.length})
                          </span>
                        </div>
                        <div className="border-t">
                          {residence.unassignedLots.map((lot) => (
                            <div 
                              key={lot.id} 
                              className="flex items-center gap-3 p-3 border-b last:border-b-0"
                            >
                              <div className="flex-1 flex items-center gap-3">
                                <span className="font-mono text-sm">{lot.lot_number}</span>
                                {getLotTypeBadge(lot.type)}
                              </div>
                              {lot.primary_resident ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {lot.primary_resident.first_name} {lot.primary_resident.last_name}
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-amber-600">Vacant</Badge>
                              )}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setTenantManagementLot({ lot, residenceId: residence.id, residenceName: residence.name })}
                                  title="Gérer les locataires"
                                >
                                  <Users className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openLotDialog(residence.id, lot)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeletingLot(lot)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {residence.buildings.length === 0 && residence.unassignedLots.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          Aucun bâtiment ni appartement dans cette résidence
                        </p>
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openBuildingDialog(residence.id)}
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            Ajouter un bâtiment
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openLotDialog(residence.id)}
                          >
                            <Home className="h-4 w-4 mr-2" />
                            Ajouter un appt
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Residence Form Dialog */}
      <ResidenceFormDialog
        open={isFormOpen || !!editingResidence}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingResidence(null);
          }
        }}
        agencyId={agencyId}
        residence={editingResidence}
        onSuccess={() => {
          refetch();
          setIsFormOpen(false);
          setEditingResidence(null);
        }}
      />

      {/* QR Dialog */}
      {selectedQrResidence && (
        <ResidenceQRDialog
          residenceId={selectedQrResidence.id}
          residenceName={selectedQrResidence.name}
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
        />
      )}

      {/* Building Form Dialog */}
      {selectedResidenceId && (
        <BuildingFormDialog
          open={buildingDialogOpen}
          onOpenChange={(open) => {
            setBuildingDialogOpen(open);
            if (!open) {
              setEditingBuilding(null);
              refetch();
            }
          }}
          residenceId={selectedResidenceId}
          building={editingBuilding ? { 
            id: editingBuilding.id, 
            name: editingBuilding.name, 
            address: editingBuilding.address, 
            residence_id: selectedResidenceId 
          } : undefined}
        />
      )}

      {/* Lot Form Dialog */}
      {selectedResidenceId && (
        <LotFormDialog
          open={lotDialogOpen}
          onOpenChange={(open) => {
            setLotDialogOpen(open);
            if (!open) {
              setEditingLot(null);
              refetch();
            }
          }}
          residenceId={selectedResidenceId}
          lot={editingLot}
          buildings={getBuildingsForResidence(selectedResidenceId)}
        />
      )}

      {/* Bulk Create Dialog */}
      {selectedResidenceId && (
        <BulkCreateDialog
          open={bulkDialogOpen}
          onOpenChange={(open) => {
            setBulkDialogOpen(open);
            if (!open) {
              refetch();
            }
          }}
          residenceId={selectedResidenceId}
          buildings={getBuildingsForResidence(selectedResidenceId)}
        />
      )}

      {/* Delete Residence Confirmation */}
      <AlertDialog open={!!deletingResidence} onOpenChange={() => setDeletingResidence(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la résidence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les bâtiments, appartements et données associés seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteResidence} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Building Confirmation */}
      <AlertDialog open={!!deletingBuilding} onOpenChange={() => setDeletingBuilding(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le bâtiment ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les appartements associés seront désassociés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBuilding} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lot Confirmation */}
      <AlertDialog open={!!deletingLot} onOpenChange={() => setDeletingLot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'appartement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLot} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tenant Management Dialog */}
      {tenantManagementLot && (
        <TenantManagementDialog
          open={!!tenantManagementLot}
          onOpenChange={(open) => {
            if (!open) setTenantManagementLot(null);
          }}
          lotId={tenantManagementLot.lot.id}
          lotNumber={tenantManagementLot.lot.lot_number}
          residenceId={tenantManagementLot.residenceId}
          residenceName={tenantManagementLot.residenceName}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
