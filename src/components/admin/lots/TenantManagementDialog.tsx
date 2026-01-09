import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Mail, 
  Loader2, 
  UserPlus, 
  Users, 
  Trash2, 
  Home,
  Calendar,
  User
} from "lucide-react";
import { z } from "zod";

interface TenantManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotId: string;
  lotNumber: string;
  residenceId: string;
  residenceName: string;
  onSuccess?: () => void;
}

interface Occupant {
  id: string;
  user_id: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

const OCCUPANCY_TYPES = [
  { value: "owner", label: "Propriétaire" },
  { value: "tenant", label: "Locataire" },
  { value: "occupant", label: "Occupant" },
];

const emailSchema = z.string().email("Adresse email invalide");

export function TenantManagementDialog({
  open,
  onOpenChange,
  lotId,
  lotNumber,
  residenceId,
  residenceName,
  onSuccess,
}: TenantManagementDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("occupants");
  const [loading, setLoading] = useState(false);
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  
  // Invite form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [occupancyType, setOccupancyType] = useState("tenant");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Delete confirmation
  const [deletingOccupant, setDeletingOccupant] = useState<Occupant | null>(null);

  useEffect(() => {
    if (open && lotId) {
      fetchOccupants();
    }
  }, [open, lotId]);

  const fetchOccupants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("occupancies")
        .select(`
          id,
          user_id,
          type,
          start_date,
          end_date,
          is_active
        `)
        .eq("lot_id", lotId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each occupant
      const occupantsWithProfiles: Occupant[] = [];
      for (const occ of data || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, email, phone")
          .eq("id", occ.user_id)
          .single();
        
        occupantsWithProfiles.push({
          ...occ,
          profile: profile || null,
        });
      }

      setOccupants(occupantsWithProfiles);
    } catch (error) {
      console.error("Error fetching occupants:", error);
      toast.error("Erreur lors du chargement des occupants");
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (value: string) => {
    try {
      emailSchema.parse(value);
      setEmailError(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
      return false;
    }
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!validateEmail(email)) {
        throw new Error("Email invalide");
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      let userId: string;

      if (existingProfile) {
        // User exists, use their ID
        userId = existingProfile.id;

        // Check if already has role in this residence
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("residence_id", residenceId)
          .maybeSingle();

        if (!existingRole) {
          // Add resident role to the residence
          await supabase.from("user_roles").insert({
            user_id: userId,
            role: "resident",
            residence_id: residenceId,
          });
        }

        // Check if already occupant of this lot
        const { data: existingOccupancy } = await supabase
          .from("occupancies")
          .select("id")
          .eq("lot_id", lotId)
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        if (existingOccupancy) {
          throw new Error("Cet utilisateur occupe déjà cet appartement");
        }

        // Create occupancy
        const { error: occError } = await supabase.from("occupancies").insert({
          lot_id: lotId,
          user_id: userId,
          type: occupancyType,
          start_date: startDate,
          is_active: true,
        });

        if (occError) throw occError;

        return { type: "existing" as const, emailSent: false };
      }

      // User doesn't exist - create invitation
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Generate a unique token for the lot assignment
      const token = crypto.randomUUID();

      // Create invitation record with lot assignment metadata
      const { error: inviteError } = await supabase
        .from("residence_invitations")
        .insert({
          residence_id: residenceId,
          email: email.toLowerCase(),
          first_name: firstName || null,
          last_name: lastName || null,
          role: "resident",
          message: `Vous êtes invité(e) comme ${OCCUPANCY_TYPES.find(t => t.value === occupancyType)?.label || 'locataire'} de l'appartement ${lotNumber}.`,
          invited_by: user?.id || null,
          expires_at: expiresAt.toISOString(),
          token,
        });

      if (inviteError) throw inviteError;

      // Store the lot assignment info for when user accepts
      // We'll handle this through the apartment_requests table
      await supabase.from("apartment_requests").insert({
        residence_id: residenceId,
        user_id: user?.id || "00000000-0000-0000-0000-000000000000",
        assigned_lot_id: lotId,
        status: "pending_invite",
        message: JSON.stringify({
          invited_email: email.toLowerCase(),
          occupancy_type: occupancyType,
          start_date: startDate,
          token,
        }),
      });

      // Build invitation link
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/auth/register-resident?token=${token}&email=${encodeURIComponent(email)}`;

      // Send invitation email
      const { error: emailError } = await supabase.functions.invoke("send-email", {
        body: {
          to: email,
          subject: `Invitation à rejoindre ${residenceName} - Appartement ${lotNumber}`,
          body: `
Bonjour${firstName ? ` ${firstName}` : ""},

Vous êtes invité(e) à rejoindre la résidence "${residenceName}" en tant que ${OCCUPANCY_TYPES.find(t => t.value === occupancyType)?.label || 'locataire'} de l'appartement ${lotNumber}.

Pour créer votre compte et accéder à votre espace résident, cliquez sur le lien ci-dessous :

${inviteLink}

Ce lien est valable pendant 30 jours.

Grâce à votre espace, vous pourrez :
• Consulter les documents de la résidence
• Communiquer avec le gestionnaire
• Signaler des incidents
• Et bien plus encore !

Cordialement,
L'équipe de gestion
          `,
        },
      });

      return { type: "invited" as const, emailSent: !emailError };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      queryClient.invalidateQueries({ queryKey: ["occupancies"] });
      
      if (result.type === "existing") {
        toast.success("Occupant ajouté avec succès");
      } else if (result.emailSent) {
        toast.success("Invitation envoyée par email");
      } else {
        toast.success("Invitation enregistrée (vérifiez la configuration email)");
      }
      
      resetForm();
      fetchOccupants();
      onSuccess?.();
      setActiveTab("occupants");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeOccupantMutation = useMutation({
    mutationFn: async (occupantId: string) => {
      // Soft delete - mark as inactive
      const { error } = await supabase
        .from("occupancies")
        .update({ 
          is_active: false, 
          end_date: new Date().toISOString().split('T')[0] 
        })
        .eq("id", occupantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lots"] });
      queryClient.invalidateQueries({ queryKey: ["occupancies"] });
      toast.success("Occupant retiré de l'appartement");
      setDeletingOccupant(null);
      fetchOccupants();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setLastName("");
    setOccupancyType("tenant");
    setStartDate(new Date().toISOString().split('T')[0]);
    setEmailError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const getOccupantName = (occupant: Occupant) => {
    if (occupant.profile?.first_name || occupant.profile?.last_name) {
      return `${occupant.profile.first_name || ""} ${occupant.profile.last_name || ""}`.trim();
    }
    return occupant.profile?.email || "Utilisateur";
  };

  const getInitials = (occupant: Occupant) => {
    if (occupant.profile?.first_name && occupant.profile?.last_name) {
      return `${occupant.profile.first_name[0]}${occupant.profile.last_name[0]}`.toUpperCase();
    }
    if (occupant.profile?.email) {
      return occupant.profile.email[0].toUpperCase();
    }
    return "?";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Appartement {lotNumber}
            </DialogTitle>
            <DialogDescription>
              Gérez les occupants de cet appartement
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="occupants" className="gap-2">
                <Users className="h-4 w-4" />
                Occupants ({occupants.length})
              </TabsTrigger>
              <TabsTrigger value="invite" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Inviter
              </TabsTrigger>
            </TabsList>

            <TabsContent value="occupants" className="mt-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : occupants.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Aucun occupant</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("invite")}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Inviter un locataire
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {occupants.map((occupant) => (
                    <div 
                      key={occupant.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(occupant)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{getOccupantName(occupant)}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {OCCUPANCY_TYPES.find(t => t.value === occupant.type)?.label || occupant.type}
                            </Badge>
                            {occupant.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Depuis {new Date(occupant.start_date).toLocaleDateString("fr-FR")}
                              </span>
                            )}
                          </div>
                          {occupant.profile?.email && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {occupant.profile.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingOccupant(occupant)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invite" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email du locataire *</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="locataire@exemple.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    className={emailError ? "border-destructive" : ""}
                  />
                  {emailError && (
                    <p className="text-sm text-destructive">{emailError}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="invite-firstname">Prénom</Label>
                    <Input
                      id="invite-firstname"
                      placeholder="Jean"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-lastname">Nom</Label>
                    <Input
                      id="invite-lastname"
                      placeholder="Dupont"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Type d'occupation</Label>
                  <Select value={occupancyType} onValueChange={setOccupancyType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCUPANCY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-startdate">Date d'entrée</Label>
                  <Input
                    id="invite-startdate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-1">📧 Un email sera envoyé au locataire avec :</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Un lien pour créer son compte</li>
                    <li>L'accès automatique à l'appartement {lotNumber}</li>
                    <li>Les informations de la résidence</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Fermer
            </Button>
            {activeTab === "invite" && (
              <Button 
                onClick={() => inviteMutation.mutate()} 
                disabled={inviteMutation.isPending || !email}
                className="gap-2"
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Envoyer l'invitation
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingOccupant} onOpenChange={() => setDeletingOccupant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cet occupant ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingOccupant && (
                <>
                  <strong>{getOccupantName(deletingOccupant)}</strong> sera retiré de l'appartement {lotNumber}. 
                  Cette action mettra fin à son occupation mais ne supprimera pas son compte.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingOccupant && removeOccupantMutation.mutate(deletingOccupant.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeOccupantMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
