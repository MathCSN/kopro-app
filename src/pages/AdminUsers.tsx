import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, Loader2, MoreVertical, Eye, Mail, Building2, Plus, Trash2, Shield, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AdminCreateRoleForAgencyDialog } from "@/components/admin/users/AdminCreateRoleForAgencyDialog";
import { AVAILABLE_PERMISSIONS } from "@/components/admin/clients/AgencyRolesManagement";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Edit, Settings } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { Switch } from "@/components/ui/switch";
import { toast as sonnerToast } from "sonner";

type AppRole = Database["public"]["Enums"]["app_role"];

type Agency = {
  id: string;
  name: string;
  type: string | null;
};

type Residence = {
  id: string;
  name: string;
  agency_id: string | null;
};

type UserRole = {
  id: string;
  role: AppRole;
  residence_id: string | null;
  residence_name?: string;
  agency_id?: string | null;
  custom_role_id?: string | null;
};

type CustomRole = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  agency_id: string;
  agency_name?: string;
  agency_type?: string | null;
};

type UserWithRole = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string | null;
  roles: UserRole[];
  agencyType?: string | null;
  agencyName?: string | null;
};

type AgencyTypeFilter = 'all' | 'bailleur' | 'syndic' | 'none';

export default function OwnerUsers() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [residences, setResidences] = useState<Residence[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyTypeFilter, setAgencyTypeFilter] = useState<AgencyTypeFilter>("all");
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  
  // Role creation
  const [createRoleDialogOpen, setCreateRoleDialogOpen] = useState(false);
  const [selectedAgencyForRole, setSelectedAgencyForRole] = useState<Agency | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [roleAgencyFilter, setRoleAgencyFilter] = useState<string>("all");
  
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
      
      const [agenciesRes, residencesRes, profilesRes, rolesRes, customRolesRes] = await Promise.all([
        supabase.from('agencies').select('id, name, type').order('name'),
        supabase.from('residences').select('id, name, agency_id').order('name'),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('id, user_id, role, residence_id, agency_id, custom_role_id'),
        supabase.from('agency_custom_roles').select('*').order('name'),
      ]);

      if (agenciesRes.error) throw agenciesRes.error;
      if (residencesRes.error) throw residencesRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (customRolesRes.error) throw customRolesRes.error;

      setAgencies(agenciesRes.data || []);
      setResidences(residencesRes.data || []);

      const agencyMap = new Map((agenciesRes.data || []).map(a => [a.id, a]));
      const residenceMap = new Map((residencesRes.data || []).map(r => [r.id, r.name]));
      const residenceToAgency = new Map((residencesRes.data || []).map(r => [r.id, r.agency_id]));

      // Build custom roles with agency info
      const rolesWithAgency = (customRolesRes.data || []).map(role => {
        const agency = agencyMap.get(role.agency_id);
        return {
          ...role,
          agency_name: agency?.name,
          agency_type: agency?.type,
        };
      });
      setCustomRoles(rolesWithAgency);

      // Fetch permissions for all custom roles
      const roleIds = rolesWithAgency.map(r => r.id);
      if (roleIds.length > 0) {
        const { data: permsData } = await supabase
          .from("custom_role_permissions")
          .select("*")
          .in("custom_role_id", roleIds);

        const grouped: Record<string, Record<string, boolean>> = {};
        (permsData || []).forEach(p => {
          if (!grouped[p.custom_role_id]) grouped[p.custom_role_id] = {};
          grouped[p.custom_role_id][p.permission_key] = p.enabled ?? false;
        });
        setRolePermissions(grouped);
      }

      const usersWithRoles: UserWithRole[] = (profilesRes.data || []).map(profile => {
        const userRoles: UserRole[] = (rolesRes.data || [])
          .filter(r => r.user_id === profile.id)
          .map(r => ({
            id: r.id,
            role: r.role,
            residence_id: r.residence_id,
            residence_name: r.residence_id ? residenceMap.get(r.residence_id) : undefined,
            agency_id: r.agency_id || (r.residence_id ? residenceToAgency.get(r.residence_id) : null),
            custom_role_id: r.custom_role_id,
          }));
        
        const userAgencyId = userRoles.find(r => r.agency_id)?.agency_id;
        const userAgency = userAgencyId ? agencyMap.get(userAgencyId) : null;

        return {
          id: profile.id,
          email: profile.email || '',
          first_name: profile.first_name,
          last_name: profile.last_name,
          created_at: profile.created_at,
          roles: userRoles,
          agencyType: userAgency?.type || null,
          agencyName: userAgency?.name || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données.",
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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id }
      });
      
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Utilisateur supprimé",
        description: `${userToDelete.email} a été supprimé définitivement.`,
      });
      
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
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

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from("agency_custom_roles")
        .delete()
        .eq("id", roleId);
      if (error) throw error;
      sonnerToast.success("Rôle supprimé");
      fetchData();
    } catch (error: any) {
      sonnerToast.error(`Erreur: ${error.message}`);
    }
  };

  const updatePermission = async (roleId: string, permissionKey: string, enabled: boolean) => {
    try {
      const { data: existing } = await supabase
        .from("custom_role_permissions")
        .select("id")
        .eq("custom_role_id", roleId)
        .eq("permission_key", permissionKey)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("custom_role_permissions")
          .update({ enabled })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("custom_role_permissions")
          .insert({
            custom_role_id: roleId,
            permission_key: permissionKey,
            enabled,
          });
      }

      setRolePermissions(prev => ({
        ...prev,
        [roleId]: { ...prev[roleId], [permissionKey]: enabled },
      }));
    } catch (error: any) {
      sonnerToast.error(`Erreur: ${error.message}`);
    }
  };

  if (!user) return null;

  // Filter users
  const usersWithoutSelf = users.filter(u => u.id !== user?.id);
  
  const filteredByAgencyType = agencyTypeFilter === 'all' 
    ? usersWithoutSelf
    : agencyTypeFilter === 'none'
      ? usersWithoutSelf.filter(u => !u.agencyType)
      : usersWithoutSelf.filter(u => u.agencyType === agencyTypeFilter);

  const filteredUsers = filteredByAgencyType.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Filter custom roles
  const filteredRoles = customRoles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
      (role.agency_name?.toLowerCase() || '').includes(roleSearchQuery.toLowerCase());
    const matchesAgency = roleAgencyFilter === 'all' || role.agency_id === roleAgencyFilter;
    return matchesSearch && matchesAgency;
  });

  const stats = {
    total: usersWithoutSelf.length,
    admins: usersWithoutSelf.filter(u => u.roles.some(r => r.role === 'admin')).length,
    bailleurs: usersWithoutSelf.filter(u => u.agencyType === 'bailleur').length,
    syndics: usersWithoutSelf.filter(u => u.agencyType === 'syndic').length,
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'KOPRO';
      case 'manager': return 'Gestionnaire';
      case 'cs': return 'Support';
      case 'resident': return 'Résident';
      default: return role;
    }
  };

  const getCustomRoleName = (customRoleId: string | null | undefined) => {
    if (!customRoleId) return null;
    return customRoles.find(r => r.id === customRoleId);
  };

  const toggleRoleExpanded = (roleId: string) => {
    setExpandedRoles(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
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
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Utilisateurs globaux</h1>
            <p className="text-muted-foreground mt-1">Gérez les utilisateurs et rôles personnalisés</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total utilisateurs</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-sm text-muted-foreground">KOPRO</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-blue-500">{stats.bailleurs}</p>
              <p className="text-sm text-muted-foreground">Bailleurs</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-purple-500">{stats.syndics}</p>
              <p className="text-sm text-muted-foreground">Syndics</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Rôles personnalisés
              <Badge variant="secondary" className="ml-1">{customRoles.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher un utilisateur..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-1">
                {[
                  { value: 'all', label: 'Tous' },
                  { value: 'bailleur', label: 'Bailleurs' },
                  { value: 'syndic', label: 'Syndics' },
                  { value: 'none', label: 'Sans agence' },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    variant={agencyTypeFilter === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAgencyTypeFilter(opt.value as AgencyTypeFilter)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Users list */}
            {filteredUsers.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Aucun utilisateur</h3>
                  <p className="text-muted-foreground">
                    Aucun utilisateur ne correspond à votre recherche.
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
                              {u.agencyName && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      u.agencyType === 'syndic' 
                                        ? 'bg-purple-500/10 text-purple-500 border-purple-500/30' 
                                        : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                    }`}
                                  >
                                    {u.agencyType === 'syndic' ? 'Syndic' : 'Bailleur'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                    {u.agencyName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {u.roles.map((role, idx) => {
                              const customRole = getCustomRoleName(role.custom_role_id);
                              if (customRole) {
                                return (
                                  <Badge 
                                    key={`custom-${idx}`}
                                    style={{ backgroundColor: customRole.color, color: 'white' }}
                                  >
                                    {customRole.name}
                                  </Badge>
                                );
                              }
                              return (
                                <Badge key={`${role.role}-${idx}`} variant={getRoleBadgeVariant(role.role)}>
                                  {getRoleLabel(role.role)}
                                  {role.residence_name && (
                                    <span className="ml-1 opacity-70 text-xs">({role.residence_name})</span>
                                  )}
                                </Badge>
                              );
                            })}
                            {u.roles.length === 0 && (
                              <Badge variant="outline" className="text-muted-foreground">Aucun rôle</Badge>
                            )}
                          </div>
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
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Rechercher un rôle..." 
                    className="pl-10"
                    value={roleSearchQuery}
                    onChange={(e) => setRoleSearchQuery(e.target.value)}
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-between">
                      <Building2 className="h-4 w-4 mr-2" />
                      {roleAgencyFilter === 'all' 
                        ? 'Toutes les agences' 
                        : agencies.find(a => a.id === roleAgencyFilter)?.name || 'Agence'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0 bg-popover" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher..." />
                      <CommandList>
                        <CommandEmpty>Aucune agence.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="all" onSelect={() => setRoleAgencyFilter("all")}>
                            Toutes les agences
                          </CommandItem>
                          {agencies.map(agency => (
                            <CommandItem 
                              key={agency.id} 
                              value={agency.name}
                              onSelect={() => setRoleAgencyFilter(agency.id)}
                            >
                              <Badge 
                                variant="outline" 
                                className={`mr-2 text-xs ${
                                  agency.type === 'syndic' 
                                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/30' 
                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                }`}
                              >
                                {agency.type === 'syndic' ? 'S' : 'B'}
                              </Badge>
                              {agency.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer un rôle
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 bg-popover" align="end">
                  <Command>
                    <CommandInput placeholder="Sélectionner une agence..." />
                    <CommandList>
                      <CommandEmpty>Aucune agence.</CommandEmpty>
                      <CommandGroup heading="Choisir l'agence pour ce rôle">
                        {agencies.map(agency => (
                          <CommandItem 
                            key={agency.id} 
                            value={agency.name}
                            onSelect={() => {
                              setSelectedAgencyForRole(agency);
                              setCreateRoleDialogOpen(true);
                            }}
                          >
                            <Badge 
                              variant="outline" 
                              className={`mr-2 text-xs ${
                                agency.type === 'syndic' 
                                  ? 'bg-purple-500/10 text-purple-500 border-purple-500/30' 
                                  : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                              }`}
                            >
                              {agency.type === 'syndic' ? 'Syndic' : 'Bailleur'}
                            </Badge>
                            {agency.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Roles list */}
            {filteredRoles.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="p-12 text-center">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Aucun rôle personnalisé</h3>
                  <p className="text-muted-foreground mb-4">
                    Créez des rôles pour définir les permissions des collaborateurs de vos clients
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredRoles.map((role) => (
                  <Collapsible
                    key={role.id}
                    open={expandedRoles.has(role.id)}
                    onOpenChange={() => toggleRoleExpanded(role.id)}
                  >
                    <Card className="shadow-soft">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{role.name}</h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    role.agency_type === 'syndic' 
                                      ? 'bg-purple-500/10 text-purple-500 border-purple-500/30' 
                                      : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                  }`}
                                >
                                  {role.agency_type === 'syndic' ? 'Syndic' : 'Bailleur'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {role.agency_name}
                                {role.description && ` • ${role.description}`}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {Object.values(rolePermissions[role.id] || {}).filter(Boolean).length} / {AVAILABLE_PERMISSIONS.length} permissions
                            </Badge>
                            <ChevronDown className={`h-4 w-4 transition-transform ${expandedRoles.has(role.id) ? "rotate-180" : ""}`} />
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRole(role.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <CollapsibleContent>
                        <div className="px-4 pb-4 border-t pt-4">
                          <p className="text-sm font-medium mb-4">Permissions</p>
                          <div className="grid gap-2">
                            {AVAILABLE_PERMISSIONS.map((perm) => {
                              const isEnabled = rolePermissions[role.id]?.[perm.key] ?? false;
                              return (
                                <div
                                  key={perm.key}
                                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                                      <perm.icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">{perm.label}</p>
                                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                                    </div>
                                  </div>
                                  <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(checked) => updatePermission(role.id, perm.key, checked)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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
                  {selectedUser.agencyName && (
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          selectedUser.agencyType === 'syndic' 
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/30' 
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                        }`}
                      >
                        {selectedUser.agencyType === 'syndic' ? 'Syndic' : 'Bailleur'}
                      </Badge>
                      <span className="text-sm">{selectedUser.agencyName}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Rôles</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {selectedUser.roles.length > 0 ? (
                      selectedUser.roles.map((role, idx) => {
                        const customRole = getCustomRoleName(role.custom_role_id);
                        if (customRole) {
                          return (
                            <Badge 
                              key={`custom-${idx}`}
                              style={{ backgroundColor: customRole.color, color: 'white' }}
                            >
                              {customRole.name}
                            </Badge>
                          );
                        }
                        return (
                          <Badge key={`${role.role}-${idx}`} variant={getRoleBadgeVariant(role.role)}>
                            {getRoleLabel(role.role)}
                            {role.residence_name && (
                              <span className="ml-1 opacity-70 text-xs">({role.residence_name})</span>
                            )}
                          </Badge>
                        );
                      })
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

      {/* Create Role Dialog */}
      <AdminCreateRoleForAgencyDialog
        open={createRoleDialogOpen}
        onOpenChange={setCreateRoleDialogOpen}
        agency={selectedAgencyForRole}
        onSuccess={() => {
          setCreateRoleDialogOpen(false);
          fetchData();
        }}
      />
    </AdminLayout>
  );
}
