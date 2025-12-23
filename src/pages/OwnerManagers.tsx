import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Mail,
  Building2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserCheck,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const managers = [
  { id: "1", name: "Sophie Bernard", email: "sophie@kopro.fr", phone: "06 12 34 56 78", residences: ["Résidence du Parc", "Domaine des Lilas", "Tour Eiffel Résidence"], status: "active", joinedAt: "2023-01-15" },
  { id: "2", name: "Marc Lefebvre", email: "marc@kopro.fr", phone: "06 98 76 54 32", residences: ["Les Jardins de Neuilly", "Le Clos des Vignes"], status: "active", joinedAt: "2023-03-22" },
  { id: "3", name: "Julie Martin", email: "julie@kopro.fr", phone: "06 55 44 33 22", residences: ["Villa Montmartre", "Résidence Belleville", "Les Terrasses du Port", "Parc des Princes"], status: "active", joinedAt: "2023-06-10" },
  { id: "4", name: "Thomas Durand", email: "thomas@kopro.fr", phone: "06 11 22 33 44", residences: [], status: "pending", joinedAt: "2024-01-05" },
];

export default function OwnerManagers() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <OwnerLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Gestionnaires</h1>
            <p className="text-muted-foreground mt-1">Gérez les gestionnaires de copropriétés</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau gestionnaire
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{managers.length}</p>
              <p className="text-sm text-muted-foreground">Gestionnaires</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{managers.filter(m => m.status === 'active').length}</p>
              <p className="text-sm text-muted-foreground">Actifs</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{managers.reduce((acc, m) => acc + m.residences.length, 0)}</p>
              <p className="text-sm text-muted-foreground">Assignations</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{managers.filter(m => m.status === 'pending').length}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un gestionnaire..." className="pl-10" />
        </div>

        {/* Managers List */}
        <div className="space-y-4">
          {managers.map((manager) => (
            <Card key={manager.id} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(manager.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{manager.name}</h3>
                        <Badge variant={manager.status === 'active' ? 'secondary' : 'outline'}>
                          {manager.status === 'active' ? 'Actif' : 'En attente'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {manager.email}
                        </span>
                        <span className="hidden md:block">{manager.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{manager.residences.length} résidences</span>
                      </div>
                      {manager.residences.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {manager.residences.slice(0, 2).join(", ")}{manager.residences.length > 2 && "..."}
                        </p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/owner/impersonate/${manager.id}`)}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir profil
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </OwnerLayout>
  );
}
