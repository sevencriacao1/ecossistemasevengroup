import { supabase } from './supabase';

export async function fetchApi<T>(path: string): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sessao nao encontrada.');
  }

  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Erro na API local.');
  }

  return data as T;
}
