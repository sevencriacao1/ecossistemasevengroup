import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white text-[#111114]">
      <Button
        variant="secondary"
        size="lg"
        onClick={handleLogout}
        className="rounded-full border-black/10 bg-black text-white shadow-none hover:bg-[#1D1D1F]"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </main>
  );
}
