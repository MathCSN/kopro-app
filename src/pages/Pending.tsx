import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogOut, QrCode, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Pending() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invitationCode, setInvitationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingRoles, setIsCheckingRoles] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkUserRoles();
  }, [user]);

  const checkUserRoles = async () => {
    if (!user) return;
    
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      if (roles && roles.length > 0) {
        // User has roles, redirect based on role
        const hasOwnerRole = roles.some(r => r.role === 'owner');
        if (hasOwnerRole) {
          navigate("/owner");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error checking roles:", error);
    } finally {
      setIsCheckingRoles(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!invitationCode.trim() || !user) return;

    setIsSubmitting(true);
    try {
      // Find the invitation
      const { data: invitation, error: invError } = await supabase
        .from('residence_invitations')
        .select('*')
        .eq('code', invitationCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (invError) throw invError;

      if (!invitation) {
        toast({
          title: "Code invalide",
          description: "Ce code d'invitation n'existe pas ou a expiré.",
          variant: "destructive",
        });
        return;
      }

      // Check if expired
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        toast({
          title: "Code expiré",
          description: "Ce code d'invitation a expiré.",
          variant: "destructive",
        });
        return;
      }

      // Check max uses
      if (invitation.max_uses && invitation.uses_count >= invitation.max_uses) {
        toast({
          title: "Code épuisé",
          description: "Ce code d'invitation a atteint son nombre maximum d'utilisations.",
          variant: "destructive",
        });
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
        toast({
          title: "Déjà membre",
          description: "Vous êtes déjà membre de cette résidence.",
          variant: "destructive",
        });
        navigate("/dashboard");
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

      toast({
        title: "Bienvenue !",
        description: "Vous avez rejoint la résidence avec succès.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (isCheckingRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">En attente d'attribution</CardTitle>
          <CardDescription>
            Votre compte a été créé mais aucun rôle ne vous a encore été attribué.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Un administrateur doit vous attribuer un rôle pour accéder à la plateforme.</p>
            <p className="mt-2">Vous pouvez également entrer un code d'invitation si vous en avez un.</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Code d'invitation</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Entrez votre code..."
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                maxLength={8}
              />
              <Button 
                onClick={handleSubmitCode} 
                disabled={!invitationCode.trim() || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider"}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
