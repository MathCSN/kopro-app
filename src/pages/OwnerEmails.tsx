import { useNavigate } from "react-router-dom";
import { Mail, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";

export default function OwnerEmails() {
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
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Emails & Templates</h1>
            <p className="text-muted-foreground mt-1">Gérez les modèles d'emails de la plateforme</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau template
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un template..." className="pl-10" />
        </div>

        {/* Empty state */}
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucun template</h3>
            <p className="text-muted-foreground mb-4">
              Créez des modèles d'emails pour automatiser vos communications.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Créer un template
            </Button>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
