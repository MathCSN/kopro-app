import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, QrCode, Download, Building2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Building = {
  id: string;
  name: string;
};

type Props = {
  residenceId: string;
  residenceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ResidenceQRDialog({ residenceId, residenceName, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [perBuilding, setPerBuilding] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);

  useEffect(() => {
    if (open && perBuilding) {
      fetchBuildings();
    }
  }, [open, perBuilding, residenceId]);

  const fetchBuildings = async () => {
    setLoadingBuildings(true);
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, name')
        .eq('residence_id', residenceId)
        .order('name');
      
      if (error) throw error;
      setBuildings(data || []);
      if (data && data.length > 0 && !selectedBuilding) {
        setSelectedBuilding(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching buildings:", error);
    } finally {
      setLoadingBuildings(false);
    }
  };

  const getJoinUrl = (buildingId?: string) => {
    if (buildingId) {
      return `${window.location.origin}/join?residence=${residenceId}&building=${buildingId}`;
    }
    return `${window.location.origin}/join?residence=${residenceId}`;
  };

  const getShortCode = (id: string) => {
    return id.slice(0, 8).toUpperCase();
  };

  const copyToClipboard = (buildingId?: string) => {
    navigator.clipboard.writeText(getJoinUrl(buildingId));
    toast({
      title: "Copié",
      description: "Le lien a été copié dans le presse-papiers.",
    });
  };

  const downloadQR = (elementId: string, name: string) => {
    const svg = document.getElementById(elementId);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `qr-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const renderQRCode = (url: string, code: string, elementId: string, name: string, buildingId?: string) => (
    <div className="space-y-4">
      <div className="flex justify-center bg-white p-6 rounded-lg">
        <QRCodeSVG 
          id={elementId}
          value={url} 
          size={180}
          level="M"
          includeMargin
        />
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {buildingId ? "Code bâtiment" : "Code résidence"}
        </p>
        <p className="font-mono text-lg font-semibold bg-muted px-4 py-2 rounded-lg inline-block">
          {code}
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => copyToClipboard(buildingId)}>
          <Copy className="h-4 w-4 mr-2" />
          Copier
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => downloadQR(elementId, name)}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code d'invitation
          </DialogTitle>
          <DialogDescription>
            Les résidents peuvent scanner ce QR code pour rejoindre {residenceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode selector */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {perBuilding ? (
                <Building2 className="h-4 w-4 text-primary" />
              ) : (
                <Home className="h-4 w-4 text-primary" />
              )}
              <Label htmlFor="per-building" className="text-sm font-medium cursor-pointer">
                {perBuilding ? "QR par bâtiment" : "QR global résidence"}
              </Label>
            </div>
            <Switch
              id="per-building"
              checked={perBuilding}
              onCheckedChange={setPerBuilding}
            />
          </div>

          {!perBuilding ? (
            // Global residence QR
            <>
              {renderQRCode(
                getJoinUrl(),
                getShortCode(residenceId),
                'residence-qr-code',
                residenceName
              )}
              <p className="text-sm text-muted-foreground text-center">
                En scannant ce code, les utilisateurs pourront rejoindre la résidence.
              </p>
            </>
          ) : (
            // Per-building QR codes
            <>
              {loadingBuildings ? (
                <div className="space-y-4">
                  <Skeleton className="h-[180px] w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : buildings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun bâtiment configuré pour cette résidence.</p>
                  <p className="text-sm mt-1">Ajoutez des bâtiments dans l'onglet Patrimoine.</p>
                </div>
              ) : (
                <Tabs value={selectedBuilding || buildings[0]?.id} onValueChange={setSelectedBuilding}>
                  <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${Math.min(buildings.length, 4)}, 1fr)` }}>
                    {buildings.slice(0, 4).map((building) => (
                      <TabsTrigger key={building.id} value={building.id} className="text-xs">
                        {building.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {buildings.length > 4 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {buildings.slice(4).map((building) => (
                        <Button
                          key={building.id}
                          variant={selectedBuilding === building.id ? "secondary" : "ghost"}
                          size="sm"
                          className="text-xs"
                          onClick={() => setSelectedBuilding(building.id)}
                        >
                          {building.name}
                        </Button>
                      ))}
                    </div>
                  )}
                  {buildings.map((building) => (
                    <TabsContent key={building.id} value={building.id} className="mt-4">
                      {renderQRCode(
                        getJoinUrl(building.id),
                        getShortCode(building.id),
                        `building-qr-${building.id}`,
                        `${residenceName}-${building.name}`,
                        building.id
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              <p className="text-sm text-muted-foreground text-center">
                Chaque bâtiment a son propre QR code pour une gestion plus précise.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
