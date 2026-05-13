import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Company = 'Seven' | 'ARQO' | 'Nexa';
export type UserRole = 'admin' | 'colaborador';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  company: Company;
}

interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, company')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Erro ao carregar perfil:', error);
    return null;
  }

  return data as UserProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);

      if (nextSession?.user.id) {
        const nextProfile = await loadProfile(nextSession.user.id);
        if (isMounted) setProfile(nextProfile);
      } else {
        setProfile(null);
      }
    };

    supabase.auth.getSession().then(async ({ data }) => {
      await syncSession(data.session);
      if (isMounted) setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error('Credenciais invalidas. Tente novamente.');
    }

    setSession(data.session);
    const nextProfile = data.user ? await loadProfile(data.user.id) : null;
    setProfile(nextProfile);
    return nextProfile;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const value = useMemo<AuthContextType>(() => ({
    session,
    user: profile,
    profile,
    isLoading,
    signIn,
    signOut,
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
