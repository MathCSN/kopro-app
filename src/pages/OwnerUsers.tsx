import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Loader2, MoreVertical, Eye, Mail, Building2, X, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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

const ALL_ROLES: AppRole[] = ['owner', 'admin', 'manager', 'cs', 'resident'];

export default function OwnerUsers() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [residences, setResidences] = useState<Residence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResidenceId, setSelectedResidenceId] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [savingRoles, setSavingRoles] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch residences and profiles/roles in parallel
      const [residencesRes, profilesRes, rolesRes] = await Promise.all([
        supabase.from('residences').select('id, name').order('name'),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('id, user_id, role, residence_id'),
      ]);

      if (residencesRes.error) throw residencesRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setResidences(residencesRes.data || []);

      // Map residence names to roles
      const residenceMap = new Map((residencesRes.data || []).map(r => [r.id, r.name]));

      // Combine profiles with roles
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

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const toggleRole = async (userId: string, role: AppRole, currentRoles: UserRole[]) => {
    setSavingRoles(true);
    try {
      const existingRole = currentRoles.find(r => 
        r.role === role && 
        (role === 'owner' || r.residence_id === (selectedResidenceId === 'all' ? null : selectedResidenceId))
      );

      if (existingRole) {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('id', existingRole.id);
        
        if (error) throw error;
        
        toast({
          title: "Rôle retiré",
          description: `Le rôle ${getRoleLabel(role)} a été retiré.`,
        });
      } else {
        // Add role
        const insertData: any = {
          user_id: userId,
          role: role,
        };
        
        // Only add residence_id for non-owner roles
        if (role !== 'owner' && selectedResidenceId !== 'all') {
          insertData.residence_id = selectedResidenceId;
        }

        const { error } = await supabase
          .from('user_roles')
          .insert(insertData);
        
        if (error) throw error;
        
        toast({
          title: "Rôle ajouté",
          description: `Le rôle ${getRoleLabel(role)} a été ajouté.`,
        });
      }
      
      // Refresh data
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le rôle.",
        variant: "destructive",
      });
    } finally {
      setSavingRoles(false);
      setEditingUserId(null);
    }
  };

  if (!user) return null;

  // Filter users based on selected residence
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

  const stats = {
    total: filteredByResidence.length,
    owners: filteredByResidence.filter(u => u.roles.some(r => r.role === 'owner')).length,
    admins: filteredByResidence.filter(u => u.roles.some(r => r.role === 'admin')).length,
    managers: filteredByResidence.filter(u => u.roles.some(r => r.role === 'manager')).length,
    residents: filteredByResidence.filter(u => u.roles.some(r => r.role === 'resident')).length,
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'default';
      case 'admin': return 'secondary';
      case 'manager': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Kopro';
      case 'admin': return 'Admin';
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

  const hasRole = (userRoles: UserRole[], role: AppRole) => {
    if (role === 'owner') {
      return userRoles.some(r => r.role === 'owner');
    }
    if (selectedResidenceId === 'all') {
      return userRoles.some(r => r.role === role);
    }
    return userRoles.some(r => r.role === role && r.residence_id === selectedResidenceId);
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
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Utilisateurs globaux</h1>
            <p className="text-muted-foreground mt-1">Gérez les utilisateurs de la plateforme</p>
          </div>
        </div>

        {/* Residence selector */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedResidenceId} onValueChange={setSelectedResidenceId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Sélectionner une résidence" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Toutes les résidences</SelectItem>
              {residences.map(residence => (
                <SelectItem key={residence.id} value={residence.id}>
                  {residence.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <p className="text-sm text-muted-foreground">Propriétaires</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
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
                  <TableHead>Rôles</TableHead>
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
                      <Popover open={editingUserId === u.id} onOpenChange={(open) => setEditingUserId(open ? u.id : null)}>
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
                        <PopoverContent className="w-64 bg-popover" align="start">
                          <div className="space-y-3">
                            <div className="font-medium text-sm">Modifier les rôles</div>
                            {selectedResidenceId === 'all' && (
                              <p className="text-xs text-muted-foreground">
                                Sélectionnez une résidence pour modifier les rôles liés à une résidence.
                              </p>
                            )}
                            <div className="space-y-2">
                              {ALL_ROLES.map(role => {
                                const isDisabled = savingRoles || (role !== 'owner' && selectedResidenceId === 'all');
                                const isChecked = hasRole(u.roles, role);
                                
                                return (
                                  <label 
                                    key={role} 
                                    className={`flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    <Checkbox 
                                      checked={isChecked}
                                      disabled={isDisabled}
                                      onCheckedChange={() => toggleRole(u.id, role, u.roles)}
                                    />
                                    <span className="text-sm">{getRoleLabel(role)}</span>
                                    {role === 'owner' && (
                                      <span className="text-xs text-muted-foreground ml-auto">(global)</span>
                                    )}
                                  </label>
                                );
                              })}
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
    </OwnerLayout>
  );
}
