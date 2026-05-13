import { useLocation, useNavigate } from 'react-router-dom';
import { SevenEntryTransition } from '../components/SevenEntryTransition';
import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const showChoices = Boolean((location.state as { showChoices?: boolean } | null)?.showChoices);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return <SevenEntryTransition onLogout={handleLogout} initialChoices={showChoices} />;
}
