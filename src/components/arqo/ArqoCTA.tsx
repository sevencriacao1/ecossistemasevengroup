import { ArrowUp, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { arqoAssets } from './arqoContent';

function ArqoCTALinkButton({
  children,
  href,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className = 'inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#171715] transition duration-300 hover:bg-[#E8E6E0]';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function ArqoCTA() {
  const navigate = useNavigate();

  return (
    <section data-arqo-tone="dark" className="relative flex min-h-screen overflow-hidden bg-[#11110f] px-5 py-20 text-white sm:px-8 lg:px-10">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.08)_0%,transparent_26%,transparent_70%,rgba(255,255,255,0.045)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/22 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/58 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-7xl flex-col items-center justify-center text-center">
        <div className="mb-14 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-white/22 to-transparent" />
        <img src={arqoAssets.logoWhite} alt="ARQO" className="mx-auto h-auto w-[min(204px,46vw)] object-contain" />
        <h2 className="arqo-heading mx-auto mt-14 max-w-4xl text-balance text-4xl font-medium leading-[1.06] tracking-[-0.04em] text-white sm:text-6xl">
          Clareza, critério e direção para escolhas de alto valor.
        </h2>

        <div className="mt-14 flex flex-col justify-center gap-3 sm:flex-row">
          <ArqoCTALinkButton onClick={() => navigate('/home', { state: { showChoices: true } })}>
            <Home className="mr-2 h-4 w-4" />
            Voltar ao ecossistema
          </ArqoCTALinkButton>
          <ArqoCTALinkButton href="#topo">
            <ArrowUp className="mr-2 h-4 w-4" />
            Voltar ao topo
          </ArqoCTALinkButton>
        </div>
      </div>
    </section>
  );
}
