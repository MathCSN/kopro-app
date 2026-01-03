import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Home, 
  ChevronDown, 
  ChevronRight,
  User,
  Plus,
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AgencyPatrimoineTabProps {
  agencyId: string;
}

interface Lot {
  id: string;
  lot_number: string;
  type: string | null;
  floor: number | null;
  surface: number | null;
  rooms: number | null;
  building_id: string | null;
  primary_resident?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface Building {
  id: string;
  name: string;
  address: string | null;
  lots: Lot[];
}

interface Residence {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  buildings: Building[];
  unassignedLots: Lot[];
}

export function AgencyPatrimoineTab({ agencyId }: AgencyPatrimoineTabProps) {
  const [expandedResidences, setExpandedResidences] = useState<Set<string>>(new Set());
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());

  const { data: patrimoine = [], isLoading } = useQuery({
    queryKey: ["agency-patrimoine", agencyId],
    queryFn: async () => {
      // Get residences
      const { data: residences, error: residencesError } = await supabase
        .from("residences")
        .select("id, name, address, city")
        .eq("agency_id", agencyId)
        .order("name");

      if (residencesError) throw residencesError;

      const residenceIds = residences.map(r => r.id);

      // Get buildings
      const { data: buildings } = await supabase
        .from("buildings")
        .select("id, name, address, residence_id")
        .in("residence_id", residenceIds)
        .order("name");

      // Get lots with primary resident
      const { data: lots } = await supabase
        .from("lots")
        .select(`
          id,
          lot_number,
          type,
          floor,
          surface,
          rooms,
          building_id,
          residence_id,
          primary_resident_id
        `)
        .in("residence_id", residenceIds)
        .order("lot_number");

      // Get profiles for primary residents
      const residentIds = (lots || [])
        .map(l => l.primary_resident_id)
        .filter(Boolean) as string[];
      
      const { data: profiles } = residentIds.length > 0 
        ? await supabase.from("profiles").select("id, first_name, last_name").in("id", residentIds)
        : { data: [] };
      
      const profilesMap = new Map<string, { id: string; first_name: string | null; last_name: string | null }>(
        (profiles || []).map(p => [p.id, p])
      );

      // Build hierarchy
      return residences.map(residence => {
        const residenceBuildings = (buildings || [])
          .filter(b => b.residence_id === residence.id)
          .map(building => ({
            ...building,
            lots: (lots || [])
              .filter(l => l.building_id === building.id)
              .map(l => ({
                ...l,
                primary_resident: l.primary_resident_id ? profilesMap.get(l.primary_resident_id) : null,
              })),
          }));

        const unassignedLots = (lots || [])
          .filter(l => l.residence_id === residence.id && !l.building_id)
          .map(l => ({
            ...l,
            primary_resident: l.primary_resident_id ? profilesMap.get(l.primary_resident_id) : null,
          }));

        return {
          ...residence,
          buildings: residenceBuildings,
          unassignedLots,
        } as Residence;
      });
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

  const toggleBuilding = (id: string) => {
    const newSet = new Set(expandedBuildings);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedBuildings(newSet);
  };

  const getLotTypeBadge = (type: string | null) => {
    switch (type) {
      case "apartment":
        return <Badge variant="secondary">Appartement</Badge>;
      case "parking":
        return <Badge variant="outline">Parking</Badge>;
      case "storage":
        return <Badge variant="outline">Cave</Badge>;
      case "commercial":
        return <Badge variant="secondary">Commercial</Badge>;
      default:
        return <Badge variant="outline">Lot</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  const totalLots = patrimoine.reduce((sum, r) => 
    sum + r.unassignedLots.length + r.buildings.reduce((bSum, b) => bSum + b.lots.length, 0), 0
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Patrimoine</h3>
          <p className="text-sm text-muted-foreground">
            {patrimoine.length} résidence(s) • {totalLots} lot(s)
          </p>
        </div>
      </div>

      {patrimoine.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun patrimoine</h3>
            <p className="text-muted-foreground">
              Ajoutez d'abord des résidences dans l'onglet Résidences
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {patrimoine.map((residence) => (
            <Card key={residence.id}>
              <CardHeader 
                className="py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleResidence(residence.id)}
              >
                <div className="flex items-center gap-3">
                  {expandedResidences.has(residence.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Building2 className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <CardTitle className="text-base">{residence.name}</CardTitle>
                    {residence.city && (
                      <p className="text-xs text-muted-foreground">{residence.city}</p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {residence.buildings.length} bât. • 
                    {residence.buildings.reduce((s, b) => s + b.lots.length, 0) + residence.unassignedLots.length} lots
                  </Badge>
                </div>
              </CardHeader>

              {expandedResidences.has(residence.id) && (
                <CardContent className="pt-0 pb-4">
                  <div className="space-y-2 ml-7">
                    {/* Buildings */}
                    {residence.buildings.map((building) => (
                      <div key={building.id} className="border rounded-lg">
                        <div 
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleBuilding(building.id)}
                        >
                          {expandedBuildings.has(building.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium flex-1">{building.name}</span>
                          <Badge variant="outline">{building.lots.length} lots</Badge>
                        </div>

                        {expandedBuildings.has(building.id) && building.lots.length > 0 && (
                          <div className="border-t bg-muted/30">
                            {building.lots.map((lot) => (
                              <div 
                                key={lot.id} 
                                className="flex items-center gap-3 p-3 border-b last:border-b-0"
                              >
                                <div className="ml-7 flex-1 flex items-center gap-3">
                                  <span className="font-mono text-sm">{lot.lot_number}</span>
                                  {getLotTypeBadge(lot.type)}
                                  {lot.floor !== null && (
                                    <span className="text-xs text-muted-foreground">
                                      Étage {lot.floor}
                                    </span>
                                  )}
                                  {lot.surface && (
                                    <span className="text-xs text-muted-foreground">
                                      {lot.surface} m²
                                    </span>
                                  )}
                                </div>
                                {lot.primary_resident ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {lot.primary_resident.first_name} {lot.primary_resident.last_name}
                                    </span>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-amber-600">Vacant</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Unassigned Lots */}
                    {residence.unassignedLots.length > 0 && (
                      <div className="border rounded-lg">
                        <div className="p-3 bg-muted/50">
                          <span className="font-medium text-muted-foreground">
                            Lots sans bâtiment ({residence.unassignedLots.length})
                          </span>
                        </div>
                        <div className="border-t">
                          {residence.unassignedLots.map((lot) => (
                            <div 
                              key={lot.id} 
                              className="flex items-center gap-3 p-3 border-b last:border-b-0"
                            >
                              <div className="flex-1 flex items-center gap-3">
                                <span className="font-mono text-sm">{lot.lot_number}</span>
                                {getLotTypeBadge(lot.type)}
                              </div>
                              {lot.primary_resident ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {lot.primary_resident.first_name} {lot.primary_resident.last_name}
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-amber-600">Vacant</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {residence.buildings.length === 0 && residence.unassignedLots.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Aucun bâtiment ni lot dans cette résidence
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
