import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  Users, 
  Copy, 
  UserPlus, 
  UserMinus, 
  Crown,
  QrCode,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
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

interface HouseholdMember {
  id: string;
  user_id: string;
  type: string;
  is_active: boolean;
  start_date: string | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface LotInfo {
  id: string;
  lot_number: string;
  door: string | null;
  floor: number | null;
  join_code: string | null;
  primary_resident_id: string | null;
  residence: {
    id: string;
    name: string;
  } | null;
}

export default function Household() {
  const { user, logout, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [lot, setLot] = useState<LotInfo | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<HouseholdMember | null>(null);

  useEffect(() => {
    if (user) {
      fetchHouseholdData();
    }
  }, [user]);

  const fetchHouseholdData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch user's active occupancy
      const { data: occupancy, error: occError } = await supabase
        .from("occupancies")
        .select(`
          lot_id,
          lot:lots (
            id,
            lot_number,
            door,
            floor,
            join_code,
            primary_resident_id,
            residence:residences (
              id,
              name
            )
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (occError) throw occError;

      if (!occupancy?.lot) {
        setLot(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      const lotData = occupancy.lot as unknown as LotInfo;
      setLot(lotData);

      // Fetch all members of this lot
      const { data: occupancies, error: membersError } = await supabase
        .from("occupancies")
        .select("id, user_id, type, is_active, start_date")
        .eq("lot_id", lotData.id)
        .eq("is_active", true);

      if (membersError) throw membersError;

      // Fetch profiles for all members
      const userIds = occupancies?.map(o => o.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url")
        .in("id", userIds);

      const membersData: HouseholdMember[] = (occupancies || []).map(o => ({
        ...o,
        profile: profiles?.find(p => p.id === o.user_id) || null
      }));

      setMembers(membersData);
    } catch (error) {
      console.error("Error fetching household:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du foyer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (lot?.join_code) {
      navigator.clipboard.writeText(lot.join_code);
      toast({
        title: "Code copié",
        description: "Le code d'invitation a été copié dans le presse-papier.",
      });
    }
  };

  const handleRegenerateCode = async () => {
    if (!lot || !isPrimaryResident) return;

    setRegenerating(true);
    try {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error } = await supabase
        .from("lots")
        .update({ join_code: newCode })
        .eq("id", lot.id);

      if (error) throw error;
      
      setLot({ ...lot, join_code: newCode });
      toast({
        title: "Code régénéré",
        description: "Un nouveau code d'invitation a été généré.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de régénérer le code.",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove || !lot) return;

    try {
      const { error } = await supabase
        .from("occupancies")
        .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] })
        .eq("id", memberToRemove.id);

      if (error) throw error;

      // Also remove user role if they have no other active occupancies
      const { data: otherOccupancies } = await supabase
        .from("occupancies")
        .select("id")
        .eq("user_id", memberToRemove.user_id)
        .eq("is_active", true)
        .neq("id", memberToRemove.id);

      if (!otherOccupancies || otherOccupancies.length === 0) {
        // Remove resident role for this residence
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", memberToRemove.user_id)
          .eq("residence_id", lot.residence?.id)
          .eq("role", "resident");
      }

      toast({
        title: "Membre retiré",
        description: "Le membre a été retiré du foyer.",
      });
      
      setMemberToRemove(null);
      fetchHouseholdData();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de retirer le membre.",
        variant: "destructive",
      });
    }
  };

  const isPrimaryResident = lot?.primary_resident_id === user?.id;

  const getInitials = (member: HouseholdMember) => {
    if (!member.profile) return "?";
    const first = member.profile.first_name?.[0] || "";
    const last = member.profile.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getMemberName = (member: HouseholdMember) => {
    if (!member.profile) return "Utilisateur";
    return `${member.profile.first_name || ""} ${member.profile.last_name || ""}`.trim() || "Utilisateur";
  };

  if (!user) return null;

  return (
    <AppLayout userRole="resident" onLogout={logout}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Mon Foyer</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les membres de votre appartement
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !lot ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun logement associé</h3>
              <p className="text-muted-foreground">
                Vous n'êtes pas encore associé à un appartement.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Apartment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Mon Appartement
                </CardTitle>
                <CardDescription>
                  {lot.residence?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Numéro</span>
                  <span className="font-medium">{lot.lot_number}</span>
                </div>
                {lot.floor !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Étage</span>
                    <span className="font-medium">{lot.floor}</span>
                  </div>
                )}
                {lot.door && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Porte</span>
                    <span className="font-medium">{lot.door}</span>
                  </div>
                )}
                
                {isPrimaryResident && (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    <Crown className="h-3 w-3 mr-1" />
                    Résident principal
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Invitation Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Code d'invitation
                </CardTitle>
                <CardDescription>
                  Partagez ce code pour inviter des membres
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lot.join_code ? (
                  <>
                    <div className="flex justify-center p-4 bg-background rounded-lg border">
                      <QRCodeSVG
                        value={JSON.stringify({
                          type: "kopro_household",
                          code: lot.join_code,
                          lot: lot.lot_number,
                        })}
                        size={120}
                        level="H"
                        includeMargin
                      />
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Code</p>
                      <div className="flex items-center justify-center gap-2">
                        <code className="text-xl font-mono font-bold tracking-wider bg-muted px-4 py-2 rounded-lg">
                          {lot.join_code}
                        </code>
                        <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isPrimaryResident && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleRegenerateCode}
                        disabled={regenerating}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? "animate-spin" : ""}`} />
                        Régénérer le code
                      </Button>
                    )}

                    <p className="text-xs text-muted-foreground text-center">
                      {isPrimaryResident 
                        ? "Partagez ce code avec les membres de votre foyer pour qu'ils puissent rejoindre l'appartement."
                        : "Seul le résident principal peut régénérer le code."}
                    </p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <QrCode className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Aucun code disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Household Members */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Membres du foyer
                </CardTitle>
                <CardDescription>
                  {members.length} membre{members.length > 1 ? "s" : ""} dans ce foyer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {members.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{getMemberName(member)}</p>
                            {lot.primary_resident_id === member.user_id && (
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Principal
                              </Badge>
                            )}
                            {member.user_id === user.id && (
                              <Badge variant="outline" className="text-xs">Vous</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {member.profile?.email}
                          </p>
                        </div>
                      </div>

                      {isPrimaryResident && member.user_id !== user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setMemberToRemove(member)}
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          Retirer
                        </Button>
                      )}
                    </div>
                  ))}

                  {members.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Aucun membre dans ce foyer</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Remove Member Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove && (
                <>
                  Êtes-vous sûr de vouloir retirer <strong>{getMemberName(memberToRemove)}</strong> du foyer ?
                  Cette personne ne pourra plus accéder aux fonctionnalités de la résidence.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
