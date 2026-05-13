import { ArrowUp, Home, Layers3 } from 'lucide-react';
import { WheelEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnchorButton, Reveal } from './SevenPrimitives';

export function SevenCTA() {
  const navigate = useNavigate();
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [scrollIntent, setScrollIntent] = useState(0);

  const handleCtaWheel = (event: WheelEvent<HTMLElement>) => {
    if (event.deltaY <= 0) {
      setScrollIntent(0);
      return;
    }

    const nextIntent = scrollIntent + 1;
    setScrollIntent(nextIntent);

    if (nextIntent >= 3) {
      event.preventDefault();
      setWelcomeVisible(true);
    }
  };

  return (
    <>
      <section onWheel={handleCtaWheel} className="bg-[#F7F7F8] px-5 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <div className="rounded-[42px] border border-black/[0.06] bg-white p-8 text-center shadow-[0_34px_100px_rgba(17,17,20,0.10)] sm:p-12 lg:p-16">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#E76912]">Seven Group</p>
              <h2 className="mx-auto mt-5 max-w-4xl text-balance text-5xl font-semibold leading-[0.92] tracking-[-0.065em] text-[#111114] sm:text-7xl">
                Da estratégia ao movimento de mercado.
              </h2>
              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/home', { state: { showChoices: true } })}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#111114] px-6 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(17,17,20,0.20)] transition hover:bg-black"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao ecossistema
                </button>
                <AnchorButton href="#pilares">
                  <Layers3 className="mr-2 h-4 w-4" />
                  Relembrar os pilares
                </AnchorButton>
                <AnchorButton href="#topo">
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Retornar ao topo
                </AnchorButton>
              </div>
            </div>
          </Reveal>
        </div>
        <a
          href="#topo"
          aria-label="Voltar ao topo"
          className="fixed bottom-5 right-5 z-40 hidden h-12 w-12 items-center justify-center rounded-full border border-black/[0.08] bg-white/78 text-[#111114] shadow-[0_18px_44px_rgba(17,17,20,0.16)] backdrop-blur-2xl transition hover:bg-white sm:flex"
        >
          <ArrowUp className="h-4 w-4" />
        </a>
      </section>

      <section
        onWheel={(event) => {
          if (event.deltaY < 0) setWelcomeVisible(false);
        }}
        className={`fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black px-5 text-white transition duration-700 ${welcomeVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!welcomeVisible}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(231,105,18,0.22),transparent_30%),radial-gradient(circle_at_18%_78%,rgba(255,255,255,0.08),transparent_22%)]" />
        <Reveal>
          <div className="relative z-10 rounded-[38px] border border-white/10 bg-white/[0.055] px-8 py-10 text-center shadow-[0_34px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-14 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#FF9B45]">Seven Group</p>
            <h2 className="mt-5 max-w-4xl whitespace-nowrap text-center text-4xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Seja muito bem-vindo
              <br />
              à nossa equipe.
            </h2>
          </div>
        </Reveal>
      </section>
    </>
  );
}
