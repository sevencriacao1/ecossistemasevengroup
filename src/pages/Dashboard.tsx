import { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Layout } from '../components/Layout';
import { PlayCircle, CheckCircle2, Clock, BookOpen, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../lib/api';
import { Skeleton } from '../components/ui/Skeleton';
import { useNavigate } from 'react-router-dom';

interface Module {
  id: string;
  title: string;
  duration: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  progress: number;
}

interface ModuleRecord {
  id: string;
  title: string;
  duration: string;
}

interface ProgressRecord {
  module_id: string;
  status?: Module['status'];
  progress?: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!profile) return;
      try {
        const [mods, prog] = await Promise.all([
          fetchApi<ModuleRecord[]>('/api/modules'),
          fetchApi<ProgressRecord[]>('/api/progress'),
        ]);

        const merged: Module[] = (mods || []).map((m) => {
          const userProg = prog?.find((p) => p.module_id === m.id);
          return {
            id: m.id,
            title: m.title,
            duration: m.duration,
            status: userProg?.status || 'pendente',
            progress: userProg?.progress || 0,
          };
        });

        setModules(merged);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, [profile]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  const completedCount = modules.filter((m) => m.status === 'concluido').length;
  const totalProgress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
  const currentModule = modules.find((m) => m.status === 'em_andamento') || modules.find((m) => m.status === 'pendente');

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-surface-border text-xs font-medium text-text-muted mb-6 shadow-glass">
          <TrendingUp className="w-3 h-3 text-primary" />
          Visao Geral
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-4">
          Ola, {profile?.full_name?.split(' ')[0] || profile?.username}
        </h1>
        <p className="text-lg text-text-muted font-light">
          Acompanhe sua evolucao no ecossistema <span className="text-text font-medium">{profile?.company}</span>.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="col-span-1 lg:col-span-2 h-[320px] rounded-3xl" />
            <Skeleton className="col-span-1 h-[320px] rounded-3xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="col-span-1 lg:col-span-2 bg-surface/30 backdrop-blur-2xl border border-surface-border rounded-3xl p-8 relative overflow-hidden group shadow-premium"
            >
              <div className="absolute inset-0 bg-glass-gradient opacity-50" />
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px] transition-opacity duration-700 group-hover:opacity-100 opacity-50" />

              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-text tracking-tight mb-1">Progresso da Jornada</h2>
                  <p className="text-sm text-text-muted">Trilha de Onboarding {profile?.company}</p>
                </div>

                <div className="mt-12">
                  <div className="flex items-baseline gap-4 mb-6">
                    <span className="text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary-hover">
                      {totalProgress}%
                    </span>
                    <span className="text-base text-text-dark font-medium mb-2">
                      {completedCount} de {modules.length} concluidos
                    </span>
                  </div>

                  <div className="h-3 w-full bg-background/50 rounded-full overflow-hidden border border-surface-border shadow-glass">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${totalProgress}%` }}
                      transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -translate-x-full" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="col-span-1 bg-gradient-to-br from-surface to-background border border-surface-border rounded-3xl p-8 flex flex-col justify-between shadow-premium relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-active border border-surface-border text-xs font-medium text-text mb-6 shadow-glass">
                  <PlayCircle className="w-3.5 h-3.5 text-primary" />
                  {currentModule?.status === 'em_andamento' ? 'Continuar' : 'Proximo'}
                </div>
                <h3 className="text-2xl font-semibold text-text tracking-tight mb-3 leading-snug">
                  {currentModule?.title || 'Sem modulos disponiveis'}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {currentModule ? 'Acesse agora para continuar sua evolucao no ecossistema.' : 'Nenhum modulo foi liberado para este perfil no Supabase.'}
                </p>
              </div>
              <button
                disabled={!currentModule}
                onClick={() => navigate('/modulos')}
                className="mt-8 w-full py-3.5 bg-text text-background text-sm font-semibold rounded-full hover:bg-white transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 group/btn"
              >
                {currentModule ? 'Acessar Modulo' : 'Aguardando conteudos'}
                {currentModule && <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />}
              </button>
            </motion.div>
          </div>

          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-text tracking-tight">Sua Trilha</h2>
              <p className="text-sm text-text-muted mt-1">Modulos recentes e proximos passos</p>
            </div>
            <button onClick={() => navigate('/modulos')} className="text-sm font-medium text-text hover:text-primary transition-colors flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {modules.length === 0 ? (
            <div className="border border-surface-border rounded-2xl p-8 text-center text-text-muted bg-surface/20">
              Nenhum modulo encontrado no Supabase para este usuario.
            </div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {modules.slice(0, 4).map((module) => (
                <motion.div
                  key={module.id}
                  variants={item}
                  onClick={() => navigate('/modulos')}
                  className="bg-surface/20 backdrop-blur-xl border border-surface-border rounded-2xl p-6 hover:border-surface-border/80 hover:bg-surface/40 transition-all duration-500 cursor-pointer group shadow-glass relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-glass ${
                      module.status === 'concluido'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-surface-active text-text-muted group-hover:text-primary border border-surface-border group-hover:border-primary/30'
                    }`}>
                      {module.status === 'concluido' ? <CheckCircle2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-dark font-medium bg-surface px-2.5 py-1 rounded-full border border-surface-border shadow-glass">
                      <Clock className="w-3 h-3" />
                      {module.duration}
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-text mb-3 tracking-tight line-clamp-2 group-hover:text-primary transition-colors relative z-10">
                    {module.title}
                  </h3>

                  <div className="relative z-10 mt-auto pt-4">
                    {module.status === 'em_andamento' && (
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-primary font-medium">Em andamento</span>
                          <span className="text-text-muted">{module.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-surface-border shadow-glass">
                          <div className="h-full bg-primary rounded-full relative" style={{ width: `${module.progress}%` }} />
                        </div>
                      </div>
                    )}

                    {module.status === 'pendente' && (
                      <div className="text-xs text-text-dark font-medium flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-text-dark/50" />
                        Pendente
                      </div>
                    )}

                    {module.status === 'concluido' && (
                      <div className="text-xs text-green-500 font-medium flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                        Concluido
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </Layout>
  );
}
