import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useResidence } from "@/contexts/ResidenceContext";
import { Search, MessageCircle, Mail, Phone, Building2, Users, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner";

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
  job_title?: string;
  user_role_id?: string;
}

const roleLabels: Record<string, string> = {
  manager: "Responsable",
  cs: "Collaborateur",
};

const jobTitleOptions = [
  { value: "", label: "Aucun titre" },
  { value: "charge_gestion", label: "Chargé de gestion" },
  { value: "comptable", label: "Comptable" },
  { value: "assistant", label: "Assistant(e)" },
  { value: "charge_location", label: "Chargé de location" },
  { value: "responsable_technique", label: "Responsable technique" },
  { value: "directeur", label: "Directeur/Directrice" },
];

const getJobTitleLabel = (value: string | undefined) => {
  if (!value) return null;
  const option = jobTitleOptions.find(opt => opt.value === value);
  return option?.label || value;
};

function DirectoryContent() {
  const { user, isManager } = useAuth();
  const { selectedResidence, isAllResidences, residences } = useResidence();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyMembers, setAgencyMembers] = useState<DirectoryUser[]>([]);
  const [residents, setResidents] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<DirectoryUser | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");

  useEffect(() => {
    console.log("Directory: selectedResidence changed", { selectedResidence, isAllResidences, residences });
    fetchUsers();
  }, [selectedResidence, isAllResidences, residences]);

  const fetchUsers = async () => {
    setLoading(true);
    console.log("Directory: fetchUsers started", { selectedResidence, isAllResidences });
    
    try {
      // Get the residence to use - either selected or first available
      const targetResidence = selectedResidence || (residences.length > 0 ? residences[0] : null);
      
      console.log("Directory: targetResidence", targetResidence);
      
      if (targetResidence) {
        const { data: residenceData, error: residenceError } = await supabase
          .from('residences')
          .select('agency_id')
          .eq('id', targetResidence.id)
          .maybeSingle();

        console.log("Directory: residenceData", { residenceData, residenceError });

        if (residenceData?.agency_id) {
          // Fetch agency info including owner
          const { data: agencyData, error: agencyError } = await supabase
            .from('agencies')
            .select('owner_id')
            .eq('id', residenceData.agency_id)
            .maybeSingle();

          console.log("Directory: agencyData", { agencyData, agencyError });

          // Fetch all agency team members from user_roles
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('id, user_id, role, job_title')
            .eq('agency_id', residenceData.agency_id)
            .in('role', ['manager', 'cs']);

          console.log("Directory: rolesData", { rolesData, rolesError });

          // Collect all user IDs (owner + team members)
          const userIds: string[] = [];
          if (agencyData?.owner_id) {
            userIds.push(agencyData.owner_id);
          }
          if (rolesData) {
            rolesData.forEach((r: any) => {
              if (!userIds.includes(r.user_id)) {
                userIds.push(r.user_id);
              }
            });
          }

          console.log("Directory: userIds for agency members", userIds);

          if (userIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('*')
              .in('id', userIds);

            console.log("Directory: profilesData for agency", { profilesData, profilesError });

            if (profilesData) {
              const agency: DirectoryUser[] = profilesData.map(profile => {
                const isOwner = profile.id === agencyData?.owner_id;
                const roleInfo = rolesData?.find((r: any) => r.user_id === profile.id);
                return {
                  id: profile.id,
                  first_name: profile.first_name,
                  last_name: profile.last_name,
                  email: profile.email,
                  phone: profile.phone,
                  avatar_url: profile.avatar_url,
                  role: isOwner ? 'manager' : (roleInfo?.role || 'cs'),
                  job_title: isOwner ? 'directeur' : roleInfo?.job_title,
                  user_role_id: roleInfo?.id,
                };
              });
              console.log("Directory: agency members set", agency);
              setAgencyMembers(agency);
            }
          } else {
            setAgencyMembers([]);
          }
        } else {
          console.log("Directory: No agency_id found for residence");
          setAgencyMembers([]);
        }

        // Fetch residents via occupancies for this residence
        const { data: occupanciesData } = await supabase
          .from('occupancies')
          .select(`
            user_id,
            type,
            lots (
              lot_number,
              residence_id,
              buildings (name)
            )
          `)
          .eq('is_active', true);

        if (occupanciesData) {
          const residenceOccupancies = occupanciesData.filter((occ: any) => 
            occ.lots?.residence_id === targetResidence.id
          );
          console.log("Directory: residenceOccupancies", residenceOccupancies);

          const userIds = [...new Set(residenceOccupancies.map((o: any) => o.user_id))];
          
          if (userIds.length > 0) {
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('*')
              .in('id', userIds);

            if (profilesData) {
              const residentsList: DirectoryUser[] = profilesData.map(profile => {
                const occupancy = residenceOccupancies.find((o: any) => o.user_id === profile.id);
                const lot = occupancy?.lots as any;
                
                return {
                  id: profile.id,
                  first_name: profile.first_name,
                  last_name: profile.last_name,
                  email: profile.email,
                  phone: profile.phone,
                  avatar_url: profile.avatar_url,
                  role: occupancy?.type || 'resident',
                  lot_number: lot?.lot_number,
                  building_name: lot?.buildings?.name,
                };
              });

              setResidents(residentsList);
            }
          } else {
            setResidents([]);
          }
        }
      } else {
        setAgencyMembers([]);
        setResidents([]);
      }
    } catch (error) {
      console.error('Error fetching directory users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditJobTitle = (member: DirectoryUser) => {
    setEditingMember(member);
    setSelectedJobTitle(member.job_title || "none");
  };

  const handleSaveJobTitle = async () => {
    if (!editingMember?.user_role_id) return;

    try {
      const jobTitle = selectedJobTitle === "none" ? null : selectedJobTitle;
      const { error } = await supabase
        .from('user_roles')
        .update({ job_title: jobTitle })
        .eq('id', editingMember.user_role_id);

      if (error) throw error;

      toast.success("Titre mis à jour avec succès");
      setEditingMember(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating job title:', error);
      toast.error("Erreur lors de la mise à jour du titre");
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
    r.id !== user?.id && (
      getDisplayName(r).toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.lot_number?.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-foreground">{getDisplayName(member)}</h3>
                          {isManager() && member.role === 'cs' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 -mt-1 -mr-1"
                              onClick={() => handleEditJobTitle(member)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {roleLabels[member.role] || member.role}
                          </Badge>
                          {member.job_title && (
                            <Badge variant="outline" className="text-xs">
                              {getJobTitleLabel(member.job_title)}
                            </Badge>
                          )}
                        </div>
                        
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

      {/* Dialog for editing job title */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le titre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Choisissez un titre pour {editingMember && getDisplayName(editingMember)}
              </p>
              <Select value={selectedJobTitle} onValueChange={setSelectedJobTitle}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un titre" />
                </SelectTrigger>
                <SelectContent>
                  {jobTitleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value || "none"}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingMember(null)}>
                Annuler
              </Button>
              <Button onClick={handleSaveJobTitle}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
