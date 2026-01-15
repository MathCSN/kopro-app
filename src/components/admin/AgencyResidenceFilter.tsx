import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Home } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Agency {
  id: string;
  name: string;
}

interface Residence {
  id: string;
  name: string;
  agency_id: string | null;
}

interface AgencyResidenceFilterProps {
  selectedAgency: string;
  selectedResidence: string;
  onAgencyChange: (agencyId: string) => void;
  onResidenceChange: (residenceId: string) => void;
  className?: string;
}

export function AgencyResidenceFilter({
  selectedAgency,
  selectedResidence,
  onAgencyChange,
  onResidenceChange,
  className = "",
}: AgencyResidenceFilterProps) {
  // Fetch all agencies
  const { data: agencies = [] } = useQuery({
    queryKey: ["admin-agencies-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return (data || []) as Agency[];
    },
  });

  // Fetch residences based on selected agency
  const { data: residences = [] } = useQuery({
    queryKey: ["admin-residences-filter", selectedAgency],
    queryFn: async () => {
      let query = supabase
        .from("residences")
        .select("id, name, agency_id")
        .order("name");

      if (selectedAgency !== "all") {
        query = query.eq("agency_id", selectedAgency);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Residence[];
    },
  });

  // Reset residence when agency changes
  useEffect(() => {
    if (selectedAgency !== "all" && selectedResidence !== "all") {
      const residenceExists = residences.some((r) => r.id === selectedResidence);
      if (!residenceExists && residences.length > 0) {
        onResidenceChange("all");
      }
    }
  }, [selectedAgency, residences, selectedResidence, onResidenceChange]);

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      {/* Agency Filter */}
      <Select value={selectedAgency} onValueChange={onAgencyChange}>
        <SelectTrigger className="w-full sm:w-56">
          <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Toutes les agences" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les agences</SelectItem>
          {agencies.map((agency) => (
            <SelectItem key={agency.id} value={agency.id}>
              {agency.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Residence Filter */}
      <Select value={selectedResidence} onValueChange={onResidenceChange}>
        <SelectTrigger className="w-full sm:w-56">
          <Home className="h-4 w-4 mr-2 text-muted-foreground" />
          <SelectValue placeholder="Toutes les résidences" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {selectedAgency === "all"
              ? "Toutes les résidences"
              : "Toutes les résidences de l'agence"}
          </SelectItem>
          {residences.map((residence) => (
            <SelectItem key={residence.id} value={residence.id}>
              {residence.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
