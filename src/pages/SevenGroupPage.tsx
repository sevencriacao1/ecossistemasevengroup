import { ArrowLeft, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SevenAbout } from '../components/seven/SevenAbout';
import { SevenCommitment } from '../components/seven/SevenCommitment';
import { SevenCreativeTeam } from '../components/seven/SevenCreativeTeam';
import { SevenCTA } from '../components/seven/SevenCTA';
import { SevenDifferentials } from '../components/seven/SevenDifferentials';
import { SevenEcosystem } from '../components/seven/SevenEcosystem';
import { SevenFocus } from '../components/seven/SevenFocus';
import { SevenHero } from '../components/seven/SevenHero';
import { SevenLeadership } from '../components/seven/SevenLeadership';
import { SevenMetrics } from '../components/seven/SevenMetrics';
import { SevenMindset } from '../components/seven/SevenMindset';
import { SevenPainPoints } from '../components/seven/SevenPainPoints';
import { SevenPillars } from '../components/seven/SevenPillars';
import { SevenResults } from '../components/seven/SevenResults';
import { navItems } from '../components/seven/sevenContent';
import { cn } from '../lib/utils';

export function SevenGroupPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const inertiaTimer = useRef<number | null>(null);
  const lastWheelDirection = useRef(1);

  const handleSoftWheel = (event: globalThis.WheelEvent) => {
    lastWheelDirection.current = event.deltaY >= 0 ? 1 : -1;

    if (inertiaTimer.current) {
      window.clearTimeout(inertiaTimer.current);
    }

    inertiaTimer.current = window.setTimeout(() => {
      window.scrollBy({
        top: lastWheelDirection.current * 72,
        behavior: 'smooth',
      });
    }, 90);
  };

  useEffect(() => {
    const onWheel = (event: globalThis.WheelEvent) => handleSoftWheel(event);
    window.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      window.removeEventListener('wheel', onWheel);
      if (inertiaTimer.current) {
        window.clearTimeout(inertiaTimer.current);
      }
    };
  }, []);

  return (
    <main
      id="topo"
      className="min-h-screen scroll-smooth bg-[#F7F7F8] text-[#111114] selection:bg-[#ff6a00]/20"
    >
      <header className="fixed left-0 right-0 top-0 z-50 px-4 py-4 sm:px-6">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-black/[0.06] bg-white/72 px-4 py-3 shadow-[0_18px_54px_rgba(17,17,20,0.10)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#111114] transition hover:bg-black/[0.04]"
          >
            <ArrowLeft className="h-4 w-4" />
            <img
              src="/assets/seven/Logo%20Seven%20Group.webp"
              alt="Seven Group"
              className="h-5 w-auto object-contain"
            />
          </button>

          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#65656D] transition hover:bg-black/[0.04] hover:text-[#111114]"
              >
                {item.label}
              </a>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111114] text-white lg:hidden"
            aria-label="Abrir navegação"
          >
            <Menu className="h-4 w-4" />
          </button>
        </nav>

        <div
          className={cn(
            'mx-auto mt-2 grid max-w-7xl gap-1 overflow-hidden rounded-[24px] border border-black/[0.06] bg-white/86 p-2 shadow-[0_18px_54px_rgba(17,17,20,0.10)] backdrop-blur-2xl transition-all lg:hidden',
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 border-transparent p-0 opacity-0'
          )}
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className="rounded-2xl px-4 py-3 text-sm font-semibold text-[#424248] hover:bg-black/[0.04]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </header>

      <SevenHero />
      <SevenAbout />
      <SevenMindset />
      <SevenMetrics />
      <SevenResults />
      <SevenLeadership />
      <SevenCreativeTeam />
      <SevenEcosystem />
      <SevenPainPoints />
      <SevenPillars />
      <SevenDifferentials />
      <SevenFocus />
      <SevenCommitment />
      <SevenCTA />
    </main>
  );
}
