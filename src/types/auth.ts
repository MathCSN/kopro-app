export type AppRole = 'owner' | 'manager' | 'cs' | 'resident';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  residence_id: string | null;
  role: AppRole;
}

export interface DemoUser {
  email: string;
  password: string;
  role: AppRole;
  name: string;
  badge: string;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: 'Administrateur',
  manager: 'Gestionnaire',
  cs: 'Conseil Syndical',
  resident: 'Résident',
};

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  owner: 100,
  manager: 60,
  cs: 40,
  resident: 20,
};
