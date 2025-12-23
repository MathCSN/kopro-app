import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function JoinResidence() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "login_required">("loading");
  const [residenceName, setResidenceName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!code) {
      setStatus("error");
      setErrorMessage("Aucun code d'invitation fourni.");
      return;
    }

    if (!user) {
      // Save code to localStorage and redirect to login
      localStorage.setItem("pending_invitation_code", code);
      setStatus("login_required");
      return;
    }

    joinResidence();
  }, [code, user]);

  const joinResidence = async () => {
    if (!user || !code) return;

    try {
      // Find the invitation with residence name
      const { data: invitation, error: invError } = await supabase
        .from('residence_invitations')
        .select(`
          *,
          residences (name)
        `)
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (invError) throw invError;

      if (!invitation) {
        setStatus("error");
        setErrorMessage("Ce code d'invitation n'existe pas ou a expiré.");
        return;
      }

      setResidenceName(invitation.residences?.name || "");

      // Check if expired
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        setStatus("error");
        setErrorMessage("Ce code d'invitation a expiré.");
        return;
      }

      // Check max uses
      if (invitation.max_uses && invitation.uses_count >= invitation.max_uses) {
        setStatus("error");
        setErrorMessage("Ce code d'invitation a atteint son nombre maximum d'utilisations.");
        return;
      }

      // Check if user already has role for this residence
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('residence_id', invitation.residence_id)
        .maybeSingle();

      if (existingRole) {
        setStatus("success");
        setResidenceName(invitation.residences?.name || "");
        toast({
          title: "Déjà membre",
          description: "Vous êtes déjà membre de cette résidence.",
        });
        return;
      }

      // Add resident role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'resident',
          residence_id: invitation.residence_id,
        });

      if (roleError) throw roleError;

      // Increment uses count
      await supabase
        .from('residence_invitations')
        .update({ uses_count: invitation.uses_count + 1 })
        .eq('id', invitation.id);

      // Clear any stored invitation code
      localStorage.removeItem("pending_invitation_code");

      setStatus("success");
      toast({
        title: "Bienvenue !",
        description: `Vous avez rejoint ${invitation.residences?.name || "la résidence"} avec succès.`,
      });
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message || "Une erreur est survenue.");
    }
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleGoToAuth = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            status === "loading" ? "bg-primary/10" :
            status === "success" ? "bg-green-100 dark:bg-green-900/30" :
            status === "login_required" ? "bg-blue-100 dark:bg-blue-900/30" :
            "bg-red-100 dark:bg-red-900/30"
          }`}>
            {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            {status === "success" && <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />}
            {status === "login_required" && <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />}
            {status === "error" && <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Traitement en cours..."}
            {status === "success" && "Bienvenue !"}
            {status === "login_required" && "Connexion requise"}
            {status === "error" && "Erreur"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Nous vérifions votre code d'invitation."}
            {status === "success" && `Vous avez rejoint ${residenceName || "la résidence"} avec succès.`}
            {status === "login_required" && "Connectez-vous ou créez un compte pour rejoindre la résidence."}
            {status === "error" && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" && (
            <Button className="w-full" onClick={handleGoToDashboard}>
              Accéder à mon espace
            </Button>
          )}
          {status === "login_required" && (
            <Button className="w-full" onClick={handleGoToAuth}>
              Se connecter / S'inscrire
            </Button>
          )}
          {status === "error" && (
            <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
              Retour à l'accueil
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
