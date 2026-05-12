import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Compass, BookOpen, FileText, BarChart, Settings, Users, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Compass, label: 'Minha Jornada', href: '/jornada' },
  { icon: BookOpen, label: 'Módulos', href: '/modulos' },
  { icon: FileText, label: 'Materiais', href: '/materiais' },
  { icon: BarChart, label: 'Progresso', href: '/progresso' },
];

const adminItems = [
  { icon: Users, label: 'Usuários', href: '/admin/usuarios' },
  { icon: Settings, label: 'Configurações', href: '/admin/config' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const isAdmin = profile?.role === 'admin';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex selection:bg-primary/30 selection:text-white">
      {/* Sidebar - Framer Style */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-[260px] border-r border-surface-border bg-background/60 backdrop-blur-2xl flex flex-col fixed h-full z-30"
      >
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-glow shadow-glass">
              <div className="w-3 h-3 rounded-sm bg-white" />
            </div>
            <span className="font-semibold text-text tracking-tight text-lg">Seven</span>
          </div>
        </div>

        <div className="flex-1 px-4 py-4 space-y-8 overflow-y-auto custom-scrollbar">
          <div>
            <p className="px-3 text-xs font-semibold text-text-dark uppercase tracking-widest mb-4">Plataforma</p>
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.href} to={item.href}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group",
                      isActive 
                        ? "bg-surface text-text shadow-glass border border-surface-border" 
                        : "text-text-muted hover:bg-surface/50 hover:text-text border border-transparent"
                    )}>
                      <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-text-dark group-hover:text-text-muted")} />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {isAdmin && (
            <div>
              <p className="px-3 text-xs font-semibold text-text-dark uppercase tracking-widest mb-4">Administração</p>
              <nav className="space-y-1">
                {adminItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link key={item.href} to={item.href}>
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group",
                        isActive 
                          ? "bg-surface text-text shadow-glass border border-surface-border" 
                          : "text-text-muted hover:bg-surface/50 hover:text-text border border-transparent"
                      )}>
                        <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-text-dark group-hover:text-text-muted")} />
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface/50 border border-surface-border shadow-glass">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-surface-active to-surface flex items-center justify-center text-xs font-medium text-text border border-surface-border">
              {profile?.full_name?.charAt(0).toUpperCase() || profile?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">{profile?.full_name || profile?.username}</p>
              <p className="text-xs text-text-dark truncate">{profile?.company}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-text-dark hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 ml-[260px] relative min-h-screen">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none opacity-30" />
        <div className="relative z-10 p-10 lg:p-16 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
