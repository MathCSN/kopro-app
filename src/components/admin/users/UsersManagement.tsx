import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, Mail, Shield, Trash2, MoreHorizontal, Users, History } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InviteUserDialog } from "./InviteUserDialog";
import { InvitationsHistory } from "./InvitationsHistory";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type AppRole = "owner" | "admin" | "manager" | "cs" | "resident";

interface UserWithRole {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  roles: {
    id: string;
    role: AppRole;
    residence_id: string | null;
  }[];
}

const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  manager: "Gestionnaire",
  cs: "Conseil Syndical",
  resident: "Résident",
};

const ROLE_COLORS: Record<AppRole, string> = {
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  cs: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  resident: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function UsersManagement() {
  const { selectedResidence } = useResidence();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("resident");

  // Fetch users with their roles for the selected residence
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["residence-users", selectedResidence?.id],
    queryFn: async () => {
      if (!selectedResidence) return [];

      // Get all roles for this residence
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, role, residence_id")
        .or(`residence_id.eq.${selectedResidence.id},role.eq.owner`);

      if (rolesError) throw rolesError;
      if (!roles || roles.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(roles.map((r) => r.user_id))];

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, avatar_url, created_at")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine users with their roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        ...profile,
        roles: roles
          .filter((r) => r.user_id === profile.id)
          .filter((r) => r.role === "owner" || r.residence_id === selectedResidence.id)
          .map((r) => ({
            id: r.id,
            role: r.role as AppRole,
            residence_id: r.residence_id,
          })),
      }));

      return usersWithRoles;
    },
    enabled: !!selectedResidence,
  });

  // Add role mutation
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      if (!selectedResidence) throw new Error("Aucune résidence sélectionnée");
      
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role,
        residence_id: role === "owner" ? null : selectedResidence.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residence-users"] });
      toast.success("Rôle ajouté avec succès");
      setRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Remove role mutation
  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residence-users"] });
      toast.success("Rôle supprimé");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  const getInitials = (firstName: string | null, lastName: string | null, email: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  const handleAddRole = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole("resident");
    setRoleDialogOpen(true);
  };

  if (!selectedResidence) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Sélectionnez une résidence pour gérer les utilisateurs
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <History className="h-4 w-4" />
            Invitations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Utilisateurs</CardTitle>
                  <CardDescription>
                    {users.length} utilisateur{users.length > 1 ? "s" : ""} dans cette résidence
                  </CardDescription>
                </div>
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Inviter par email
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Aucun utilisateur trouvé" : "Aucun utilisateur dans cette résidence"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Rôles</TableHead>
                        <TableHead className="hidden md:table-cell">Inscrit le</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback>
                                  {getInitials(user.first_name, user.last_name, user.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {user.first_name || user.last_name
                                    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                                    : "Nom non renseigné"}
                                </p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role) => (
                                <Badge
                                  key={role.id}
                                  variant="secondary"
                                  className={`${ROLE_COLORS[role.role]} cursor-pointer hover:opacity-80`}
                                  onClick={() => {
                                    if (role.role !== "owner" && confirm(`Supprimer le rôle ${ROLE_LABELS[role.role]} ?`)) {
                                      removeRoleMutation.mutate(role.id);
                                    }
                                  }}
                                >
                                  {ROLE_LABELS[role.role]}
                                  {role.role !== "owner" && (
                                    <Trash2 className="h-3 w-3 ml-1" />
                                  )}
                                </Badge>
                              ))}
                              {user.roles.length === 0 && (
                                <span className="text-muted-foreground text-sm">Aucun rôle</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {user.created_at
                              ? format(new Date(user.created_at), "dd MMM yyyy", { locale: fr })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAddRole(user)}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Ajouter un rôle
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <InvitationsHistory residenceId={selectedResidence.id} />
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        residenceId={selectedResidence.id}
        residenceName={selectedResidence.name}
      />

      {/* Add Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un rôle</DialogTitle>
            <DialogDescription>
              Attribuez un nouveau rôle à{" "}
              {selectedUser?.first_name || selectedUser?.email || "cet utilisateur"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">Résident</SelectItem>
                  <SelectItem value="cs">Conseil Syndical</SelectItem>
                  <SelectItem value="manager">Gestionnaire</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  addRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
                }
              }}
              disabled={addRoleMutation.isPending}
            >
              {addRoleMutation.isPending ? "Ajout..." : "Ajouter le rôle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
