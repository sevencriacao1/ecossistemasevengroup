import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isLoading: isAuthLoading, signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      const origin = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/home';
      navigate(origin, { replace: true });
    }
  }, [session, navigate, location]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await signIn(username, password);
      navigate(user.role === 'admin' ? '/home' : '/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciais inválidas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-text selection:bg-primary/30">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(223,117,13,0.24),transparent_28%),radial-gradient(circle_at_72%_62%,rgba(255,255,255,0.06),transparent_30%),linear-gradient(120deg,#0F0F10_0%,#18181B_48%,#0F0F10_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:84px_84px] [mask-image:radial-gradient(ellipse_at_38%_45%,#000_0%,transparent_72%)]" />
        <div className="absolute right-[-10rem] top-[-8rem] h-[42rem] w-[42rem] rounded-full border border-primary/20" />
        <div className="absolute right-[-4rem] top-[5rem] h-[34rem] w-[34rem] rounded-full border border-white/10" />
        <div className="absolute -left-28 top-0 h-[130%] w-72 rotate-12 bg-primary/20 blur-3xl" />
      </div>

      <section className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-16"
        >
          <div className="max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-3 border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium uppercase tracking-[0.32em] text-text-muted backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_18px_rgba(223,117,13,0.9)]" />
              Seven Group
            </div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">
              Ecossistema Seven Group
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[#D6D6D6] sm:text-xl">
              Você não está entrando apenas em uma empresa. Você está entrando em uma operação premium, estratégica e organizada para gerar performance no mercado imobiliário.
            </p>
          </div>
        </motion.div>

        <div className="flex items-center px-6 pb-12 sm:px-10 lg:px-16 lg:pb-0">
          <motion.div
            initial={{ opacity: 0, x: 26 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md border border-white/10 bg-[#18181B]/70 p-6 shadow-premium backdrop-blur-2xl sm:p-8"
          >
            <div className="mb-8 flex items-start justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-primary">Acesso interno</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">Iniciar jornada</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-glow">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">Usuário</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="admin ou gabriel"
                  required
                  className="h-12 rounded-none bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="123456"
                  required
                  minLength={6}
                  className="h-12 rounded-none bg-background/50"
                />
              </div>

              <Button type="submit" size="lg" className="mt-4 w-full rounded-none" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar no ecossistema'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
