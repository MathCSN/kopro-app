import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Props = {
  residenceId: string;
  residenceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ResidenceQRDialog({ residenceId, residenceName, open, onOpenChange }: Props) {
  const { toast } = useToast();

  const getJoinUrl = () => {
    return `${window.location.origin}/join?residence=${residenceId}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getJoinUrl());
    toast({
      title: "Copié",
      description: "Le lien a été copié dans le presse-papiers.",
    });
  };

  const downloadQR = () => {
    const svg = document.getElementById('residence-qr-code');
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
      downloadLink.download = `qr-${residenceName.replace(/\s+/g, '-').toLowerCase()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
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
          <div className="flex justify-center bg-white p-6 rounded-lg">
            <QRCodeSVG 
              id="residence-qr-code"
              value={getJoinUrl()} 
              size={200}
              level="M"
              includeMargin
            />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            En scannant ce code, les utilisateurs pourront sélectionner leur appartement et rejoindre la résidence.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copier le lien
            </Button>
            <Button variant="outline" className="flex-1" onClick={downloadQR}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
