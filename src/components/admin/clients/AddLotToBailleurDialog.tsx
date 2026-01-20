import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Home, MapPin, Search, Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddLotToBailleurDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyId: string;
  onSuccess: () => void;
}

interface Residence {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  agency_id: string | null;
}

interface Lot {
  id: string;
  lot_number: string;
  type: string | null;
  floor: number | null;
  surface: number | null;
  building_id: string | null;
  bailleur_agency_id: string | null;
  building?: {
    name: string;
  } | null;
}

export function AddLotToBailleurDialog({ 
  open, 
  onOpenChange, 
  agencyId, 
  onSuccess 
}: AddLotToBailleurDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"residence" | "lot">("residence");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResidence, setSelectedResidence] = useState<Residence | null>(null);
  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set());

  // Fetch all residences (managed by Syndics or any agency)
  const { data: residences = [], isLoading: loadingResidences } = useQuery({
    queryKey: ["all-residences-for-bailleur"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residences")
        .select("id, name, address, city, agency_id")
        .order("name");

      if (error) throw error;
      return data as Residence[];
    },
    enabled: open && step === "residence",
  });

  // Fetch lots for selected residence
  const { data: lots = [], isLoading: loadingLots } = useQuery({
    queryKey: ["residence-lots-for-bailleur", selectedResidence?.id],
    queryFn: async () => {
      if (!selectedResidence) return [];

      const { data, error } = await supabase
        .from("lots")
        .select(`
          id,
          lot_number,
          type,
          floor,
          surface,
          building_id,
          bailleur_agency_id,
          building:buildings!lots_building_id_fkey(name)
        `)
        .eq("residence_id", selectedResidence.id)
        .order("lot_number");

      if (error) throw error;
      return data as Lot[];
    },
    enabled: !!selectedResidence && step === "lot",
  });

  const filteredResidences = residences.filter(r => {
    const query = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.city?.toLowerCase().includes(query) ||
      r.address?.toLowerCase().includes(query)
    );
  });

  const availableLots = lots.filter(l => !l.bailleur_agency_id || l.bailleur_agency_id === agencyId);
  const alreadyAssignedLots = lots.filter(l => l.bailleur_agency_id === agencyId);

  const assignMutation = useMutation({
    mutationFn: async (lotIds: string[]) => {
      const { error } = await supabase
        .from("lots")
        .update({ bailleur_agency_id: agencyId })
        .in("id", lotIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bailleur-lots", agencyId] });
      toast({
        title: "Appartements ajoutés",
        description: `${selectedLotIds.size} appartement(s) ajouté(s) à votre gestion.`,
      });
      handleClose();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep("residence");
    setSearchQuery("");
    setSelectedResidence(null);
    setSelectedLotIds(new Set());
    onOpenChange(false);
  };

  const handleSelectResidence = (residence: Residence) => {
    setSelectedResidence(residence);
    setSearchQuery("");
    setStep("lot");
  };

  const toggleLotSelection = (lotId: string) => {
    const newSet = new Set(selectedLotIds);
    if (newSet.has(lotId)) {
      newSet.delete(lotId);
    } else {
      newSet.add(lotId);
    }
    setSelectedLotIds(newSet);
  };

  const handleAssign = () => {
    if (selectedLotIds.size === 0) return;
    assignMutation.mutate(Array.from(selectedLotIds));
  };

  const getLotTypeBadge = (type: string | null) => {
    switch (type) {
      case "apartment":
      case "appartement":
        return <Badge variant="secondary" className="text-xs">Appt</Badge>;
      case "parking":
        return <Badge variant="outline" className="text-xs">Parking</Badge>;
      case "cave":
      case "storage":
        return <Badge variant="outline" className="text-xs">Cave</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Lot</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "residence" ? "Choisir une résidence" : "Sélectionner les appartements"}
          </DialogTitle>
          <DialogDescription>
            {step === "residence" 
              ? "Recherchez la résidence où se trouve l'appartement à ajouter"
              : `Résidence: ${selectedResidence?.name}`
            }
          </DialogDescription>
        </DialogHeader>

        {step === "residence" ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              {loadingResidences ? (
                <div className="py-8 text-center text-muted-foreground">Chargement...</div>
              ) : filteredResidences.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {searchQuery ? `Aucune résidence trouvée pour "${searchQuery}"` : "Aucune résidence disponible"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredResidences.map((residence) => (
                    <button
                      key={residence.id}
                      onClick={() => handleSelectResidence(residence)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{residence.name}</p>
                        {(residence.address || residence.city) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {[residence.address, residence.city].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep("residence")}
              className="w-fit -mt-2"
            >
              ← Changer de résidence
            </Button>

            <ScrollArea className="flex-1 -mx-6 px-6">
              {loadingLots ? (
                <div className="py-8 text-center text-muted-foreground">Chargement...</div>
              ) : availableLots.length === 0 && alreadyAssignedLots.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucun appartement dans cette résidence
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Available lots */}
                  {availableLots.filter(l => l.bailleur_agency_id !== agencyId).map((lot) => (
                    <button
                      key={lot.id}
                      onClick={() => toggleLotSelection(lot.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                        selectedLotIds.has(lot.id) 
                          ? "border-primary bg-primary/5" 
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${
                        selectedLotIds.has(lot.id) ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        {selectedLotIds.has(lot.id) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Home className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{lot.lot_number}</span>
                          {getLotTypeBadge(lot.type)}
                          {lot.building && (
                            <span className="text-xs text-muted-foreground">
                              • {lot.building.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {lot.floor !== null && <span>Étage {lot.floor}</span>}
                          {lot.surface && <span>{lot.surface} m²</span>}
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Already assigned lots */}
                  {alreadyAssignedLots.length > 0 && (
                    <>
                      <div className="text-xs text-muted-foreground pt-4 pb-2 font-medium">
                        Déjà dans votre gestion
                      </div>
                      {alreadyAssignedLots.map((lot) => (
                        <div
                          key={lot.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-dashed opacity-60"
                        >
                          <div className="h-8 w-8 rounded-md bg-green-100 flex items-center justify-center shrink-0">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{lot.lot_number}</span>
                              {getLotTypeBadge(lot.type)}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            Déjà géré
                          </Badge>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                onClick={handleAssign} 
                disabled={selectedLotIds.size === 0 || assignMutation.isPending}
              >
                {assignMutation.isPending 
                  ? "Ajout..." 
                  : `Ajouter ${selectedLotIds.size} appartement(s)`
                }
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}