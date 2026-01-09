import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, Loader2, Smartphone, ArrowRight, Apple, Download, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_MESSAGES } from "@/lib/messages";

type Residence = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
};

type Building = {
  id: string;
  name: string;
  residence_id: string;
};

// Public client (no session) so the landing page works even if the user is logged in
// without leaking their authenticated token into a route meant to be public.
const publicSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

export default function ResidenceLanding() {
  const { residenceCode } = useParams<{ residenceCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [status, setStatus] = useState<"loading" | "found" | "not_found">("loading");
  const [residence, setResidence] = useState<Residence | null>(null);
  const [building, setBuilding] = useState<Building | null>(null);

  useEffect(() => {
    if (!residenceCode) {
      setStatus("not_found");
      return;
    }
    fetchResidence();
  }, [residenceCode]);

  const fetchResidence = async () => {
    try {
      // The residenceCode could be:
      // 1. A full UUID (residence ID)
      // 2. A short code (first 8 chars of UUID) for residence
      // 3. A short code (first 8 chars of UUID) for building
      
      let residenceData: Residence | null = null;
      let buildingData: Building | null = null;
      const code = residenceCode?.toLowerCase().trim() || "";

      // First try as full UUID for residence
      if (code.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { data: byId } = await publicSupabase
          .from("residences")
          .select("id, name, address, city")
          .eq("id", code)
          .maybeSingle();

        if (byId) {
          residenceData = byId;
        }
      }
      
      // If not found as residence UUID, try as building UUID
      if (!residenceData && code.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { data: buildingById } = await publicSupabase
          .from("buildings")
          .select("id, name, residence_id")
          .eq("id", code)
          .maybeSingle();

        if (buildingById) {
          buildingData = buildingById;
          // Get residence info for this building
          const { data: resForBuilding } = await publicSupabase
            .from("residences")
            .select("id, name, address, city")
            .eq("id", buildingById.residence_id)
            .maybeSingle();
          
          if (resForBuilding) {
            residenceData = resForBuilding;
          }
        }
      }
      
      // If not found by full UUID, try matching by short code (first 8 chars) for residence
      if (!residenceData && code.length >= 6) {
        const { data: allResidences } = await publicSupabase
          .from("residences")
          .select("id, name, address, city");
        
        // Find residence where ID starts with the entered code
        residenceData = allResidences?.find((r) => r.id.toLowerCase().startsWith(code)) || null;
      }
      
      // If still not found, try short code for building
      if (!residenceData && code.length >= 6) {
        const { data: allBuildings } = await publicSupabase
          .from("buildings")
          .select("id, name, residence_id");
        
        // Find building where ID starts with the entered code
        const foundBuilding = allBuildings?.find((b) => b.id.toLowerCase().startsWith(code));
        
        if (foundBuilding) {
          buildingData = foundBuilding;
          // Get residence info for this building
          const { data: resForBuilding } = await publicSupabase
            .from("residences")
            .select("id, name, address, city")
            .eq("id", foundBuilding.residence_id)
            .maybeSingle();
          
          if (resForBuilding) {
            residenceData = resForBuilding;
          }
        }
      }

      if (!residenceData) {
        setStatus("not_found");
        return;
      }

      setResidence(residenceData);
      setBuilding(buildingData);
      setStatus("found");
    } catch (error) {
      console.error("Error fetching residence:", error);
      setStatus("not_found");
    }
  };

  const handleContinue = () => {
    if (!residence) return;
    
    if (user) {
      // User is logged in, go to join flow
      const params = new URLSearchParams({ residence: residence.id });
      if (building) {
        params.append('building', building.id);
      }
      navigate(`/join?${params.toString()}`);
    } else {
      // Store residence ID for after login
      localStorage.setItem("pending_join_residence", residence.id);
      if (building) {
        localStorage.setItem("pending_join_building", building.id);
      }
      navigate("/auth/register-resident");
    }
  };

  const handleLogin = () => {
    if (residence) {
      localStorage.setItem("pending_join_residence", residence.id);
      if (building) {
        localStorage.setItem("pending_join_building", building.id);
      }
    }
    navigate("/auth/login");
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found state
  if (status === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">{AUTH_MESSAGES.RESIDENCE_NOT_FOUND}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Le QR code scanné ne correspond à aucune résidence. Vérifiez que vous avez scanné le bon QR code ou contactez votre gestionnaire.
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Found - show landing page
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="p-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
            <Building2 className="h-6 w-6 text-accent-foreground" />
          </div>
          <span className="font-display font-bold text-2xl">KOPRO</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 text-center">
          {/* Residence info */}
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                {residence?.name}
              </h1>
              {building && (
                <p className="text-lg font-medium text-primary mt-1">
                  {building.name}
                </p>
              )}
              {residence?.address && (
                <p className="text-muted-foreground mt-1">
                  {residence.address}{residence.city ? `, ${residence.city}` : ""}
                </p>
              )}
            </div>
          </div>

          {/* App description */}
          <div className="space-y-3">
            <h2 className="font-display text-xl font-semibold">
              Bienvenue sur l'application Kopro
            </h2>
            <p className="text-muted-foreground">
              Accédez à votre espace résident pour gérer vos incidents, documents, paiements et communiquer avec votre gestionnaire.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full h-14 text-lg" 
              onClick={handleContinue}
            >
              {user ? "Rejoindre la résidence" : "Créer un compte"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            {!user && (
              <Button 
                variant="outline" 
                className="w-full h-12"
                onClick={handleLogin}
              >
                J'ai déjà un compte - Se connecter
              </Button>
            )}
          </div>

          {/* App store buttons (placeholders) */}
          <div className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">Téléchargez l'application mobile</p>
            <div className="flex gap-3 justify-center">
              <button 
                className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                onClick={() => {
                  // Placeholder - would link to App Store
                  alert("Lien App Store à venir");
                }}
              >
                <Apple className="h-5 w-5" />
                <div className="text-left">
                  <div className="text-[10px] opacity-80">Télécharger sur</div>
                  <div className="text-sm font-semibold">App Store</div>
                </div>
              </button>
              <button 
                className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                onClick={() => {
                  // Placeholder - would link to Play Store
                  alert("Lien Google Play à venir");
                }}
              >
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <div className="text-[10px] opacity-80">Télécharger sur</div>
                  <div className="text-sm font-semibold">Google Play</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-muted-foreground">
        <p>Kopro - Gestion de copropriété simplifiée</p>
      </footer>
    </div>
  );
}
