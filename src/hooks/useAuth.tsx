import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, ROLE_HIERARCHY } from '@/types/auth';

interface UserProfile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role: AppRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  loginWithGoogle: () => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  hasRole: (requiredRole: AppRole) => boolean;
  canAccessRental: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  // Backward compatibility alias
  isOwner: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile and role from database
  const fetchUserProfile = async (userId: string) => {
    try {
      // Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Get highest role for user (roles are fetched from user_roles table via RLS)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      // Determine highest role based on hierarchy
      let highestRole: AppRole = 'resident';
      if (rolesData && rolesData.length > 0) {
        for (const roleRecord of rolesData) {
          const role = roleRecord.role as AppRole;
          if (ROLE_HIERARCHY[role] > ROLE_HIERARCHY[highestRole]) {
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
          setTimeout(() => {
            fetchUserProfile(session.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).then((profile) => {
          setProfile(profile);
          setIsLoading(false);
        });
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    
    if (error) {
      return { error };
    }
    
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const hasRole = (requiredRole: AppRole): boolean => {
    if (!profile) return false;
    return ROLE_HIERARCHY[profile.role] >= ROLE_HIERARCHY[requiredRole];
  };

  const isAdmin = () => profile?.role === 'admin';
  // Backward compatibility alias
  const isOwner = () => isAdmin();
  const isManager = () => profile?.role === 'manager' || profile?.role === 'admin';
  const canAccessRental = () => isAdmin() || profile?.role === 'manager';

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      profile,
      isLoading, 
      login,
      loginWithGoogle,
      signUp,
      resetPassword,
      logout, 
      hasRole,
      canAccessRental,
      isAdmin,
      isOwner,
      isManager
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
