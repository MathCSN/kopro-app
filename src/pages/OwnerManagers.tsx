import { useState } from "react";
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

// Empty state - data will come from database
const managersData: { id: string; name: string; email: string; phone: string; residences: string[]; status: string; joinedAt: string }[] = [];

export default function OwnerManagers() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [managers, setManagers] = useState(managersData);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<typeof managersData[0] | null>(null);
  const [newManager, setNewManager] = useState({ name: "", email: "", phone: "" });

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredManagers = managers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddManager = () => {
    if (!newManager.name || !newManager.email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    
    const manager = {
      id: Date.now().toString(),
      name: newManager.name,
      email: newManager.email,
      phone: newManager.phone,
      residences: [],
      status: "pending",
      joinedAt: new Date().toISOString().split('T')[0],
    };
    
    setManagers([...managers, manager]);
    setNewManager({ name: "", email: "", phone: "" });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Gestionnaire ajouté",
      description: `${manager.name} a été ajouté avec succès.`,
    });
  };

  const handleEditManager = () => {
    if (!selectedManager) return;
    
    setManagers(managers.map(m => 
      m.id === selectedManager.id ? selectedManager : m
    ));
    setIsEditDialogOpen(false);
    
    toast({
      title: "Gestionnaire modifié",
      description: `Les informations de ${selectedManager.name} ont été mises à jour.`,
    });
  };

  const handleDeleteManager = () => {
    if (!selectedManager) return;
    
    setManagers(managers.filter(m => m.id !== selectedManager.id));
    setIsDeleteDialogOpen(false);
    
    toast({
      title: "Gestionnaire supprimé",
      description: `${selectedManager.name} a été supprimé.`,
      variant: "destructive",
    });
  };

  const handleImpersonate = (manager: typeof managersData[0]) => {
    toast({
      title: "Mode impersonnation",
      description: `Vous êtes maintenant connecté en tant que ${manager.name}.`,
    });
    navigate(`/owner/impersonate/${manager.id}`);
  };

  return (
    <OwnerLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Gestionnaires</h1>
            <p className="text-muted-foreground mt-1">Gérez les gestionnaires de copropriétés</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
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
                  ? "Ajoutez votre premier gestionnaire pour commencer."
                  : "Aucun gestionnaire ne correspond à votre recherche."}
              </p>
              {managers.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un gestionnaire
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
                          <DropdownMenuItem onClick={() => {
                            setSelectedManager(manager);
                            setIsEditDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setSelectedManager(manager);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
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
        )}
      </div>

      {/* Add Manager Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau gestionnaire</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau gestionnaire à la plateforme.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input 
                id="name" 
                value={newManager.name}
                onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email"
                value={newManager.email}
                onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                placeholder="jean@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone" 
                value={newManager.phone}
                onChange={(e) => setNewManager({ ...newManager, phone: e.target.value })}
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddManager}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Edit Manager Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le gestionnaire</DialogTitle>
          </DialogHeader>
          {selectedManager && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom complet</Label>
                <Input 
                  id="edit-name" 
                  value={selectedManager.name}
                  onChange={(e) => setSelectedManager({ ...selectedManager, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={selectedManager.email}
                  onChange={(e) => setSelectedManager({ ...selectedManager, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input 
                  id="edit-phone" 
                  value={selectedManager.phone}
                  onChange={(e) => setSelectedManager({ ...selectedManager, phone: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditManager}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce gestionnaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le gestionnaire {selectedManager?.name} sera définitivement supprimé de la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteManager}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OwnerLayout>
  );
}
