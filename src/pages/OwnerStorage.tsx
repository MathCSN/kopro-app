import { useNavigate } from "react-router-dom";
import { Database, Upload, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";

export default function OwnerStorage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <OwnerLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Stockage</h1>
            <p className="text-muted-foreground mt-1">Gérez l'espace de stockage de la plateforme</p>
          </div>
          <Button variant="outline">
            <Trash2 className="h-4 w-4 mr-2" />
            Nettoyer
          </Button>
        </div>

        {/* Storage overview */}
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold">Espace utilisé</p>
                <p className="text-sm text-muted-foreground">0 Go sur 100 Go</p>
              </div>
              <p className="text-2xl font-bold">0%</p>
            </div>
            <Progress value={0} className="h-2" />
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Documents</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Images</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Vidéos</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Autres</p>
            </CardContent>
          </Card>
        </div>

        {/* Empty state */}
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Stockage vide</h3>
            <p className="text-muted-foreground mb-4">
              Les fichiers de vos résidences apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
