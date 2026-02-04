import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Loader2, CheckCircle, XCircle, Home, Lock, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { publicSupabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { NoApartmentAvailable } from "@/components/residence/NoApartmentAvailable";
import { AUTH_MESSAGES } from "@/lib/messages";

type Lot = {
  id: string;
  lot_number: string;
  door: string | null;
  floor: number | null;
  type: string | null;
  primary_resident_id: string | null;
  join_code: string | null;
  building_id: string | null;
};

type Building = {
  id: string;
  name: string;
};

type Residence = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
};

export default function JoinResidence() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const residenceId = searchParams.get("residence");
  const buildingId = searchParams.get("building");
  
  const [status, setStatus] = useState<"loading" | "select_lot" | "enter_code" | "success" | "error" | "login_required" | "no_apartments">("loading");
  const [residence, setResidence] = useState<Residence | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [apartmentCode, setApartmentCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managerEmail, setManagerEmail] = useState<string | undefined>();
  const [building, setBuilding] = useState<Building | null>(null);

  useEffect(() => {
    if (!residenceId) {
      setStatus("error");
      setErrorMessage(AUTH_MESSAGES.NO_RESIDENCE_SPECIFIED);
      return;
    }

    if (!user) {
      localStorage.setItem("pending_join_residence", residenceId);
      setStatus("login_required");
      return;
    }

    loadResidenceData();
  }, [residenceId, user]);

  const loadResidenceData = async () => {
    if (!residenceId || !user) return;

    try {
      // Check if user already has a role in this residence
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('residence_id', residenceId)
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Déjà membre",
          description: "Vous êtes déjà membre de cette résidence.",
        });
        navigate("/dashboard");
        return;
      }

      // Fetch residence info using public client to bypass RLS
      const { data: residenceData, error: resError } = await publicSupabase
        .from('residences')
        .select('id, name, address, city')
        .eq('id', residenceId)
        .maybeSingle();

      if (resError || !residenceData) {
        console.error('Residence fetch error:', resError);
        setStatus("error");
        setErrorMessage(AUTH_MESSAGES.RESIDENCE_NOT_FOUND);
        return;
      }

      setResidence(residenceData);

      // Fetch manager email for contact using public client
      const { data: managerRoles } = await publicSupabase
        .from('user_roles')
        .select('user_id')
        .eq('residence_id', residenceId)
        .in('role', ['manager', 'admin'])
        .limit(1);

      if (managerRoles && managerRoles.length > 0) {
        const { data: managerProfile } = await publicSupabase
          .from('profiles')
          .select('email')
          .eq('id', managerRoles[0].user_id)
          .maybeSingle();
        
        if (managerProfile?.email) {
          setManagerEmail(managerProfile.email);
        }
      }

      // If buildingId is specified, fetch building info
      if (buildingId) {
        const { data: buildingData } = await publicSupabase
          .from('buildings')
          .select('id, name')
          .eq('id', buildingId)
          .maybeSingle();
        
        if (buildingData) {
          setBuilding(buildingData);
        }
      }

      // Fetch lots for this residence using the authenticated client.
      // IMPORTANT: a resident needs to see the lots BEFORE having a role in the residence.
      // Using the public (anon) client here would return an empty list because of RLS.
      let lotsQuery = supabase
        .from('lots')
        .select('id, lot_number, door, floor, type, primary_resident_id, join_code, building_id')
        .eq('residence_id', residenceId)
        .order('floor', { ascending: true })
        .order('door', { ascending: true });

      // Filter by building if specified
      if (buildingId) {
        lotsQuery = lotsQuery.eq('building_id', buildingId);
      }

      const { data: lotsData, error: lotsError } = await lotsQuery;

      if (lotsError) throw lotsError;
      if (!lotsData || lotsData.length === 0) {
        setStatus("no_apartments");
      } else {
        setLots(lotsData);
        setStatus("select_lot");
      }
      
      localStorage.removeItem("pending_join_residence");
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Une erreur est survenue.");
    }
  };

  const handleSelectLot = (lot: Lot) => {
    setSelectedLot(lot);
    if (lot.primary_resident_id) {
      setStatus("enter_code");
    } else {
      // Lot is free, user becomes primary resident
      claimLot(lot, true);
    }
  };

  const handleSubmitCode = async () => {
    if (!selectedLot || !apartmentCode.trim()) return;

    if (apartmentCode.trim().toUpperCase() !== selectedLot.join_code) {
      toast({
        title: "Code incorrect",
        description: "Le code de l'appartement est invalide.",
        variant: "destructive",
      });
      return;
    }

    await claimLot(selectedLot, false);
  };

  const claimLot = async (lot: Lot, isPrimary: boolean) => {
    if (!user || !residenceId) return;

    setIsSubmitting(true);
    try {
      // Add resident role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'resident',
          residence_id: residenceId,
        });

      if (roleError) throw roleError;

      // Create occupancy
      const { error: occError } = await supabase
        .from('occupancies')
        .insert({
          lot_id: lot.id,
          user_id: user.id,
          type: isPrimary ? 'owner' : 'occupant',
          is_active: true,
          start_date: new Date().toISOString().split('T')[0],
        });

      if (occError) throw occError;

      // If primary, update the lot
      if (isPrimary) {
        const { error: lotError } = await supabase
          .from('lots')
          .update({ primary_resident_id: user.id })
          .eq('id', lot.id);

        if (lotError) throw lotError;
      }

      setStatus("success");
      toast({
        title: "Bienvenue !",
        description: `Vous avez rejoint l'appartement ${lot.door || lot.lot_number}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de rejoindre l'appartement.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleGoToAuth = () => {
    navigate("/auth/login");
  };

  const handleGoBack = () => {
    navigate("/");
  };

  const getLotLabel = (lot: Lot) => {
    const parts = [];
    if (lot.floor !== null) parts.push(`Étage ${lot.floor}`);
    if (lot.door) parts.push(`Porte ${lot.door}`);
    if (parts.length === 0) parts.push(`Lot ${lot.lot_number}`);
    return parts.join(' - ');
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Login required
  if (status === "login_required") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Connexion requise</CardTitle>
            <CardDescription>
              Connectez-vous ou créez un compte pour rejoindre la résidence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleGoToAuth}>
              Se connecter / S'inscrire
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Erreur</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={handleGoBack}>
              Retour à l'accueil
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleGoToAuth}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No apartments available
  if (status === "no_apartments" && residence && user) {
    const userName = profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.email || user.email || "Résident";
    const userEmail = profile?.email || user.email || "";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <NoApartmentAvailable
          residenceId={residenceId!}
          residenceName={residence.name}
          userId={user.id}
          userName={userName}
          userEmail={userEmail}
          managerEmail={managerEmail}
          onRequestSent={() => {
            // Optionally redirect or show different UI after request sent
          }}
        />
      </div>
    );
  }

  // Success state
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Bienvenue !</CardTitle>
            <CardDescription>
              Vous avez rejoint {residence?.name} avec succès.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleGoToDashboard}>
              Accéder à mon espace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enter apartment code
  if (status === "enter_code") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-soft">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl">Appartement occupé</CardTitle>
            <CardDescription>
              Cet appartement a déjà un résident principal. Pour le rejoindre, demandez-lui le code de partage de l'appartement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{getLotLabel(selectedLot!)}</p>
              <p className="text-sm text-muted-foreground">{residence?.name}</p>
            </div>

            <div className="space-y-2">
              <Label>Code de l'appartement</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: ABC123"
                  value={apartmentCode}
                  onChange={(e) => setApartmentCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                  maxLength={6}
                />
                <Button onClick={handleSubmitCode} disabled={!apartmentCode.trim() || isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider"}
                </Button>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                setSelectedLot(null);
                setApartmentCode("");
                setStatus("select_lot");
              }}
            >
              Choisir un autre appartement
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Select lot
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-soft">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Rejoindre {residence?.name}
            {building && <span className="block text-lg font-normal text-muted-foreground mt-1">{building.name}</span>}
          </CardTitle>
          <CardDescription>
            {residence?.address && `${residence.address}, `}{residence?.city}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Sélectionnez votre appartement</Label>
            {lots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun appartement disponible. Contactez le gestionnaire de la résidence.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {lots.map((lot) => (
                  <button
                    key={lot.id}
                    onClick={() => handleSelectLot(lot)}
                    disabled={isSubmitting}
                    className="w-full p-3 border rounded-lg text-left hover:bg-muted/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Home className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{getLotLabel(lot)}</p>
                        {lot.type && (
                          <p className="text-xs text-muted-foreground">{lot.type}</p>
                        )}
                      </div>
                    </div>
                    {lot.primary_resident_id ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <KeyRound className="h-3 w-3" />
                        Code requis
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Disponible</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
