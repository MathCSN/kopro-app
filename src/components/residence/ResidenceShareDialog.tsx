import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
  Copy, QrCode, Download, Share2, Facebook, Link, 
  Mail, MessageCircle, ExternalLink, Home 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

type Props = {
  residenceId: string;
  residenceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// External platforms for sharing listings
const SHARE_PLATFORMS = [
  {
    id: "leboncoin",
    name: "Le Bon Coin",
    icon: Home,
    url: "https://www.leboncoin.fr/deposer-une-annonce",
    description: "Leader des petites annonces en France",
  },
  {
    id: "seloger",
    name: "SeLoger",
    icon: Home,
    url: "https://www.seloger.com/",
    description: "Portail immobilier de référence",
  },
  {
    id: "pap",
    name: "PAP",
    icon: Home,
    url: "https://www.pap.fr/",
    description: "Particulier à Particulier",
  },
  {
    id: "bien-ici",
    name: "Bien'ici",
    icon: Home,
    url: "https://www.bienici.com/",
    description: "Portail immobilier nouvelle génération",
  },
  {
    id: "logic-immo",
    name: "Logic-Immo",
    icon: Home,
    url: "https://www.logic-immo.com/",
    description: "Annonces immobilières partout en France",
  },
  {
    id: "figaro-immo",
    name: "Figaro Immobilier",
    icon: Home,
    url: "https://immobilier.lefigaro.fr/",
    description: "Le Figaro Immobilier",
  },
];

export function ResidenceShareDialog({ residenceId, residenceName, open, onOpenChange }: Props) {
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
    const svg = document.getElementById('share-residence-qr-code');
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

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Rejoignez ${residenceName}`);
    const body = encodeURIComponent(`Bonjour,\n\nVous êtes invité(e) à rejoindre la résidence ${residenceName} sur KOPRO.\n\nCliquez sur ce lien pour vous inscrire: ${getJoinUrl()}\n\nCordialement`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const text = encodeURIComponent(`Rejoignez la résidence ${residenceName} sur KOPRO: ${getJoinUrl()}`);
    window.open(`sms:?body=${text}`);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`Rejoignez la résidence ${residenceName} sur KOPRO: ${getJoinUrl()}`);
    window.open(`https://wa.me/?text=${text}`);
  };

  const shareViaFacebook = () => {
    const url = encodeURIComponent(getJoinUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const openPlatform = (url: string) => {
    window.open(url, '_blank');
    toast({
      title: "Redirection",
      description: "Vous allez être redirigé vers le site pour déposer votre annonce.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Partager la résidence
          </DialogTitle>
          <DialogDescription>
            Partagez le lien d'invitation pour {residenceName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Lien & QR</TabsTrigger>
            <TabsTrigger value="social">Réseaux</TabsTrigger>
            <TabsTrigger value="platforms">Annonces</TabsTrigger>
          </TabsList>

          {/* Link & QR Code Tab */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Lien d'invitation</Label>
              <div className="flex gap-2">
                <Input value={getJoinUrl()} readOnly className="flex-1" />
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>QR Code</Label>
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <QRCodeSVG 
                    id="share-residence-qr-code"
                    value={getJoinUrl()} 
                    size={180}
                    level="M"
                    includeMargin
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Les résidents peuvent scanner ce code pour rejoindre la résidence
                </p>
                <Button variant="outline" onClick={downloadQR}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le QR Code
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Social Sharing Tab */}
          <TabsContent value="social" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Partagez le lien d'invitation via vos canaux préférés
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start gap-3 h-12" onClick={shareViaEmail}>
                <Mail className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">Envoyer par email</p>
                </div>
              </Button>

              <Button variant="outline" className="justify-start gap-3 h-12" onClick={shareViaSMS}>
                <MessageCircle className="h-5 w-5 text-green-500" />
                <div className="text-left">
                  <p className="font-medium">SMS</p>
                  <p className="text-xs text-muted-foreground">Envoyer par SMS</p>
                </div>
              </Button>

              <Button variant="outline" className="justify-start gap-3 h-12" onClick={shareViaWhatsApp}>
                <MessageCircle className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Partager sur WhatsApp</p>
                </div>
              </Button>

              <Button variant="outline" className="justify-start gap-3 h-12" onClick={shareViaFacebook}>
                <Facebook className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium">Facebook</p>
                  <p className="text-xs text-muted-foreground">Partager sur Facebook</p>
                </div>
              </Button>
            </div>
          </TabsContent>

          {/* External Platforms Tab */}
          <TabsContent value="platforms" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Publiez votre annonce sur les principaux sites immobiliers français
            </p>

            <div className="grid gap-3">
              {SHARE_PLATFORMS.map((platform) => (
                <Card key={platform.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => openPlatform(platform.url)}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <platform.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{platform.name}</p>
                        <p className="text-sm text-muted-foreground">{platform.description}</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
              En cliquant, vous serez redirigé vers le site pour déposer votre annonce manuellement
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
