import { useState } from "react";
import { Building2, Home, Landmark, ChevronDown, ChevronRight, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResidence } from "@/contexts/ResidenceContext";
import { ResidencesManagement } from "./ResidencesManagement";
import { BuildingsManagement } from "./buildings/BuildingsManagement";
import { LotsManagement } from "./lots/LotsManagement";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Section = "residences" | "buildings" | "lots";

export function PropertyManagement() {
  const { selectedResidence, residences, setSelectedResidence } = useResidence();
  const [openSections, setOpenSections] = useState<Section[]>(["residences"]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingResidenceId, setDeletingResidenceId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleSection = (section: Section) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleDeleteResidence = async () => {
    if (!deletingResidenceId) return;
    
    setIsDeleting(true);
    try {
      // Check if residence has lots
      const { data: lots } = await supabase
        .from("lots")
        .select("id")
        .eq("residence_id", deletingResidenceId)
        .limit(1);

      if (lots && lots.length > 0) {
        toast.error("Impossible de supprimer : cette résidence contient des lots");
        return;
      }

      // Check if residence has buildings
      const { data: buildings } = await supabase
        .from("buildings")
        .select("id")
        .eq("residence_id", deletingResidenceId)
        .limit(1);

      if (buildings && buildings.length > 0) {
        toast.error("Impossible de supprimer : cette résidence contient des bâtiments");
        return;
      }

      // Delete user_roles associated with the residence
      await supabase
        .from("user_roles")
        .delete()
        .eq("residence_id", deletingResidenceId);

      // Delete the residence
      const { error } = await supabase
        .from("residences")
        .delete()
        .eq("id", deletingResidenceId);

      if (error) throw error;

      toast.success("Résidence supprimée");
      
      // If we deleted the selected residence, clear selection
      if (selectedResidence?.id === deletingResidenceId) {
        setSelectedResidence(null);
      }
      
      // Reload to refresh residences list
      window.location.reload();
    } catch (error) {
      console.error("Error deleting residence:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingResidenceId(null);
    }
  };

  const openDeleteDialog = (residenceId: string) => {
    setDeletingResidenceId(residenceId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Section header with description */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Gestion du patrimoine</h2>
        <p className="text-sm text-muted-foreground">
          Gérez vos résidences, bâtiments et lots depuis un seul endroit
        </p>
      </div>

      {/* Legend */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Résidence</p>
                <p className="text-muted-foreground text-xs">Ensemble immobilier (ex: Résidence Les Jardins)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Landmark className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Bâtiment</p>
                <p className="text-muted-foreground text-xs">Entrée ou bloc (ex: Bâtiment A, Escalier 2)</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Home className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Lot</p>
                <p className="text-muted-foreground text-xs">Appartement ou local avec tantièmes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résidences Section */}
      <Collapsible 
        open={openSections.includes("residences")} 
        onOpenChange={() => toggleSection("residences")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Résidences</p>
                  <p className="text-xs text-muted-foreground">{residences.length} résidence(s)</p>
                </div>
              </div>
              {openSections.includes("residences") ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t">
              <ResidencesManagement onDeleteResidence={openDeleteDialog} />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Bâtiments Section */}
      <Collapsible 
        open={openSections.includes("buildings")} 
        onOpenChange={() => toggleSection("buildings")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Bâtiments</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedResidence ? `Bâtiments de ${selectedResidence.name}` : "Sélectionnez une résidence"}
                  </p>
                </div>
              </div>
              {openSections.includes("buildings") ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t">
              <BuildingsManagement />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Lots Section */}
      <Collapsible 
        open={openSections.includes("lots")} 
        onOpenChange={() => toggleSection("lots")}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Lots / Appartements</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedResidence ? `Lots de ${selectedResidence.name}` : "Sélectionnez une résidence"}
                  </p>
                </div>
              </div>
              {openSections.includes("lots") ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 border-t">
              <LotsManagement />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer la résidence
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette résidence ? Cette action est irréversible.
              <br /><br />
              <strong>Note :</strong> Vous ne pouvez supprimer une résidence que si elle ne contient aucun bâtiment ni lot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteResidence}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
