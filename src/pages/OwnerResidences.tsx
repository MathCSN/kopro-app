import { useState, useEffect } from "react";
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
  Loader2,
  QrCode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ResidenceQRDialog } from "@/components/residence/ResidenceQRDialog";

type Residence = {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  lots: number;
  users: number;
  status: string;
  manager: string;
};

export default function OwnerResidences() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [residences, setResidences] = useState<Residence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedResidence, setSelectedResidence] = useState<Residence | null>(null);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [newResidence, setNewResidence] = useState({ 
    name: "", 
    address: "", 
    city: "", 
    postalCode: "" 
  });

  // Fetch residences from database
  useEffect(() => {
    fetchResidences();
  }, []);

  const fetchResidences = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('residences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedResidences: Residence[] = (data || []).map(r => ({
        id: r.id,
        name: r.name,
        address: r.address || '',
        city: r.city || '',
        postalCode: r.postal_code || '',
        lots: 0, // Will be calculated from lots table later
        users: 0, // Will be calculated from user_roles later
        status: 'active',
        manager: '',
      }));

      setResidences(mappedResidences);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les résidences.",
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

  const filteredResidences = residences.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddResidence = async () => {
    if (!newResidence.name || !newResidence.city) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      const { data, error } = await supabase
        .from('residences')
        .insert({
          name: newResidence.name,
          address: newResidence.address,
          city: newResidence.city,
          postal_code: newResidence.postalCode,
        })
        .select()
        .single();

      if (error) throw error;

      const residence: Residence = {
        id: data.id,
        name: data.name,
        address: data.address || '',
        city: data.city || '',
        postalCode: data.postal_code || '',
        lots: 0,
        users: 0,
        status: 'active',
        manager: '',
      };
      
      setResidences([residence, ...residences]);
      setNewResidence({ name: "", address: "", city: "", postalCode: "" });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Résidence créée",
        description: `${residence.name} a été ajoutée avec succès.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la résidence.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditResidence = async () => {
    if (!selectedResidence) return;
    
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('residences')
        .update({
          name: selectedResidence.name,
          address: selectedResidence.address,
          city: selectedResidence.city,
          postal_code: selectedResidence.postalCode,
        })
        .eq('id', selectedResidence.id);

      if (error) throw error;

      setResidences(residences.map(r => 
        r.id === selectedResidence.id ? selectedResidence : r
      ));
      setIsEditDialogOpen(false);
      
      toast({
        title: "Résidence modifiée",
        description: `Les informations de ${selectedResidence.name} ont été mises à jour.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier la résidence.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteResidence = async () => {
    if (!selectedResidence) return;
    
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('residences')
        .delete()
        .eq('id', selectedResidence.id);

      if (error) throw error;

      setResidences(residences.filter(r => r.id !== selectedResidence.id));
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Résidence supprimée",
        description: `${selectedResidence.name} a été supprimée.`,
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la résidence.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Résidences</h1>
            <p className="text-muted-foreground mt-1">Gérez toutes les copropriétés de la plateforme</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
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
          <Input 
            placeholder="Rechercher une résidence..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Empty state or Residences Grid */}
        {filteredResidences.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {residences.length === 0 ? "Aucune résidence" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {residences.length === 0 
                  ? "Créez votre première résidence pour commencer."
                  : "Aucune résidence ne correspond à votre recherche."}
              </p>
              {residences.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une résidence
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResidences.map((residence) => (
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
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem onClick={() => {
                          setSelectedResidence(residence);
                          setIsViewDialogOpen(true);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedResidence(residence);
                          setIsEditDialogOpen(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setSelectedResidence(residence);
                          setIsQRDialogOpen(true);
                        }}>
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code d'invitation
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => {
                            setSelectedResidence(residence);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
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
                      {residence.manager ? `Géré par: ${residence.manager}` : "Non assignée"}
                    </div>
                    <Badge variant={residence.status === 'active' ? 'secondary' : 'outline'}>
                      {residence.status === 'active' ? 'Active' : 'En cours'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Residence Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle résidence</DialogTitle>
            <DialogDescription>
              Créez une nouvelle copropriété sur la plateforme.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la résidence *</Label>
              <Input 
                id="name" 
                value={newResidence.name}
                onChange={(e) => setNewResidence({ ...newResidence, name: e.target.value })}
                placeholder="Résidence du Parc"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input 
                id="address" 
                value={newResidence.address}
                onChange={(e) => setNewResidence({ ...newResidence, address: e.target.value })}
                placeholder="12 Avenue des Champs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input 
                  id="city" 
                  value={newResidence.city}
                  onChange={(e) => setNewResidence({ ...newResidence, city: e.target.value })}
                  placeholder="Paris"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input 
                  id="postalCode" 
                  value={newResidence.postalCode}
                  onChange={(e) => setNewResidence({ ...newResidence, postalCode: e.target.value })}
                  placeholder="75008"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleAddResidence} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Residence Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la résidence</DialogTitle>
          </DialogHeader>
          {selectedResidence && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedResidence.name}</h3>
                  <Badge variant={selectedResidence.status === 'active' ? 'secondary' : 'outline'}>
                    {selectedResidence.status === 'active' ? 'Active' : 'En cours'}
                  </Badge>
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <Label className="text-muted-foreground">Adresse</Label>
                  <p>{selectedResidence.address}, {selectedResidence.postalCode} {selectedResidence.city}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Lots</Label>
                    <p>{selectedResidence.lots}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Utilisateurs</Label>
                    <p>{selectedResidence.users}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gestionnaire</Label>
                  <p>{selectedResidence.manager || "Non assigné"}</p>
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

      {/* Edit Residence Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la résidence</DialogTitle>
          </DialogHeader>
          {selectedResidence && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom de la résidence</Label>
                <Input 
                  id="edit-name" 
                  value={selectedResidence.name}
                  onChange={(e) => setSelectedResidence({ ...selectedResidence, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Adresse</Label>
                <Input 
                  id="edit-address" 
                  value={selectedResidence.address}
                  onChange={(e) => setSelectedResidence({ ...selectedResidence, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">Ville</Label>
                  <Input 
                    id="edit-city" 
                    value={selectedResidence.city}
                    onChange={(e) => setSelectedResidence({ ...selectedResidence, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-postalCode">Code postal</Label>
                  <Input 
                    id="edit-postalCode" 
                    value={selectedResidence.postalCode}
                    onChange={(e) => setSelectedResidence({ ...selectedResidence, postalCode: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditResidence}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette résidence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La résidence {selectedResidence?.name} et toutes ses données seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteResidence}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      {selectedResidence && (
        <ResidenceQRDialog
          residenceId={selectedResidence.id}
          residenceName={selectedResidence.name}
          open={isQRDialogOpen}
          onOpenChange={setIsQRDialogOpen}
        />
      )}
    </AdminLayout>
  );
}
