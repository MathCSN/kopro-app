import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Loader2, MoreVertical, Eye, Mail, Building2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

type Residence = {
  id: string;
  name: string;
};

type UserRole = {
  id: string;
  role: AppRole;
  residence_id: string | null;
  residence_name?: string;
};

type UserWithRole = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
  roles: UserRole[];
};

// Rôles: owner = KOPRO (admin global), autres = par résidence
const ALL_ROLES: AppRole[] = ['owner', 'manager', 'cs', 'resident'];

export default function OwnerUsers() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [residences, setResidences] = useState<Residence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResidenceId, setSelectedResidenceId] = useState<string>("all");
  const [residenceSearchOpen, setResidenceSearchOpen] = useState(false);
  const [residenceSearchQuery, setResidenceSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [savingRoles, setSavingRoles] = useState(false);
  const [roleResidenceSelection, setRoleResidenceSelection] = useState<string>("");
  const [roleResidenceSearchOpen, setRoleResidenceSearchOpen] = useState(false);
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [residencesRes, profilesRes, rolesRes] = await Promise.all([
        supabase.from('residences').select('id, name').order('name'),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('id, user_id, role, residence_id'),
      ]);

      if (residencesRes.error) throw residencesRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setResidences(residencesRes.data || []);

      const residenceMap = new Map((residencesRes.data || []).map(r => [r.id, r.name]));

      const usersWithRoles: UserWithRole[] = (profilesRes.data || []).map(profile => {
        const userRoles: UserRole[] = (rolesRes.data || [])
          .filter(r => r.user_id === profile.id)
          .map(r => ({
            id: r.id,
            role: r.role,
            residence_id: r.residence_id,
            residence_name: r.residence_id ? residenceMap.get(r.residence_id) : undefined,
          }));
        
        return {
          id: profile.id,
          email: profile.email || '',
          first_name: profile.first_name,
          last_name: profile.last_name,
          created_at: profile.created_at,
          roles: userRoles,
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const addRole = async (userId: string, role: AppRole, residenceId: string | null) => {
    setSavingRoles(true);
    try {
      const insertData: any = {
        user_id: userId,
        role: role,
      };
      
      if (role !== 'owner' && residenceId) {
        insertData.residence_id = residenceId;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert(insertData);
      
      if (error) throw error;
      
      const residenceName = residenceId ? residences.find(r => r.id === residenceId)?.name : null;
      toast({
        title: "Rôle ajouté",
        description: `Le rôle ${getRoleLabel(role)}${residenceName ? ` pour ${residenceName}` : ''} a été ajouté.`,
      });
      
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le rôle.",
        variant: "destructive",
      });
    } finally {
      setSavingRoles(false);
    }
  };

  const removeRole = async (roleId: string, role: AppRole) => {
    setSavingRoles(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
      
      toast({
        title: "Rôle retiré",
        description: `Le rôle ${getRoleLabel(role)} a été retiré.`,
      });
      
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de retirer le rôle.",
        variant: "destructive",
      });
    } finally {
      setSavingRoles(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete all user roles first
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userToDelete.id);
      
      if (rolesError) throw rolesError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);
      
      if (profileError) throw profileError;

      toast({
        title: "Utilisateur supprimé",
        description: `${userToDelete.email} a été supprimé.`,
      });
      
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  if (!user) return null;

  const filteredByResidence = selectedResidenceId === 'all' 
    ? users 
    : users.filter(u => 
        u.roles.some(r => r.role === 'owner' || r.residence_id === selectedResidenceId)
      );

  const filteredUsers = filteredByResidence.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const filteredResidences = residences.filter(r =>
    r.name.toLowerCase().includes(residenceSearchQuery.toLowerCase())
  );

  const stats = {
    total: filteredByResidence.length,
    owners: filteredByResidence.filter(u => u.roles.some(r => r.role === 'owner')).length,
    managers: filteredByResidence.filter(u => u.roles.some(r => r.role === 'manager')).length,
    support: filteredByResidence.filter(u => u.roles.some(r => r.role === 'cs')).length,
    residents: filteredByResidence.filter(u => u.roles.some(r => r.role === 'resident')).length,
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'KOPRO';
      case 'manager': return 'Gestionnaire';
      case 'cs': return 'Support';
      case 'resident': return 'Résident';
      default: return role;
    }
  };

  const getUserRolesForDisplay = (userRoles: UserRole[]) => {
    if (selectedResidenceId === 'all') {
      return userRoles;
    }
    return userRoles.filter(r => r.role === 'owner' || r.residence_id === selectedResidenceId);
  };

  const selectedResidenceName = selectedResidenceId === 'all' 
    ? 'Toutes les résidences' 
    : residences.find(r => r.id === selectedResidenceId)?.name || 'Résidence';

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
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Utilisateurs globaux</h1>
            <p className="text-muted-foreground mt-1">Gérez les utilisateurs de la plateforme</p>
          </div>
        </div>

        {/* Residence selector with search */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Popover open={residenceSearchOpen} onOpenChange={setResidenceSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-between">
                {selectedResidenceName}
                <Search className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 bg-popover" align="start">
              <Command>
                <CommandInput 
                  placeholder="Rechercher une résidence..." 
                  value={residenceSearchQuery}
                  onValueChange={setResidenceSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>Aucune résidence trouvée.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem 
                      value="all"
                      onSelect={() => {
                        setSelectedResidenceId("all");
                        setResidenceSearchOpen(false);
                        setResidenceSearchQuery("");
                      }}
                    >
                      Toutes les résidences
                    </CommandItem>
                    {filteredResidences.map(residence => (
                      <CommandItem 
                        key={residence.id} 
                        value={residence.name}
                        onSelect={() => {
                          setSelectedResidenceId(residence.id);
                          setResidenceSearchOpen(false);
                          setResidenceSearchQuery("");
                        }}
                      >
                        {residence.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total utilisateurs</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.owners}</p>
              <p className="text-sm text-muted-foreground">KOPRO</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.managers}</p>
              <p className="text-sm text-muted-foreground">Gestionnaires</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.support}</p>
              <p className="text-sm text-muted-foreground">Support</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.residents}</p>
              <p className="text-sm text-muted-foreground">Résidents</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un utilisateur..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Users list or empty state */}
        {filteredUsers.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {users.length === 0 ? "Aucun utilisateur" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {users.length === 0 
                  ? "Les utilisateurs apparaîtront ici une fois inscrits sur la plateforme."
                  : "Aucun utilisateur ne correspond à votre recherche."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôles et Résidence</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {u.first_name && u.last_name 
                              ? `${u.first_name} ${u.last_name}`
                              : u.email.split('@')[0]}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Popover 
                        open={editingUserId === u.id} 
                        onOpenChange={(open) => {
                          setEditingUserId(open ? u.id : null);
                          if (open) setRoleResidenceSelection("");
                        }}
                      >
                        <PopoverTrigger asChild>
                          <button className="flex gap-1 flex-wrap items-center cursor-pointer hover:opacity-80 transition-opacity">
                            {getUserRolesForDisplay(u.roles).length > 0 ? (
                              getUserRolesForDisplay(u.roles).map((role, idx) => (
                                <Badge key={`${role.role}-${role.residence_id || 'global'}-${idx}`} variant={getRoleBadgeVariant(role.role)}>
                                  {getRoleLabel(role.role)}
                                  {role.residence_name && selectedResidenceId === 'all' && (
                                    <span className="ml-1 opacity-70 text-xs">({role.residence_name})</span>
                                  )}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                <Plus className="h-3 w-3 mr-1" />
                                Ajouter rôle
                              </Badge>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-popover" align="start">
                          <div className="space-y-4">
                            <div className="font-medium text-sm">Gérer les rôles</div>
                            
                            {/* Current roles */}
                            {u.roles.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Rôles actuels</p>
                                <div className="flex flex-wrap gap-1">
                                  {u.roles.map((role, idx) => (
                                    <Badge 
                                      key={`current-${role.role}-${role.residence_id || 'global'}-${idx}`} 
                                      variant={getRoleBadgeVariant(role.role)}
                                      className="cursor-pointer hover:opacity-70"
                                      onClick={() => !savingRoles && removeRole(role.id, role.role)}
                                    >
                                      {getRoleLabel(role.role)}
                                      {role.residence_name && (
                                        <span className="ml-1 opacity-70 text-xs">({role.residence_name})</span>
                                      )}
                                      <span className="ml-1">×</span>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Add new role */}
                            <div className="space-y-3 pt-2 border-t">
                              <p className="text-xs text-muted-foreground">Ajouter un rôle</p>
                              
                              {/* Residence selector for new role with search */}
                              <div className="space-y-1">
                                <label className="text-xs font-medium">Résidence</label>
                                <Popover open={roleResidenceSearchOpen} onOpenChange={setRoleResidenceSearchOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full h-8 text-xs justify-between">
                                      {roleResidenceSelection 
                                        ? residences.find(r => r.id === roleResidenceSelection)?.name 
                                        : "Sélectionner une résidence..."}
                                      <Search className="h-3 w-3 ml-2 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0 bg-popover" align="start">
                                    <Command>
                                      <CommandInput placeholder="Rechercher..." />
                                      <CommandList>
                                        <CommandEmpty>Aucune résidence.</CommandEmpty>
                                        <CommandGroup>
                                          {residences.map(residence => (
                                            <CommandItem 
                                              key={residence.id} 
                                              value={residence.name}
                                              onSelect={() => {
                                                setRoleResidenceSelection(residence.id);
                                                setRoleResidenceSearchOpen(false);
                                              }}
                                            >
                                              {residence.name}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              
                              {/* Role buttons */}
                              <div className="flex flex-wrap gap-1">
                                {ALL_ROLES.map(role => {
                                  const isOwnerRole = role === 'owner';
                                  const needsResidence = !isOwnerRole && !roleResidenceSelection;
                                  const alreadyHasRole = isOwnerRole 
                                    ? u.roles.some(r => r.role === 'owner')
                                    : u.roles.some(r => r.role === role && r.residence_id === roleResidenceSelection);
                                  
                                  return (
                                    <Button
                                      key={role}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      disabled={savingRoles || (needsResidence && !isOwnerRole) || alreadyHasRole}
                                      onClick={() => addRole(u.id, role, isOwnerRole ? null : roleResidenceSelection)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      {getRoleLabel(role)}
                                      {isOwnerRole && <span className="ml-1 opacity-50">(global)</span>}
                                    </Button>
                                  );
                                })}
                              </div>
                              
                              {!roleResidenceSelection && (
                                <p className="text-xs text-muted-foreground italic">
                                  Sélectionnez une résidence pour ajouter un rôle (sauf KOPRO qui est global)
                                </p>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.created_at 
                        ? new Date(u.created_at).toLocaleDateString('fr-FR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(u);
                            setIsViewDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            toast({
                              title: "Email",
                              description: `Envoyer un email à ${u.email}`,
                            });
                          }}>
                            <Mail className="h-4 w-4 mr-2" />
                            Envoyer email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setUserToDelete(u);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
            <DialogDescription>
              Informations complètes de l'utilisateur
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-medium text-primary">
                    {(selectedUser.first_name?.[0] || selectedUser.email[0]).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedUser.first_name && selectedUser.last_name 
                      ? `${selectedUser.first_name} ${selectedUser.last_name}`
                      : selectedUser.email.split('@')[0]}
                  </h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Tous les rôles</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {selectedUser.roles.length > 0 ? (
                      selectedUser.roles.map((role, idx) => (
                        <Badge key={`${role.role}-${role.residence_id || 'global'}-${idx}`} variant={getRoleBadgeVariant(role.role)}>
                          {getRoleLabel(role.role)}
                          {role.residence_name && (
                            <span className="ml-1 opacity-70 text-xs">({role.residence_name})</span>
                          )}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">Aucun rôle</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date d'inscription</p>
                  <p>
                    {selectedUser.created_at 
                      ? new Date(selectedUser.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{userToDelete?.email}</strong> ? 
              Cette action supprimera tous ses rôles et ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
