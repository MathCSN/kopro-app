import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  User, 
  FileText, 
  Phone,
  Info,
  Loader2 
} from "lucide-react";

interface LotSharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: {
    id: string;
    lot_number: string;
    residence: {
      id: string;
      name: string;
      agency_id?: string;
    };
  };
  bailleurAgencyId: string;
}

interface SharingSettings {
  share_tenant_info: boolean;
  share_lease_info: boolean;
  share_contact_info: boolean;
}

export function LotSharingDialog({ 
  open, 
  onOpenChange, 
  lot, 
  bailleurAgencyId 
}: LotSharingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SharingSettings>({
    share_tenant_info: false,
    share_lease_info: false,
    share_contact_info: false,
  });

  // Get syndic agency for this residence
  const { data: syndicAgency, isLoading: loadingSyndic } = useQuery({
    queryKey: ["residence-syndic", lot.residence.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residences")
        .select(`
          agency_id,
          agency:agencies!residences_agency_id_fkey(
            id,
            name,
            type
          )
        `)
        .eq("id", lot.residence.id)
        .single();

      if (error) throw error;
      return data?.agency;
    },
    enabled: open,
  });

  // Get existing sharing settings
  const { data: existingSharing, isLoading: loadingSharing } = useQuery({
    queryKey: ["lot-sharing", lot.id, bailleurAgencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lot_syndic_sharing")
        .select("*")
        .eq("lot_id", lot.id)
        .eq("bailleur_agency_id", bailleurAgencyId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: open && !!syndicAgency,
  });

  // Update settings when data loads
  useEffect(() => {
    if (existingSharing) {
      setSettings({
        share_tenant_info: existingSharing.share_tenant_info || false,
        share_lease_info: existingSharing.share_lease_info || false,
        share_contact_info: existingSharing.share_contact_info || false,
      });
    } else {
      setSettings({
        share_tenant_info: false,
        share_lease_info: false,
        share_contact_info: false,
      });
    }
  }, [existingSharing]);

  const saveMutation = useMutation({
    mutationFn: async (newSettings: SharingSettings) => {
      if (!syndicAgency) throw new Error("Aucun syndic trouvé pour cette résidence");

      if (existingSharing) {
        // Update existing
        const { error } = await supabase
          .from("lot_syndic_sharing")
          .update({
            ...newSettings,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSharing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("lot_syndic_sharing")
          .insert({
            lot_id: lot.id,
            bailleur_agency_id: bailleurAgencyId,
            syndic_agency_id: syndicAgency.id,
            ...newSettings,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de partage ont été mis à jour.",
      });
      queryClient.invalidateQueries({ queryKey: ["lot-sharing", lot.id] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const isLoading = loadingSyndic || loadingSharing;
  const hasChanges = existingSharing 
    ? (
        settings.share_tenant_info !== (existingSharing.share_tenant_info || false) ||
        settings.share_lease_info !== (existingSharing.share_lease_info || false) ||
        settings.share_contact_info !== (existingSharing.share_contact_info || false)
      )
    : (settings.share_tenant_info || settings.share_lease_info || settings.share_contact_info);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Partage d'informations
          </DialogTitle>
          <DialogDescription>
            Appartement <strong>{lot.lot_number}</strong> - {lot.residence.name}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !syndicAgency ? (
          <div className="text-center py-6 text-muted-foreground">
            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun syndic n'est associé à cette résidence.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Syndic Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{syndicAgency.name}</p>
                <p className="text-sm text-muted-foreground">Syndic de la résidence</p>
              </div>
              <Badge variant="secondary">Syndic</Badge>
            </div>

            <Separator />

            {/* Sharing Options */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choisissez les informations à partager avec le syndic :
              </p>

              <div className="space-y-4">
                {/* Tenant Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label htmlFor="share_tenant">Informations locataire</Label>
                      <p className="text-xs text-muted-foreground">
                        Nom, prénom du locataire
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="share_tenant"
                    checked={settings.share_tenant_info}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, share_tenant_info: checked }))
                    }
                  />
                </div>

                {/* Lease Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label htmlFor="share_lease">Informations bail</Label>
                      <p className="text-xs text-muted-foreground">
                        Dates, loyer, type de bail
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="share_lease"
                    checked={settings.share_lease_info}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, share_lease_info: checked }))
                    }
                  />
                </div>

                {/* Contact Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <Label htmlFor="share_contact">Coordonnées</Label>
                      <p className="text-xs text-muted-foreground">
                        Email, téléphone du locataire
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="share_contact"
                    checked={settings.share_contact_info}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, share_contact_info: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
