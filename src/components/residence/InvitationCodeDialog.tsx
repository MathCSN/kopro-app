import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, RefreshCw, Loader2, QrCode, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type Invitation = {
  id: string;
  code: string;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
};

type Props = {
  residenceId: string;
  residenceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InvitationCodeDialog({ residenceId, residenceName, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [expiryOption, setExpiryOption] = useState<string>("never");
  const [maxUses, setMaxUses] = useState<string>("");

  useEffect(() => {
    if (open && residenceId) {
      fetchInvitations();
    }
  }, [open, residenceId]);

  const fetchInvitations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('residence_invitations')
        .select('*')
        .eq('residence_id', residenceId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les invitations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createInvitation = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const code = generateCode();
      let expiresAt: string | null = null;

      if (expiryOption === "1day") {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (expiryOption === "7days") {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (expiryOption === "30days") {
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase
        .from('residence_invitations')
        .insert({
          residence_id: residenceId,
          code: code,
          created_by: user.id,
          expires_at: expiresAt,
          max_uses: maxUses ? parseInt(maxUses) : null,
        });

      if (error) throw error;

      toast({
        title: "Code créé",
        description: `Le code ${code} a été créé avec succès.`,
      });

      fetchInvitations();
      setMaxUses("");
      setExpiryOption("never");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le code.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('residence_invitations')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Code supprimé",
        description: "Le code d'invitation a été désactivé.",
      });

      fetchInvitations();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le code.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Le code a été copié dans le presse-papiers.",
    });
  };

  const getInviteUrl = (code: string) => {
    return `${window.location.origin}/join?code=${code}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Codes d'invitation
          </DialogTitle>
          <DialogDescription>
            Gérez les codes d'invitation pour {residenceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new invitation */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium text-sm">Nouveau code</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Expiration</Label>
                <Select value={expiryOption} onValueChange={setExpiryOption}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="never">Jamais</SelectItem>
                    <SelectItem value="1day">1 jour</SelectItem>
                    <SelectItem value="7days">7 jours</SelectItem>
                    <SelectItem value="30days">30 jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Utilisations max</Label>
                <Input
                  type="number"
                  placeholder="Illimité"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="h-8 text-xs"
                  min={1}
                />
              </div>
            </div>
            <Button 
              onClick={createInvitation} 
              disabled={isCreating}
              size="sm"
              className="w-full"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Générer un code
            </Button>
          </div>

          {/* Existing invitations */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Codes actifs</h4>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun code actif. Créez-en un pour inviter des résidents.
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {invitations.map((inv) => (
                  <div key={inv.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg">{inv.code}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(inv.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => deleteInvitation(inv.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {inv.uses_count} utilisation{inv.uses_count > 1 ? 's' : ''}
                        {inv.max_uses && ` / ${inv.max_uses}`}
                      </Badge>
                      {inv.expires_at && (
                        <Badge variant="outline" className="text-xs">
                          Expire le {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-center bg-white p-3 rounded">
                      <QRCodeSVG 
                        value={getInviteUrl(inv.code)} 
                        size={120}
                        level="M"
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => copyToClipboard(getInviteUrl(inv.code))}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copier le lien
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
