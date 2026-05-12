import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoading: isAuthLoading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resolveLoginEmail = (value: string) => {
    const login = value.toLowerCase().trim();
    if (login.includes('@')) return login;
    return `${login}@crm.local`;
  };

  useEffect(() => {
    if (session) {
      const origin = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
    }
  }, [session, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const email = resolveLoginEmail(username);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      setError('Credenciais invalidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-glow"
          >
            <div className="w-5 h-5 rounded-sm bg-primary" />
          </motion.div>
          <h1 className="text-2xl font-semibold text-text mb-3 tracking-tight">Ecossistema Seven Group</h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Voce não está entrando apenas em uma empresa.<br />
            Voce está entrando em um ecossistema criado para gerar performance.
          </p>
        </div>

        <div className="bg-surface/50 backdrop-blur-xl border border-surface-border rounded-2xl p-6 shadow-premium">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted ml-1">Usuário</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Insira seu usuário"
                required
                className="bg-background/50 border-surface-border/50 focus:bg-surface"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-text-muted ml-1">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                minLength={6}
                className="bg-background/50 border-surface-border/50 focus:bg-surface"
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Iniciar jornada'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
