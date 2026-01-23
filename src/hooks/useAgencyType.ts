import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AgencyType = 'bailleur' | 'syndic' | null;

interface UseAgencyTypeResult {
  agencyType: AgencyType;
  agencyId: string | null;
  agencyName: string | null;
  isLoading: boolean;
}

export function useAgencyType(): UseAgencyTypeResult {
  const { user, profile } = useAuth();
  const [agencyType, setAgencyType] = useState<AgencyType>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgencyType = async () => {
      if (!user || !profile) {
        setIsLoading(false);
        return;
      }

      // Admin role doesn't have an agency type
      if (profile.role === 'admin') {
        setIsLoading(false);
        return;
      }

      try {
        // Get the user's agency via user_roles
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('agency_id')
          .eq('user_id', user.id)
          .not('agency_id', 'is', null)
          .maybeSingle();

        if (roleError) {
          console.error('Error fetching user role:', roleError);
          setIsLoading(false);
          return;
        }

        if (!roleData?.agency_id) {
          setIsLoading(false);
          return;
        }

        // Get the agency type
        const { data: agencyData, error: agencyError } = await supabase
          .from('agencies')
          .select('id, name, type')
          .eq('id', roleData.agency_id)
          .maybeSingle();

        if (agencyError) {
          console.error('Error fetching agency:', agencyError);
          setIsLoading(false);
          return;
        }

        if (agencyData) {
          setAgencyId(agencyData.id);
          setAgencyName(agencyData.name);
          setAgencyType(agencyData.type as AgencyType);
        }
      } catch (error) {
        console.error('Error in useAgencyType:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgencyType();
  }, [user, profile]);

  return { agencyType, agencyId, agencyName, isLoading };
}
