import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, ROLE_HIERARCHY } from '@/types/auth';

interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: AppRole | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  hasResidence: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  loginWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  hasRole: (requiredRole: AppRole) => boolean;
  canAccessRental: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isResident: () => boolean;
  isCollaborator: () => boolean;
  // Backward compatibility alias
  isOwner: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasResidence, setHasResidence] = useState(false);

  // Check if user has an active residence (for residents)
  const checkUserHasResidence = async (userId: string): Promise<boolean> => {
    const { data: occupancies } = await supabase
      .from('occupancies')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1);
    return (occupancies?.length || 0) > 0;
  };

  // Fetch user profile and role from database
  const fetchUserProfile = async (userId: string) => {
    try {
      // Get profile (may not exist for older / partially created accounts)
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Auto-create missing profile row so login + redirects can proceed
      if (!profileData) {
        const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
        if (authUserError) {
          console.error('Error fetching auth user:', authUserError);
        }

        const authUser = authUserData?.user;
        const meta = (authUser?.user_metadata ?? {}) as Record<string, unknown>;

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: userId,
              email: authUser?.email ?? null,
              first_name: (meta.first_name as string | undefined) ?? null,
              last_name: (meta.last_name as string | undefined) ?? null,
            },
            { onConflict: 'id' }
          );

        if (upsertError) {
          console.error('Error creating profile:', upsertError);
        }

        const { data: profileAfterUpsert, error: profileAfterUpsertError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .eq('id', userId)
          .maybeSingle();

        if (profileAfterUpsertError) {
          console.error('Error fetching profile after create:', profileAfterUpsertError);
          return null;
        }

        profileData = profileAfterUpsert;
      }

      if (!profileData) return null;

      // Get highest role for user (roles are fetched from user_roles table via RLS)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Determine highest role based on hierarchy - null if no roles assigned
      let highestRole: AppRole | null = null;
      if (rolesData && rolesData.length > 0) {
        for (const roleRecord of rolesData) {
          const role = roleRecord.role as AppRole;
          if (!highestRole || ROLE_HIERARCHY[role] > ROLE_HIERARCHY[highestRole]) {
            highestRole = role;
          }
        }
      }

      return {
        id: profileData.id,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        role: highestRole
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(async () => {
            const profileData = await fetchUserProfile(session.user.id);
            setProfile(profileData);
            // Check residence for residents
            if (profileData?.role === 'resident') {
              const hasRes = await checkUserHasResidence(session.user.id);
              setHasResidence(hasRes);
            } else {
              setHasResidence(true); // Managers/admins don't need residence check
            }
          }, 0);
        } else {
          setProfile(null);
          setHasResidence(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profileData = await fetchUserProfile(session.user.id);
        setProfile(profileData);
        // Check residence for residents
        if (profileData?.role === 'resident') {
          const hasRes = await checkUserHasResidence(session.user.id);
          setHasResidence(hasRes);
        } else {
          setHasResidence(true);
        }
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { error };
    }
    
    return { error: null };
  };

  const loginWithGoogle = async (): Promise<{ error: Error | null }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });
    
    if (error) {
      return { error };
    }
    
    return { error: null };
  };

  const signUp = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<{ error: Error | null }> => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) {
      return { error };
    }

    return { error: null };
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request-password-reset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.error || 'Erreur lors de la demande de réinitialisation') };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setHasResidence(false);
    // Redirect will be handled by the component calling logout
  };

  const hasRole = (requiredRole: AppRole): boolean => {
    if (!profile?.role) return false;
    return ROLE_HIERARCHY[profile.role] >= ROLE_HIERARCHY[requiredRole];
  };

  const isAdmin = () => profile?.role === 'admin';
  // Backward compatibility alias
  const isOwner = () => isAdmin();
  const isManager = () => profile?.role === 'manager' || profile?.role === 'admin';
  const isResident = () => profile?.role === 'resident';
  const isCollaborator = () => profile?.role === 'cs';
  const canAccessRental = () => isAdmin() || profile?.role === 'manager';

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      profile,
      isLoading,
      hasResidence,
      login,
      loginWithGoogle,
      signUp,
      resetPassword,
      logout, 
      hasRole,
      canAccessRental,
      isAdmin,
      isOwner,
      isManager,
      isResident,
      isCollaborator
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
