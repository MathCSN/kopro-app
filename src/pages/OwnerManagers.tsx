import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Manager = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  residences: string[];
  status: string;
  joinedAt: string;
};

export default function OwnerManagers() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      setIsLoading(true);
      
      // Fetch users with manager or admin role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, residence_id')
        .in('role', ['manager', 'admin']);

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        setManagers([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(roles.map(r => r.user_id))];

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Fetch residences for these managers
      const residenceIds = roles.filter(r => r.residence_id).map(r => r.residence_id);
      let residencesMap: Record<string, string> = {};
      
      if (residenceIds.length > 0) {
        const { data: residences } = await supabase
          .from('residences')
          .select('id, name')
          .in('id', residenceIds);
        
        if (residences) {
          residencesMap = Object.fromEntries(residences.map(r => [r.id, r.name]));
        }
      }

      // Combine data
      const managersData: Manager[] = (profiles || []).map(profile => {
        const userRoles = roles.filter(r => r.user_id === profile.id);
        const userResidences = userRoles
          .filter(r => r.residence_id && residencesMap[r.residence_id])
          .map(r => residencesMap[r.residence_id!]);

        return {
          id: profile.id,
          user_id: profile.id,
          name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : profile.email || 'Utilisateur',
          email: profile.email || '',
          phone: profile.phone || '',
          residences: userResidences,
          status: 'active',
          joinedAt: profile.created_at || new Date().toISOString(),
        };
      });

      setManagers(managersData);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les gestionnaires.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredManagers = managers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteManager = async () => {
    if (!selectedManager) return;
    
    try {
      setIsSaving(true);
      
      // Remove manager/admin roles for this user
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedManager.user_id)
        .in('role', ['manager', 'admin']);

      if (error) throw error;

      setManagers(managers.filter(m => m.id !== selectedManager.id));
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Gestionnaire supprimé",
        description: `${selectedManager.name} n'est plus gestionnaire.`,
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le gestionnaire.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImpersonate = (manager: Manager) => {
    toast({
      title: "Fonctionnalité à venir",
      description: `L'impersonation de ${manager.name} sera disponible prochainement.`,
    });
  };

  if (isLoading) {
    return (
      <OwnerLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Gestionnaires</h1>
            <p className="text-muted-foreground mt-1">Gérez les gestionnaires de copropriétés</p>
          </div>
          <Button onClick={() => navigate("/owner/users")}>
            <Plus className="h-4 w-4 mr-2" />
            Voir tous les utilisateurs
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
              <p className="text-2xl font-bold">{managers.filter(m => m.residences.length === 0).length}</p>
              <p className="text-sm text-muted-foreground">Sans résidence</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un gestionnaire..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Empty state or Managers List */}
        {filteredManagers.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {managers.length === 0 ? "Aucun gestionnaire" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {managers.length === 0 
                  ? "Les utilisateurs avec le rôle gestionnaire apparaîtront ici."
                  : "Aucun gestionnaire ne correspond à votre recherche."}
              </p>
              {managers.length === 0 && (
                <Button onClick={() => navigate("/owner/users")}>
                  <Users className="h-4 w-4 mr-2" />
                  Voir les utilisateurs
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredManagers.map((manager) => (
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
                          {manager.phone && (
                            <span className="hidden md:block">{manager.phone}</span>
                          )}
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
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleImpersonate(manager)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Impersonate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedManager(manager);
                            setIsViewDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir profil
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setSelectedManager(manager);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Retirer le rôle
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* View Manager Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil du gestionnaire</DialogTitle>
          </DialogHeader>
          {selectedManager && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {getInitials(selectedManager.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedManager.name}</h3>
                  <Badge variant={selectedManager.status === 'active' ? 'secondary' : 'outline'}>
                    {selectedManager.status === 'active' ? 'Actif' : 'En attente'}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p>{selectedManager.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p>{selectedManager.phone || "Non renseigné"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Résidences assignées</Label>
                  <p>{selectedManager.residences.length > 0 ? selectedManager.residences.join(", ") : "Aucune"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date d'inscription</Label>
                  <p>{new Date(selectedManager.joinedAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer le rôle gestionnaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedManager?.name} perdra son accès gestionnaire. Cette action peut être annulée en réassignant le rôle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteManager} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OwnerLayout>
  );
}