import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Building2, 
  MapPin, 
  Home,
  Edit,
  Trash2,
  User,
  Search,
  ExternalLink,
  Link2
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
import { useToast } from "@/hooks/use-toast";
import { AddLotToBailleurDialog } from "./AddLotToBailleurDialog";

interface BailleurLotsTabProps {
  agencyId: string;
}

interface LotWithResidence {
  id: string;
  lot_number: string;
  type: string | null;
  floor: number | null;
  surface: number | null;
  rooms: number | null;
  door: string | null;
  tantiemes: number | null;
  notes: string | null;
  residence_id: string;
  building_id: string | null;
  residence: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  };
  building: {
    id: string;
    name: string;
  } | null;
  primary_resident?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export function BailleurLotsTab({ agencyId }: BailleurLotsTabProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [addLotDialogOpen, setAddLotDialogOpen] = useState(false);
  const [deletingLot, setDeletingLot] = useState<LotWithResidence | null>(null);

  const { data: lots = [], isLoading, refetch } = useQuery({
    queryKey: ["bailleur-lots", agencyId],
    queryFn: async () => {
      // Get lots managed by this bailleur agency
      const { data: lotsData, error } = await supabase
        .from("lots")
        .select(`
          id,
          lot_number,
          type,
          floor,
          surface,
          rooms,
          door,
          tantiemes,
          notes,
          residence_id,
          building_id,
          primary_resident_id,
          residence:residences!lots_residence_id_fkey(
            id,
            name,
            address,
            city
          ),
          building:buildings!lots_building_id_fkey(
            id,
            name
          )
        `)
        .eq("bailleur_agency_id", agencyId)
        .order("lot_number");

      if (error) throw error;

      // Get primary residents
      const residentIds = (lotsData || [])
        .map(l => l.primary_resident_id)
        .filter(Boolean) as string[];
      
      const { data: profiles } = residentIds.length > 0 
        ? await supabase.from("profiles").select("id, first_name, last_name").in("id", residentIds)
        : { data: [] };
      
      const profilesMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      return (lotsData || []).map(lot => ({
        ...lot,
        primary_resident: lot.primary_resident_id ? profilesMap.get(lot.primary_resident_id) : null,
      })) as LotWithResidence[];
    },
  });

  const filteredLots = lots.filter(lot => {
    const query = searchQuery.toLowerCase();
    return (
      lot.lot_number.toLowerCase().includes(query) ||
      lot.residence.name.toLowerCase().includes(query) ||
      lot.residence.city?.toLowerCase().includes(query) ||
      lot.building?.name.toLowerCase().includes(query) ||
      lot.primary_resident?.first_name?.toLowerCase().includes(query) ||
      lot.primary_resident?.last_name?.toLowerCase().includes(query)
    );
  });

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

  const handleDeleteLot = async () => {
    if (!deletingLot) return;

    try {
      // Just remove the bailleur_agency_id link, don't delete the lot itself
      const { error } = await supabase
        .from("lots")
        .update({ bailleur_agency_id: null })
        .eq("id", deletingLot.id);

      if (error) throw error;

      toast({
        title: "Appartement retiré",
        description: "L'appartement a été retiré de votre gestion.",
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

  // Group lots by residence
  const lotsByResidence = filteredLots.reduce((acc, lot) => {
    const residenceId = lot.residence.id;
    if (!acc[residenceId]) {
      acc[residenceId] = {
        residence: lot.residence,
        lots: [],
      };
    }
    acc[residenceId].lots.push(lot);
    return acc;
  }, {} as Record<string, { residence: LotWithResidence["residence"]; lots: LotWithResidence[] }>);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Appartements gérés ({lots.length})</h3>
          <p className="text-sm text-muted-foreground">
            Dans {Object.keys(lotsByResidence).length} résidence(s) différente(s)
          </p>
        </div>
        <Button onClick={() => setAddLotDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un appartement
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par numéro, résidence, ville, locataire..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {lots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Home className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun appartement</h3>
            <p className="text-muted-foreground mb-4">
              Ce bailleur ne gère pas encore d'appartement
            </p>
            <Button onClick={() => setAddLotDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un appartement
            </Button>
          </CardContent>
        </Card>
      ) : filteredLots.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun résultat pour "{searchQuery}"
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(lotsByResidence).map(([residenceId, { residence, lots: residenceLots }]) => (
            <Card key={residenceId}>
              <CardHeader className="py-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{residence.name}</CardTitle>
                    {(residence.address || residence.city) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {[residence.address, residence.city].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline">{residenceLots.length} appt(s)</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {residenceLots.map((lot) => (
                    <div 
                      key={lot.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Home className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{lot.lot_number}</span>
                          {getLotTypeBadge(lot.type)}
                          {lot.building && (
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              • {lot.building.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {lot.floor !== null && <span>Étage {lot.floor}</span>}
                          {lot.surface && <span>{lot.surface} m²</span>}
                          {lot.rooms && <span>{lot.rooms} pièce(s)</span>}
                        </div>
                      </div>
                      
                      {/* Tenant */}
                      {lot.primary_resident ? (
                        <div className="hidden sm:flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {lot.primary_resident.first_name} {lot.primary_resident.last_name}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="hidden sm:flex text-amber-600 border-amber-300">
                          Vacant
                        </Badge>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingLot(lot)}
                          title="Retirer de ma gestion"
                        >
                          <Link2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Lot Dialog */}
      <AddLotToBailleurDialog
        open={addLotDialogOpen}
        onOpenChange={setAddLotDialogOpen}
        agencyId={agencyId}
        onSuccess={() => {
          refetch();
          setAddLotDialogOpen(false);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingLot} onOpenChange={(open) => !open && setDeletingLot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cet appartement ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'appartement <strong>{deletingLot?.lot_number}</strong> sera retiré de votre gestion.
              Il restera dans la résidence "{deletingLot?.residence.name}" mais ne sera plus lié à votre compte bailleur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLot}>
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}