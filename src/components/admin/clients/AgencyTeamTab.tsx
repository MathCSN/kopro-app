import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, Crown, Mail, Phone, Plus } from "lucide-react";
import { AddTeamMemberDialog } from "./AddTeamMemberDialog";

interface AgencyTeamTabProps {
  agencyId: string;
  ownerId: string | null;
}

export function AgencyTeamTab({ agencyId, ownerId }: AgencyTeamTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["agency-team", agencyId],
    queryFn: async () => {
      // Get all user_ids with roles linked to this agency
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("id, role, user_id")
        .eq("agency_id", agencyId);

      if (error) throw error;

      // Get profiles for those users
      const userIds = [...new Set((roles || []).map(r => r.user_id))];
      if (ownerId && !userIds.includes(ownerId)) {
        userIds.push(ownerId);
      }

      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("*").in("id", userIds)
        : { data: [] };

      type ProfileType = {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        phone: string | null;
        avatar_url: string | null;
      };
      
      const profilesMap = new Map<string, ProfileType>(
        (profiles || []).map(p => [p.id, p as ProfileType])
      );

      const members = (roles || []).map(r => ({
        id: r.id,
        role: r.role,
        user_id: r.user_id,
        profile: profilesMap.get(r.user_id),
        isOwner: r.user_id === ownerId,
      }));

      // Add owner if not in list
      if (ownerId && !members.some(m => m.user_id === ownerId)) {
        const ownerProfile = profilesMap.get(ownerId);
        if (ownerProfile) {
          members.unshift({
            id: "owner",
            role: "owner",
            user_id: ownerId,
            profile: ownerProfile,
            isOwner: true,
          });
        }
      }

      return members;
    },
  });

  const getRoleBadge = (role: string, isOwner: boolean) => {
    if (isOwner) {
      return (
        <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 gap-1">
          <Crown className="h-3 w-3" />
          Propriétaire
        </Badge>
      );
    }
    switch (role) {
      case "manager":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">Gestionnaire</Badge>;
      case "cs":
        return <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30">Collaborateur</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Équipe ({teamMembers.length})</h3>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      <AddTeamMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        agencyId={agencyId}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["agency-team", agencyId] })}
      />

      {teamMembers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun membre</h3>
            <p className="text-muted-foreground">
              Cette agence n'a pas encore de membres assignés
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {(member.profile?.first_name?.[0] || "") + 
                       (member.profile?.last_name?.[0] || "")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        {member.profile?.first_name} {member.profile?.last_name}
                      </h4>
                      {getRoleBadge(member.role, member.isOwner)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {member.profile?.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{member.profile.email}</span>
                        </div>
                      )}
                      {member.profile?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{member.profile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
