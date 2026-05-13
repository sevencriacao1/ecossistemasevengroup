import { ArrowLeft, Home, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface GuideNavigationProps {
  title: string;
  sectionCount: number;
}

export function GuideNavigation({ title, sectionCount }: GuideNavigationProps) {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-background/70 px-4 py-3 backdrop-blur-2xl sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-white/[0.04] text-text-muted transition hover:border-primary/40 hover:text-primary"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{title}</p>
            <p className="text-xs text-text-dark">{sectionCount} seções • {profile?.company}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')} className="px-3">
            <Home className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Início</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="px-3">
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
