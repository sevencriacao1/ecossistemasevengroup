import { motion } from 'framer-motion';
import { ArrowRight, Building2, LogOut, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BranchCard } from '../components/guide/BranchCard';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const branchCopy = {
  Seven: {
    title: 'Seven Group',
    eyebrow: 'Ecossistema',
    description: 'Entenda a estrutura central, os serviços e a lógica estratégica por trás do grupo.',
    href: '/guia/seven',
  },
  ARQO: {
    title: 'ARQO',
    eyebrow: 'Operação comercial',
    description: 'Acesse o guia institucional da atuação comercial e imobiliária.',
    href: '/guia/arqo',
  },
  Nexa: {
    title: 'Nexa',
    eyebrow: 'Operação imobiliária',
    description: 'Conheça a estrutura de gestão, suporte e relacionamento com parceiros.',
    href: '/guia/nexa',
  },
};

export function Home() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const availableCompanies = profile?.allowedCompanies || [];

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen overflow-hidden bg-background text-text"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(223,117,13,0.24),transparent_32%),radial-gradient(circle_at_82%_6%,rgba(255,255,255,0.07),transparent_24%),linear-gradient(145deg,#0F0F10_0%,#18181B_48%,#0F0F10_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:96px_96px] opacity-45 [mask-image:linear-gradient(180deg,#000_0%,transparent_78%)]" />
        <div className="absolute left-[-8rem] top-[18rem] h-72 w-[58rem] -rotate-12 bg-primary/10 blur-3xl" />
        <div className="absolute right-[-14rem] top-[-10rem] h-[42rem] w-[42rem] rounded-full border border-primary/15" />
      </div>

      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <button
          onClick={() => navigate('/home')}
          className="text-sm font-semibold uppercase tracking-[0.42em] text-white"
        >
          SEVE<span className="text-primary">N</span>
        </button>
        <div className="flex items-center gap-3">
          {profile?.role === 'admin' && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/usuarios')} className="hidden sm:inline-flex">
              <Shield className="mr-2 h-4 w-4" />
              Admin
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <section className="relative z-10 flex min-h-[calc(100vh-84px)] items-center px-5 pb-14 pt-10 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-7xl"
        >
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-text-muted backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Experiência interna
            </div>
            <div className="inline-flex items-center gap-2 border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-primary">
              <Building2 className="h-3.5 w-3.5" />
              {profile?.company}
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="mb-5 text-sm uppercase tracking-[0.28em] text-text-muted">
                {profile?.full_name || profile?.username}
              </p>
              <h1 className="max-w-5xl text-5xl font-semibold leading-[0.96] tracking-tight text-white sm:text-7xl lg:text-8xl">
                Bem-vindo ao Ecossistema Seven.
              </h1>
            </div>
            <div className="border-l border-primary/40 pl-6">
              <p className="text-lg leading-8 text-[#D6D6D6]">
                Escolha o guia liberado para iniciar sua entrada institucional.
              </p>
              <Button onClick={() => navigate('/guia/seven')} size="lg" className="mt-8 rounded-none">
                Iniciar pela Seven
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { delayChildren: 0.35, staggerChildren: 0.12 } } }}
            className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {availableCompanies.map((company) => (
              <BranchCard
                key={company}
                title={branchCopy[company].title}
                eyebrow={branchCopy[company].eyebrow}
                description={branchCopy[company].description}
                onClick={() => navigate(branchCopy[company].href)}
              />
            ))}
          </motion.div>
        </motion.div>
      </section>
    </motion.main>
  );
}
