import { motion } from 'framer-motion';
import { ArrowLeft, Building2, LogOut, Shield, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export function AdminUsers() {
  const navigate = useNavigate();
  const { users, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-text sm:px-8 lg:px-12">
      <header className="mb-16 flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Início
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-6xl"
      >
        <p className="mb-5 text-sm uppercase tracking-[0.28em] text-primary">Administração simples</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">Usuários mockados</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-text-muted">
          Visualização interna dos perfis disponíveis para validar acesso por empresa e papel nesta versão do guia.
        </p>

        <div className="mt-14 overflow-hidden border border-white/10 bg-white/[0.04] shadow-premium backdrop-blur-2xl">
          <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] gap-4 border-b border-white/10 px-6 py-4 text-xs font-medium uppercase tracking-[0.2em] text-text-dark max-md:hidden">
            <span>Usuário</span>
            <span>Empresa</span>
            <span>Role</span>
            <span>Acessos</span>
          </div>

          <div className="divide-y divide-white/10">
            {users.map((user) => (
              <div key={user.id} className="grid gap-5 px-6 py-6 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] md:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-white/10 bg-white/[0.05] text-text-muted">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{user.full_name}</p>
                    <p className="text-sm text-text-dark">@{user.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-text-muted">
                  <Building2 className="h-4 w-4 text-primary" />
                  {user.company}
                </div>

                <div className="flex items-center gap-2 text-text-muted">
                  <Shield className="h-4 w-4 text-primary" />
                  {user.role === 'admin' ? 'Administrador' : 'Colaborador'}
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.allowedCompanies.map((company) => (
                    <span key={company} className="border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-primary">
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
