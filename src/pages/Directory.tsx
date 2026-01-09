import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useResidence } from "@/contexts/ResidenceContext";
import { Search, MessageCircle, Mail, Phone, Building2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DirectoryUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  lot_number?: string;
  building_name?: string;
}

const roleLabels: Record<string, string> = {
  manager: "Responsable",
  cs: "Collaborateur",
};

function DirectoryContent() {
  const { user } = useAuth();
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyMembers, setAgencyMembers] = useState<DirectoryUser[]>([]);
  const [residents, setResidents] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedResidence) {
      fetchUsers();
    }
  }, [selectedResidence]);

  const fetchUsers = async () => {
    if (!selectedResidence) return;

    try {
      // Fetch agency members (managers and cs) for the residence's agency
      const { data: residenceData } = await supabase
        .from('residences')
        .select('agency_id')
        .eq('id', selectedResidence.id)
        .single();

      if (residenceData?.agency_id) {
        // Fetch user_roles for this residence
        const { data: rolesData } = await (supabase as any)
          .from('user_roles')
          .select(`
            user_id,
            role,
            residence_id
          `)
          .or(`residence_id.eq.${selectedResidence.id},residence_id.is.null`);

        if (rolesData) {
          const userIds = rolesData.map((r: any) => r.user_id);
          
          // Fetch profiles for these users
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

          if (profilesData) {
            const agency: DirectoryUser[] = [];
            const residentsList: DirectoryUser[] = [];

            for (const profile of profilesData) {
              const userRole = rolesData.find((r: any) => r.user_id === profile.id);
              if (!userRole) continue;

              const directoryUser: DirectoryUser = {
                id: profile.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email,
                phone: profile.phone,
                avatar_url: profile.avatar_url,
                role: userRole.role,
              };

              if (userRole.role === 'manager' || userRole.role === 'cs') {
                agency.push(directoryUser);
              } else if (userRole.role === 'resident') {
                // Fetch lot info for residents
                const { data: occupancyData } = await supabase
                  .from('occupancies')
                  .select(`
                    lot_id,
                    lots (
                      lot_number,
                      buildings (name)
                    )
                  `)
                  .eq('user_id', profile.id)
                  .eq('is_active', true)
                  .single();

                if (occupancyData?.lots) {
                  const lot = occupancyData.lots as any;
                  directoryUser.lot_number = lot.lot_number;
                  directoryUser.building_name = lot.buildings?.name;
                }
                residentsList.push(directoryUser);
              }
            }

            setAgencyMembers(agency);
            setResidents(residentsList);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching directory users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (user: DirectoryUser) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email?.split('@')[0] || 'Utilisateur';
  };

  const getInitials = (user: DirectoryUser) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.first_name) return user.first_name[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return 'U';
  };

  const filteredAgency = agencyMembers.filter(m =>
    getDisplayName(m).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResidents = residents.filter(r =>
    getDisplayName(r).toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.lot_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Annuaire</h1>
          <p className="text-muted-foreground mt-1">Contacts de la résidence</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Chargement...</p>
      ) : (
        <>
          {/* Section Agence */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Agence de gestion
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAgency.map((member) => (
                <Card key={member.id} className="shadow-soft hover:shadow-medium transition-shadow h-full border-primary/20">
                  <CardContent className="p-4 h-full flex flex-col">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {getInitials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{getDisplayName(member)}</h3>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {roleLabels[member.role] || member.role}
                        </Badge>
                        
                        <div className="mt-3 space-y-1">
                          {member.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </p>
                          )}
                          {member.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => navigate(`/chat/new?to=${member.id}`)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Envoyer un message
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {filteredAgency.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full">Aucun membre de l'agence</p>
              )}
            </div>
          </div>

          {/* Section Résidents */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Résidents
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResidents.map((resident) => (
                <Card key={resident.id} className="shadow-soft hover:shadow-medium transition-shadow h-full">
                  <CardContent className="p-4 h-full flex flex-col">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={resident.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(resident)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{getDisplayName(resident)}</h3>
                        {(resident.lot_number || resident.building_name) && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {resident.lot_number}
                            {resident.building_name && ` · ${resident.building_name}`}
                          </p>
                        )}
                        
                        <div className="mt-3 space-y-1">
                          {resident.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {resident.email}
                            </p>
                          )}
                          {resident.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {resident.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => navigate(`/chat/new?to=${resident.id}`)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Envoyer un message
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {filteredResidents.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full">Aucun résident</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Directory() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/auth");
    return null;
  }
  
  const userRole = profile?.role || "resident";

  return (
    <AppLayout userRole={userRole} onLogout={logout}>
      <DirectoryContent />
    </AppLayout>
  );
}
