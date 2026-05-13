import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Company = 'Seven' | 'ARQO' | 'Nexa';
export type UserRole = 'admin' | 'colaborador';

export interface MockUser {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  company: Company;
  allowedCompanies: Company[];
}

interface MockSession {
  token: string;
  userId: string;
}

interface AuthContextType {
  session: MockSession | null;
  user: MockUser | null;
  profile: MockUser | null;
  users: MockUser[];
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<MockUser>;
  signOut: () => Promise<void>;
  canAccessCompany: (company: Company) => boolean;
}

const STORAGE_KEY = 'seven.mock.session';

export const mockUsers: MockUser[] = [
  {
    id: 'user-admin-seven',
    username: 'admin',
    full_name: 'Admin Seven',
    role: 'admin',
    company: 'Seven',
    allowedCompanies: ['Seven', 'ARQO', 'Nexa'],
  },
  {
    id: 'user-gabriel-arqo',
    username: 'gabriel',
    full_name: 'Gabriel',
    role: 'colaborador',
    company: 'ARQO',
    allowedCompanies: ['Seven', 'ARQO'],
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createSession = (userId: string): MockSession => ({
  token: `mock-${userId}-${Date.now()}`,
  userId,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MockSession | null>(null);
  const [profile, setProfile] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as MockSession;
        const storedUser = mockUsers.find((mockUser) => mockUser.id === parsed.userId);

        if (storedUser) {
          setSession(parsed);
          setProfile(storedUser);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    const normalizedUsername = username.trim().toLowerCase();
    const foundUser = mockUsers.find((mockUser) => mockUser.username === normalizedUsername);

    if (!foundUser || password !== '123456') {
      throw new Error('Credenciais inválidas. Tente novamente.');
    }

    const nextSession = createSession(foundUser.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setProfile(foundUser);
    return foundUser;
  };

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setProfile(null);
  };

  const canAccessCompany = (company: Company) => {
    if (!profile) return false;
    return profile.allowedCompanies.includes(company);
  };

  const value = useMemo<AuthContextType>(() => ({
    session,
    user: profile,
    profile,
    users: mockUsers,
    isLoading,
    signIn,
    signOut,
    canAccessCompany,
  }), [session, profile, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
