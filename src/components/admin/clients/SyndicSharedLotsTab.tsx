import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Building2, 
  Home, 
  User, 
  FileText, 
  Phone,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  MapPin
} from "lucide-react";

interface SyndicSharedLotsTabProps {
  agencyId: string;
}

interface SharedLotInfo {
  id: string;
  lot_id: string;
  share_tenant_info: boolean;
  share_lease_info: boolean;
  share_contact_info: boolean;
  lot: {
    id: string;
    lot_number: string;
    type: string | null;
    floor: number | null;
    surface: number | null;
    rooms: number | null;
    residence_id: string;
    building_id: string | null;
  };
  bailleur_agency: {
    id: string;
    name: string;
  };
  tenant?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  lease?: {
    id: string;
    start_date: string;
    end_date: string | null;
    current_rent: number;
    lease_type: string;
    status: string | null;
  } | null;
}

interface ResidenceWithSharedLots {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  sharedLots: SharedLotInfo[];
}

export function SyndicSharedLotsTab({ agencyId }: SyndicSharedLotsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedResidences, setExpandedResidences] = useState<Set<string>>(new Set());

  const { data: residencesWithShared = [], isLoading } = useQuery({
    queryKey: ["syndic-shared-lots", agencyId],
    queryFn: async () => {
      // Get residences managed by this syndic
      const { data: residences, error: residencesError } = await supabase
        .from("residences")
        .select("id, name, address, city")
        .eq("agency_id", agencyId);

      if (residencesError) throw residencesError;
      if (!residences?.length) return [];

      const residenceIds = residences.map(r => r.id);

      // Get lots in these residences that have bailleur_agency_id set
      const { data: lotsWithBailleur, error: lotsError } = await supabase
        .from("lots")
        .select(`
          id,
          lot_number,
          type,
          floor,
          surface,
          rooms,
          residence_id,
          building_id,
          bailleur_agency_id,
          primary_resident_id
        `)
        .in("residence_id", residenceIds)
        .not("bailleur_agency_id", "is", null);

      if (lotsError) throw lotsError;
      if (!lotsWithBailleur?.length) return residences.map(r => ({ ...r, sharedLots: [] }));

      const lotIds = lotsWithBailleur.map(l => l.id);
      const bailleurAgencyIds = [...new Set(lotsWithBailleur.map(l => l.bailleur_agency_id))];
      const residentIds = lotsWithBailleur.map(l => l.primary_resident_id).filter(Boolean);

      // Get sharing settings
      const { data: sharingSettings } = await supabase
        .from("lot_syndic_sharing")
        .select("*")
        .in("lot_id", lotIds)
        .eq("syndic_agency_id", agencyId);

      // Get bailleur agencies
      const { data: bailleurAgencies } = await supabase
        .from("agencies")
        .select("id, name")
        .in("id", bailleurAgencyIds as string[]);

      // Get tenants
      const { data: profiles } = residentIds.length > 0
        ? await supabase.from("profiles").select("id, first_name, last_name, email, phone").in("id", residentIds)
        : { data: [] };

      // Get leases
      const { data: leases } = await supabase
        .from("leases")
        .select("id, lot_id, start_date, end_date, current_rent, lease_type, status")
        .in("lot_id", lotIds)
        .eq("status", "active");

      const sharingMap = new Map((sharingSettings || []).map(s => [s.lot_id, s]));
      const agenciesMap = new Map((bailleurAgencies || []).map(a => [a.id, a]));
      const profilesMap = new Map((profiles || []).map(p => [p.id, p]));
      const leasesMap = new Map((leases || []).map(l => [l.lot_id, l]));

      // Build result
      return residences.map(residence => {
        const residenceLots = lotsWithBailleur.filter(l => l.residence_id === residence.id);
        
        const sharedLots: SharedLotInfo[] = residenceLots.map(lot => {
          const sharing = sharingMap.get(lot.id);
          const bailleur = agenciesMap.get(lot.bailleur_agency_id!);
          const tenant = lot.primary_resident_id ? profilesMap.get(lot.primary_resident_id) : null;
          const lease = leasesMap.get(lot.id);

          return {
            id: sharing?.id || lot.id,
            lot_id: lot.id,
            share_tenant_info: sharing?.share_tenant_info || false,
            share_lease_info: sharing?.share_lease_info || false,
            share_contact_info: sharing?.share_contact_info || false,
            lot: {
              id: lot.id,
              lot_number: lot.lot_number,
              type: lot.type,
              floor: lot.floor,
              surface: lot.surface,
              rooms: lot.rooms,
              residence_id: lot.residence_id,
              building_id: lot.building_id,
            },
            bailleur_agency: bailleur || { id: lot.bailleur_agency_id!, name: "Bailleur inconnu" },
            tenant: sharing?.share_tenant_info ? tenant : null,
            lease: sharing?.share_lease_info ? lease : null,
          };
        });

        return {
          ...residence,
          sharedLots,
        } as ResidenceWithSharedLots;
      }).filter(r => r.sharedLots.length > 0);
    },
  });

  const toggleResidence = (id: string) => {
    const newSet = new Set(expandedResidences);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedResidences(newSet);
  };

  const filteredResidences = residencesWithShared.filter(residence => {
    const query = searchQuery.toLowerCase();
    if (residence.name.toLowerCase().includes(query)) return true;
    if (residence.city?.toLowerCase().includes(query)) return true;
    return residence.sharedLots.some(sl => 
      sl.lot.lot_number.toLowerCase().includes(query) ||
      sl.bailleur_agency.name.toLowerCase().includes(query) ||
      sl.tenant?.first_name?.toLowerCase().includes(query) ||
      sl.tenant?.last_name?.toLowerCase().includes(query)
    );
  });

  const totalSharedLots = residencesWithShared.reduce((sum, r) => sum + r.sharedLots.length, 0);

  const getLotTypeBadge = (type: string | null) => {
    switch (type) {
      case "apartment":
      case "appartement":
        return <Badge variant="secondary">Appartement</Badge>;
      case "parking":
        return <Badge variant="outline">Parking</Badge>;
      case "storage":
      case "cave":
        return <Badge variant="outline">Cave</Badge>;
      default:
        return <Badge variant="outline">Lot</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Appartements avec bailleur ({totalSharedLots})</h3>
        <p className="text-sm text-muted-foreground">
          Appartements gérés par des bailleurs dans vos résidences
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par résidence, appartement, bailleur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {totalSharedLots === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Home className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun appartement avec bailleur</h3>
            <p className="text-muted-foreground">
              Aucun bailleur n'a encore ajouté d'appartement dans vos résidences
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredResidences.map((residence) => (
            <Card key={residence.id}>
              <Collapsible 
                open={expandedResidences.has(residence.id)}
                onOpenChange={() => toggleResidence(residence.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {expandedResidences.has(residence.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{residence.name}</CardTitle>
                        {(residence.address || residence.city) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {[residence.address, residence.city].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline">
                        {residence.sharedLots.length} appt(s) avec bailleur
                      </Badge>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4">
                    <div className="space-y-3">
                      {residence.sharedLots.map((sharedLot) => (
                        <div 
                          key={sharedLot.lot_id}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          {/* Lot Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                                <Home className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{sharedLot.lot.lot_number}</span>
                                  {getLotTypeBadge(sharedLot.lot.type)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Géré par <strong>{sharedLot.bailleur_agency.name}</strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sharing Status */}
                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              variant={sharedLot.share_tenant_info ? "default" : "outline"}
                              className="gap-1"
                            >
                              {sharedLot.share_tenant_info ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              <User className="h-3 w-3" />
                              Locataire
                            </Badge>
                            <Badge 
                              variant={sharedLot.share_lease_info ? "default" : "outline"}
                              className="gap-1"
                            >
                              {sharedLot.share_lease_info ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              <FileText className="h-3 w-3" />
                              Bail
                            </Badge>
                            <Badge 
                              variant={sharedLot.share_contact_info ? "default" : "outline"}
                              className="gap-1"
                            >
                              {sharedLot.share_contact_info ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              <Phone className="h-3 w-3" />
                              Contact
                            </Badge>
                          </div>

                          {/* Shared Info */}
                          {(sharedLot.share_tenant_info || sharedLot.share_lease_info || sharedLot.share_contact_info) && (
                            <div className="bg-muted/30 rounded-md p-3 space-y-2">
                              {sharedLot.tenant && sharedLot.share_tenant_info && (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>{sharedLot.tenant.first_name} {sharedLot.tenant.last_name}</span>
                                </div>
                              )}
                              {sharedLot.tenant && sharedLot.share_contact_info && (
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {sharedLot.tenant.email && (
                                    <span>{sharedLot.tenant.email}</span>
                                  )}
                                  {sharedLot.tenant.phone && (
                                    <span>{sharedLot.tenant.phone}</span>
                                  )}
                                </div>
                              )}
                              {sharedLot.lease && sharedLot.share_lease_info && (
                                <div className="flex items-center gap-4 text-sm">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span>{sharedLot.lease.current_rent}€/mois</span>
                                  <Badge variant="outline" className="text-xs">
                                    {sharedLot.lease.lease_type}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}

                          {!sharedLot.share_tenant_info && !sharedLot.share_lease_info && !sharedLot.share_contact_info && (
                            <p className="text-sm text-muted-foreground italic">
                              Le bailleur n'a pas activé le partage d'informations
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
