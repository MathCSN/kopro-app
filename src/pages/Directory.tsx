import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useResidence } from "@/contexts/ResidenceContext";
import { Search, MessageCircle, Mail, Phone, Building2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";

const agencyMembers = [
  {
    id: "3",
    name: "Sophie Bernard",
    title: "Gestionnaire principale",
    role: "manager",
    showEmail: true,
    showPhone: true,
    email: "sophie.b@gestionplus.fr",
    phone: "01 23 45 67 89",
  },
  {
    id: "5",
    name: "Lucas Moreau",
    title: "Chargé de gestion",
    role: "cs",
    showEmail: true,
    showPhone: true,
    email: "lucas.m@gestionplus.fr",
    phone: "01 23 45 67 90",
  },
];

const residents = [
  {
    id: "1",
    name: "Marie Dupont",
    apartment: "Apt 12B",
    floor: "3ème étage",
    showEmail: true,
    showPhone: false,
    email: "marie.d@email.fr",
  },
  {
    id: "2",
    name: "Jean Martin",
    apartment: "Apt 8A",
    floor: "2ème étage",
    showEmail: true,
    showPhone: true,
    email: "jean.m@email.fr",
    phone: "06 12 34 56 78",
  },
  {
    id: "4",
    name: "Pierre Lefebvre",
    apartment: "Apt 5D",
    floor: "1er étage",
    showEmail: false,
    showPhone: false,
  },
  {
    id: "6",
    name: "Claire Dubois",
    apartment: "Apt 2A",
    floor: "RDC",
    showEmail: true,
    showPhone: false,
    email: "claire.d@email.fr",
  },
];

const roleLabels: Record<string, string> = {
  manager: "Responsable",
  cs: "Collaborateur",
};

function DirectoryContent() {
  const { selectedResidence } = useResidence();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgency = agencyMembers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResidents = residents.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.apartment.toLowerCase().includes(searchQuery.toLowerCase())
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
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.title}</p>
                    <Badge variant="secondary" className="text-xs mt-2">
                      {roleLabels[member.role]}
                    </Badge>
                    
                    <div className="mt-3 space-y-1">
                      {member.showEmail && member.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </p>
                      )}
                      {member.showPhone && member.phone && (
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
            <p className="text-muted-foreground text-sm col-span-full">Aucun membre trouvé</p>
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
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {resident.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{resident.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {resident.apartment} · {resident.floor}
                    </p>
                    
                    {(resident.showEmail || resident.showPhone) && (
                      <div className="mt-3 space-y-1">
                        {resident.showEmail && resident.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {resident.email}
                          </p>
                        )}
                        {resident.showPhone && resident.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {resident.phone}
                          </p>
                        )}
                      </div>
                    )}
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
            <p className="text-muted-foreground text-sm col-span-full">Aucun résident trouvé</p>
          )}
        </div>
      </div>
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
