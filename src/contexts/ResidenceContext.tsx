import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Residence {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
}

interface ResidenceContextType {
  residences: Residence[];
  selectedResidence: Residence | null;
  setSelectedResidence: (residence: Residence | null) => void;
  isAllResidences: boolean;
  setIsAllResidences: (value: boolean) => void;
  isLoading: boolean;
}

const ResidenceContext = createContext<ResidenceContextType | undefined>(undefined);

const STORAGE_KEY = "kopro_selected_residence";

export function ResidenceProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [residences, setResidences] = useState<Residence[]>([]);
  const [selectedResidence, setSelectedResidenceState] = useState<Residence | null>(null);
  const [isAllResidences, setIsAllResidences] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's residences
  useEffect(() => {
    async function fetchResidences() {
      if (!user) {
        setResidences([]);
        setSelectedResidenceState(null);
        setIsLoading(false);
        return;
      }

      try {
        // Get user roles to find their residences
        const { data: userRoles, error: rolesError } = await supabase
          .from("user_roles")
          .select("residence_id, role")
          .eq("user_id", user.id);

        if (rolesError) throw rolesError;

        // Check if user is owner (can see all residences)
        const isOwner = userRoles?.some((r) => r.role === "owner");

        let residenceQuery;
        if (isOwner) {
          // Owners can see all residences
          residenceQuery = supabase.from("residences").select("id, name, address, city");
        } else {
          // Get specific residences for this user
          const residenceIds = userRoles
            ?.filter((r) => r.residence_id)
            .map((r) => r.residence_id) || [];

          if (residenceIds.length === 0) {
            setResidences([]);
            setIsLoading(false);
            return;
          }

          residenceQuery = supabase
            .from("residences")
            .select("id, name, address, city")
            .in("id", residenceIds);
        }

        const { data: residencesData, error: residencesError } = await residenceQuery;

        if (residencesError) throw residencesError;

        setResidences(residencesData || []);

        // Restore selected residence from localStorage
        const savedId = localStorage.getItem(STORAGE_KEY);
        if (savedId && savedId !== "all") {
          const saved = residencesData?.find((r) => r.id === savedId);
          if (saved) {
            setSelectedResidenceState(saved);
            setIsAllResidences(false);
          } else if (residencesData && residencesData.length > 0) {
            setSelectedResidenceState(residencesData[0]);
          }
        } else if (savedId === "all") {
          setIsAllResidences(true);
          setSelectedResidenceState(null);
        } else if (residencesData && residencesData.length > 0) {
          setSelectedResidenceState(residencesData[0]);
        }
      } catch (error) {
        console.error("Error fetching residences:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResidences();
  }, [user]);

  const setSelectedResidence = (residence: Residence | null) => {
    setSelectedResidenceState(residence);
    setIsAllResidences(false);
    if (residence) {
      localStorage.setItem(STORAGE_KEY, residence.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSetIsAllResidences = (value: boolean) => {
    setIsAllResidences(value);
    if (value) {
      setSelectedResidenceState(null);
      localStorage.setItem(STORAGE_KEY, "all");
    }
  };

  return (
    <ResidenceContext.Provider
      value={{
        residences,
        selectedResidence,
        setSelectedResidence,
        isAllResidences,
        setIsAllResidences: handleSetIsAllResidences,
        isLoading,
      }}
    >
      {children}
    </ResidenceContext.Provider>
  );
}

export function useResidence() {
  const context = useContext(ResidenceContext);
  if (context === undefined) {
    throw new Error("useResidence must be used within a ResidenceProvider");
  }
  return context;
}
