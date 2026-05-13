import { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Layout } from '../components/Layout';
import { CheckCircle2, Clock, Lock, ArrowRight, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../lib/api';
import { Skeleton } from '../components/ui/Skeleton';

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'bloqueado';
  progress: number;
}

interface ModuleRecord {
  id: string;
  title: string;
  description?: string;
  duration: string;
}

interface ProgressRecord {
  module_id: string;
  status?: Module['status'];
  progress?: number;
}

export function Modules() {
  const { profile } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchModules() {
      if (!profile) return;
      try {
        const [mods, prog] = await Promise.all([
          fetchApi<ModuleRecord[]>('/api/modules'),
          fetchApi<ProgressRecord[]>('/api/progress'),
        ]);

        let hasPending = false;
        const merged: Module[] = (mods || []).map((m) => {
          const userProg = prog?.find((p) => p.module_id === m.id);
          let status = userProg?.status || 'pendente';
          if (status === 'pendente' && hasPending) status = 'bloqueado';
          if (status === 'pendente' || status === 'em_andamento') hasPending = true;

          return {
            id: m.id,
            title: m.title,
            description: m.description || '',
            duration: m.duration,
            status: status as Module['status'],
            progress: userProg?.progress || 0,
          };
        });

        setModules(merged);
      } catch (error) {
        console.error('Erro ao carregar modulos:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchModules();
  }, [profile]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-surface-border text-xs font-medium text-text-muted mb-6 shadow-glass">
            <Layers className="w-3 h-3 text-primary" />
            Modulos
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-4">
            Trilha de Aprendizado
          </h1>
          <p className="text-lg text-text-muted font-light max-w-2xl">
            Sua jornada de conhecimento estruturada para extrair o maximo de performance no Ecossistema Seven Group.
          </p>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[380px] rounded-3xl" />
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div className="border border-surface-border rounded-2xl p-8 text-center text-text-muted bg-surface/20">
          Nenhum modulo encontrado no Supabase para este usuario.
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              variants={item}
              className={`relative bg-surface/20 backdrop-blur-xl border rounded-3xl overflow-hidden transition-all duration-500 group flex flex-col shadow-glass ${
                module.status === 'bloqueado'
                  ? 'border-surface-border/30 opacity-50 grayscale-[0.8]'
                  : 'border-surface-border hover:border-surface-border/80 hover:bg-surface/40 hover:shadow-premium cursor-pointer'
              }`}
            >
              <div className="h-48 w-full bg-background relative overflow-hidden border-b border-surface-border">
                <div className={`absolute inset-0 opacity-30 transition-transform duration-1000 group-hover:scale-110 ${
                  index % 3 === 0 ? 'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/40 via-background to-background' :
                  index % 3 === 1 ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-background to-background' :
                  'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/20 via-background to-background'
                }`} />

                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                  <div className="w-24 h-24 border border-white/20 rounded-full absolute" />
                  <div className="w-32 h-32 border border-white/10 rounded-full absolute rotate-45" />
                </div>

                <div className="absolute top-5 right-5 bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-surface-border shadow-glass flex items-center gap-1.5 text-xs font-medium text-text">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  {module.duration}
                </div>

                {module.status === 'bloqueado' && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-surface border border-surface-border flex items-center justify-center shadow-glass">
                      <Lock className="w-5 h-5 text-text-dark" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-text mb-3 tracking-tight group-hover:text-primary transition-colors">
                    {module.title}
                  </h3>
                  {module.description && (
                    <p className="text-sm text-text-muted line-clamp-2 leading-relaxed font-light">
                      {module.description}
                    </p>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-surface-border/50">
                  {module.status === 'em_andamento' && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-primary font-medium tracking-wide uppercase">Em andamento</span>
                        <span className="text-text-muted">{module.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-surface-border shadow-glass">
                        <div className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full relative" style={{ width: `${module.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {module.status === 'concluido' && (
                    <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Modulo Concluido
                    </div>
                  )}

                  {module.status === 'pendente' && (
                    <div className="flex items-center justify-between text-sm text-text-muted font-medium group-hover:text-text transition-colors">
                      <span>Iniciar modulo</span>
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                  )}

                  {module.status === 'bloqueado' && (
                    <div className="text-sm text-text-dark font-medium flex items-center gap-2">
                      Conclua o anterior para liberar
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </Layout>
  );
}
