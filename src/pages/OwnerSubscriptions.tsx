import { useNavigate } from "react-router-dom";
import { FileText, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";

export default function OwnerSubscriptions() {
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
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Abonnements</h1>
            <p className="text-muted-foreground mt-1">Gérez les abonnements des résidences</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau plan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Abonnements actifs</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">0€</p>
              <p className="text-sm text-muted-foreground">MRR</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Essais en cours</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">0%</p>
              <p className="text-sm text-muted-foreground">Taux de rétention</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un abonnement..." className="pl-10" />
        </div>

        {/* Empty state */}
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun abonnement</h3>
            <p className="text-muted-foreground mb-4">
              Les abonnements apparaîtront ici une fois que vous aurez des résidences actives.
            </p>
            <Button onClick={() => navigate("/owner/residences")}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une résidence
            </Button>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
