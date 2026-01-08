export type AppRole = 'admin' | 'manager' | 'cs' | 'resident';

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
  admin: 'Kopro',
  manager: 'Responsable',
  cs: 'Collaborateur',
  resident: 'Résident',
};

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  admin: 100,
  manager: 60,
  cs: 40,
  resident: 20,
};

// Roles that each role can assign
export const ASSIGNABLE_ROLES: Record<AppRole, AppRole[]> = {
  admin: ['manager', 'cs', 'resident'],
  manager: ['cs', 'resident'],
  cs: [],
  resident: [],
};
