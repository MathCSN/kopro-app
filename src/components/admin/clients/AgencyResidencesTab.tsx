import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Building2, 
  MapPin, 
  Home,
  Users,
  Edit,
  Trash2,
  QrCode
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
import { ResidenceFormDialog } from "./ResidenceFormDialog";
import { ResidenceQRDialog } from "@/components/residence/ResidenceQRDialog";

interface AgencyResidencesTabProps {
  agencyId: string;
}

export function AgencyResidencesTab({ agencyId }: AgencyResidencesTabProps) {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResidence, setEditingResidence] = useState<any>(null);
  const [deletingResidence, setDeletingResidence] = useState<any>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedResidence, setSelectedResidence] = useState<{ id: string; name: string } | null>(null);

  const { data: residences = [], isLoading, refetch } = useQuery({
    queryKey: ["agency-residences", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residences")
        .select("*")
        .eq("agency_id", agencyId)
        .order("name");

      if (error) throw error;

      // Get lots and buildings count per residence
      const residenceIds = data.map(r => r.id);
      
      const { data: lots } = await supabase
        .from("lots")
        .select("id, residence_id")
        .in("residence_id", residenceIds);

      const { data: buildings } = await supabase
        .from("buildings")
        .select("id, residence_id")
        .in("residence_id", residenceIds);

      const lotsCount = new Map<string, number>();
      lots?.forEach(l => {
        lotsCount.set(l.residence_id, (lotsCount.get(l.residence_id) || 0) + 1);
      });

      const buildingsCount = new Map<string, number>();
      buildings?.forEach(b => {
        buildingsCount.set(b.residence_id, (buildingsCount.get(b.residence_id) || 0) + 1);
      });

      return data.map(residence => ({
        ...residence,
        lots_count: lotsCount.get(residence.id) || 0,
        buildings_count: buildingsCount.get(residence.id) || 0,
      }));
    },
  });

  const handleDelete = async () => {
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

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Résidences ({residences.length})</h3>
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
        <div className="grid gap-4">
          {residences.map((residence) => (
            <Card key={residence.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{residence.name}</h4>
                    {(residence.address || residence.city) && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {[residence.address, residence.postal_code, residence.city]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:flex items-center gap-4">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{residence.buildings_count}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Bâtiments</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{residence.lots_count}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Lots</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedResidence({ id: residence.id, name: residence.name });
                        setQrDialogOpen(true);
                      }}
                      title="QR Code d'invitation"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

      <AlertDialog open={!!deletingResidence} onOpenChange={() => setDeletingResidence(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la résidence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les bâtiments, lots et données associés seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedResidence && (
        <ResidenceQRDialog
          residenceId={selectedResidence.id}
          residenceName={selectedResidence.name}
          open={qrDialogOpen}
          onOpenChange={setQrDialogOpen}
        />
      )}
    </div>
  );
}
