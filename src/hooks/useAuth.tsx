import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRole, ROLE_HIERARCHY } from '@/types/auth';

interface DemoUser {
  email: string;
  role: AppRole;
  name: string;
  badge: string;
}

interface AuthContextType {
  user: DemoUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (requiredRole: AppRole) => boolean;
  canAccessRental: () => boolean;
  isOwner: () => boolean;
  isManager: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users
const demoUsers: (DemoUser & { password: string })[] = [
  { email: "resident@kopro.fr", password: "demo123", role: "resident", name: "Marie Dupont", badge: "Résident" },
  { email: "cs@kopro.fr", password: "demo123", role: "cs", name: "Jean Martin", badge: "Conseil Syndical" },
  { email: "gestionnaire@kopro.fr", password: "demo123", role: "manager", name: "Sophie Bernard", badge: "Gestionnaire" },
  { email: "admin@kopro.fr", password: "demo123", role: "admin", name: "Admin Système", badge: "Superadmin" },
  { email: "owner@kopro.fr", password: "demo123", role: "owner", name: "Pierre Fondateur", badge: "Fondateur / Owner" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("kopro_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("kopro_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const foundUser = demoUsers.find(u => u.email === email && u.password === password);
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      localStorage.setItem("kopro_user", JSON.stringify(userWithoutPassword));
      setUser(userWithoutPassword);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("kopro_user");
    setUser(null);
  };

  const hasRole = (requiredRole: AppRole): boolean => {
    if (!user) return false;
    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
  };

  const isOwner = () => user?.role === 'owner';
  const isManager = () => user?.role === 'manager' || user?.role === 'admin' || user?.role === 'owner';
  const canAccessRental = () => isOwner() || user?.role === 'manager' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      hasRole,
      canAccessRental,
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
