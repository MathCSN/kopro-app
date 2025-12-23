import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Users,
  FileText,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const residences = [
  { id: "1", name: "Résidence du Parc", address: "12 Avenue des Champs", city: "Paris", postalCode: "75008", lots: 84, users: 156, status: "active", manager: "Sophie Bernard" },
  { id: "2", name: "Les Jardins de Neuilly", address: "45 Boulevard de la République", city: "Neuilly-sur-Seine", postalCode: "92200", lots: 120, users: 245, status: "active", manager: "Marc Lefebvre" },
  { id: "3", name: "Villa Montmartre", address: "8 Rue des Abbesses", city: "Paris", postalCode: "75018", lots: 42, users: 89, status: "active", manager: "Julie Martin" },
  { id: "4", name: "Domaine des Lilas", address: "22 Rue de Lyon", city: "Lyon", postalCode: "69003", lots: 65, users: 134, status: "pending", manager: "Sophie Bernard" },
  { id: "5", name: "Le Clos des Vignes", address: "5 Place de la Mairie", city: "Bordeaux", postalCode: "33000", lots: 98, users: 201, status: "active", manager: "Marc Lefebvre" },
];

export default function OwnerResidences() {
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
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Résidences</h1>
            <p className="text-muted-foreground mt-1">Gérez toutes les copropriétés de la plateforme</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle résidence
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{residences.length}</p>
              <p className="text-sm text-muted-foreground">Résidences</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{residences.filter(r => r.status === 'active').length}</p>
              <p className="text-sm text-muted-foreground">Actives</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{residences.reduce((acc, r) => acc + r.lots, 0)}</p>
              <p className="text-sm text-muted-foreground">Lots totaux</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{residences.reduce((acc, r) => acc + r.users, 0)}</p>
              <p className="text-sm text-muted-foreground">Utilisateurs</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher une résidence..." className="pl-10" />
        </div>

        {/* Residences Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {residences.map((residence) => (
            <Card key={residence.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{residence.name}</CardTitle>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {residence.city}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/owner/residences/${residence.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{residence.address}, {residence.postalCode}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{residence.lots} lots</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{residence.users} utilisateurs</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Géré par: <span className="text-foreground">{residence.manager}</span>
                  </div>
                  <Badge variant={residence.status === 'active' ? 'secondary' : 'outline'}>
                    {residence.status === 'active' ? 'Active' : 'En cours'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </OwnerLayout>
  );
}
