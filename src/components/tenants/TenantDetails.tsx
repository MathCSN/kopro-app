import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Receipt, 
  TrendingUp,
  User,
  Building2,
  Calendar,
  Edit2,
  Save,
  X,
  QrCode,
  Copy,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DocumentUpload } from "./DocumentUpload";
import { EmailTemplateEditor } from "./EmailTemplateEditor";
import { QRCodeSVG } from "qrcode.react";

interface TenantProfile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface Tenant {
  id: string;
  user_id: string;
  profile: TenantProfile | null;
  lot: {
    id: string;
    lot_number: string;
    door: string | null;
    floor: number | null;
    surface: number | null;
    rooms: number | null;
    join_code: string | null;
  } | null;
  type: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  residence_id?: string;
}

interface TenantDocument {
  id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  verified: boolean | null;
  expires_at: string | null;
  created_at: string;
}

interface TenantDetailsProps {
  tenant: Tenant | null;
  residenceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function TenantDetails({ 
  tenant, 
  residenceId, 
  open, 
  onOpenChange,
  onUpdate 
}: TenantDetailsProps) {
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<TenantProfile | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [regeneratingCode, setRegeneratingCode] = useState(false);
  const [emailDialog, setEmailDialog] = useState<{
    open: boolean;
    type: "document_reminder" | "rent_receipt" | "rent_revision";
  }>({ open: false, type: "document_reminder" });

  useEffect(() => {
    if (tenant && open) {
      fetchDocuments();
      setEditedProfile(tenant.profile);
      setJoinCode(tenant.lot?.join_code || null);
    }
  }, [tenant, open]);

  const fetchDocuments = async () => {
    if (!tenant) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tenant_documents")
        .select("*")
        .eq("user_id", tenant.user_id)
        .eq("residence_id", residenceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!tenant || !editedProfile) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          phone: editedProfile.phone,
        })
        .eq("id", tenant.user_id);

      if (error) throw error;

      toast.success("Profil mis à jour");
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleCopyCode = () => {
    if (joinCode) {
      navigator.clipboard.writeText(joinCode);
      toast.success("Code copié dans le presse-papier");
    }
  };

  const handleRegenerateCode = async () => {
    if (!tenant?.lot?.id) return;
    
    setRegeneratingCode(true);
    try {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error } = await supabase
        .from("lots")
        .update({ join_code: newCode })
        .eq("id", tenant.lot.id);

      if (error) throw error;
      
      setJoinCode(newCode);
      toast.success("Code d'accès régénéré");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la régénération");
    } finally {
      setRegeneratingCode(false);
    }
  };

  if (!tenant) return null;

  const fullName = tenant.profile 
    ? `${tenant.profile.first_name || ""} ${tenant.profile.last_name || ""}`.trim() || "Sans nom"
    : "Sans nom";

  const initials = tenant.profile
    ? `${(tenant.profile.first_name || "")[0] || ""}${(tenant.profile.last_name || "")[0] || ""}`.toUpperCase() || "?"
    : "?";

  const lotInfo = tenant.lot
    ? `Lot ${tenant.lot.lot_number}`
    : "Non assigné";

  // Generate QR code data
  const qrData = JSON.stringify({
    type: "kopro_access",
    code: joinCode,
    lot: tenant.lot?.lot_number,
    user: tenant.user_id,
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-2 border-border">
                <AvatarImage src={tenant.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <SheetTitle className="text-xl">{fullName}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4" />
                  {lotInfo}
                  <Badge 
                    variant={tenant.is_active ? "default" : "secondary"}
                    className={tenant.is_active ? "bg-success/10 text-success border-success/20" : ""}
                  >
                    {tenant.type === "owner" ? "Propriétaire" : "Locataire"}
                  </Badge>
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="info">
                <User className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Infos</span>
              </TabsTrigger>
              <TabsTrigger value="qrcode">
                <QrCode className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">QR</span>
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Docs</span>
              </TabsTrigger>
              <TabsTrigger value="actions">
                <Mail className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Actions</span>
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Coordonnées</CardTitle>
                  {editing ? (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={handleSaveProfile}>
                        <Save className="h-4 w-4 mr-1" />
                        Sauver
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing && editedProfile ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Prénom</Label>
                          <Input
                            value={editedProfile.first_name || ""}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              first_name: e.target.value
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nom</Label>
                          <Input
                            value={editedProfile.last_name || ""}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              last_name: e.target.value
                            })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input
                          value={editedProfile.phone || ""}
                          onChange={(e) => setEditedProfile({
                            ...editedProfile,
                            phone: e.target.value
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={editedProfile.email || ""}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          L'email ne peut pas être modifié
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{tenant.profile?.email || "Non renseigné"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{tenant.profile?.phone || "Non renseigné"}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {tenant.lot && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Logement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Numéro de lot</span>
                      <span className="font-medium">{tenant.lot.lot_number}</span>
                    </div>
                    {tenant.lot.floor !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Étage</span>
                        <span className="font-medium">{tenant.lot.floor}</span>
                      </div>
                    )}
                    {tenant.lot.door && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Porte</span>
                        <span className="font-medium">{tenant.lot.door}</span>
                      </div>
                    )}
                    {tenant.lot.surface && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Surface</span>
                        <span className="font-medium">{tenant.lot.surface} m²</span>
                      </div>
                    )}
                    {tenant.lot.rooms && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pièces</span>
                        <span className="font-medium">{tenant.lot.rooms}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Occupation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="outline">
                      {tenant.type === "owner" ? "Propriétaire" : "Locataire"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Statut</span>
                    <Badge 
                      variant={tenant.is_active ? "default" : "secondary"}
                      className={tenant.is_active ? "bg-success/10 text-success" : ""}
                    >
                      {tenant.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  {tenant.start_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Début</span>
                      <span className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(tenant.start_date), "dd MMMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  )}
                  {tenant.end_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Fin</span>
                      <span className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(tenant.end_date), "dd MMMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* QR Code Tab */}
            <TabsContent value="qrcode" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Code d'accès
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {joinCode ? (
                    <>
                      {/* QR Code */}
                      <div className="flex justify-center p-4 bg-white rounded-lg">
                        <QRCodeSVG
                          value={qrData}
                          size={180}
                          level="H"
                          includeMargin
                        />
                      </div>

                      {/* Access Code */}
                      <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Code d'accès</p>
                        <div className="flex items-center justify-center gap-2">
                          <code className="text-2xl font-mono font-bold tracking-wider bg-muted px-4 py-2 rounded-lg">
                            {joinCode}
                          </code>
                          <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-center pt-2">
                        <Button
                          variant="outline"
                          onClick={handleRegenerateCode}
                          disabled={regeneratingCode}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingCode ? "animate-spin" : ""}`} />
                          Régénérer le code
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        Ce QR code permet au locataire d'accéder à la résidence.
                        Le code peut être partagé avec les membres du foyer.
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Aucun code d'accès configuré pour ce lot
                      </p>
                      <Button onClick={handleRegenerateCode} disabled={regeneratingCode}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingCode ? "animate-spin" : ""}`} />
                        Générer un code
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-4">
              <DocumentUpload
                tenantId={tenant.user_id}
                residenceId={residenceId}
                occupancyId={tenant.id}
                documents={documents}
                onDocumentAdded={fetchDocuments}
                onDocumentDeleted={fetchDocuments}
              />
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Envoyer un email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => setEmailDialog({ open: true, type: "document_reminder" })}
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="font-medium">Demander un document</div>
                      <div className="text-xs text-muted-foreground">
                        Assurance, pièce d'identité, etc.
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => setEmailDialog({ open: true, type: "rent_receipt" })}
                  >
                    <Receipt className="h-5 w-5 text-success" />
                    <div className="text-left">
                      <div className="font-medium">Envoyer une quittance</div>
                      <div className="text-xs text-muted-foreground">
                        Quittance de loyer mensuelle
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => setEmailDialog({ open: true, type: "rent_revision" })}
                  >
                    <TrendingUp className="h-5 w-5 text-warning" />
                    <div className="text-left">
                      <div className="font-medium">Révision de loyer</div>
                      <div className="text-xs text-muted-foreground">
                        Notifier une augmentation
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <EmailTemplateEditor
        open={emailDialog.open}
        onOpenChange={(open) => setEmailDialog({ ...emailDialog, open })}
        templateType={emailDialog.type}
        tenant={{
          name: fullName,
          email: tenant.profile?.email || "",
          lot_number: tenant.lot?.lot_number,
          rent_amount: 0, // Would come from payment data
          charges_amount: 0,
        }}
        residenceId={residenceId}
      />
    </>
  );
}
