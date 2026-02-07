import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Users, Shield, Book } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


export default function Help() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold">Aide & Documentation</h1>
          <p className="text-muted-foreground mt-1">Guide d'utilisation de Kopro</p>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Rôles & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><strong>Admin:</strong> Administrateur de la plateforme, accès complet</div>
            <div><strong>Responsable:</strong> Responsable d'agence, gestion opérationnelle</div>
            <div><strong>Collaborateur:</strong> Équipe de l'agence, droits configurables</div>
            <div><strong>Résident:</strong> Accès personnel, signalements, votes</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Book className="h-5 w-5" /> Guide de démarrage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Pour les résidents:</strong>
              <p className="text-muted-foreground">Scannez le QR code de votre résidence ou entrez le code fourni par votre gestionnaire pour rejoindre votre espace.</p>
            </div>
            <div>
              <strong>Pour les gestionnaires:</strong>
              <p className="text-muted-foreground">Créez votre compte professionnel, configurez votre agence et ajoutez vos résidences depuis l'espace d'administration.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Besoin d'aide ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Pour toute question ou assistance, contactez votre gestionnaire de résidence ou notre équipe support.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
