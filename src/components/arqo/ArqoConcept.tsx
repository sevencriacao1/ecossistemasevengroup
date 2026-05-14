import { useEffect, useRef, useState } from 'react';
import { gsap, scheduleScrollTriggerRefresh, useGSAP } from '../../lib/gsap';
import { StableTextReveal } from './ArqoPrimitives';
import { arqoAssets } from './arqoContent';

const arqBullets = ['Estrutura', 'Lógica', 'Planejamento', 'Visão'];
const oBullets = ['O alvo', 'O ponto de chegada', 'A decisão certa'];
const finalPhrase = 'A arquitetura organiza espaços. A ARQO organiza decisões.';

export function ArqoConcept() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(query.matches);

    update();
    query.addEventListener('change', update);

    return () => query.removeEventListener('change', update);
  }, []);

  return isDesktop ? <ArqoConceptDesktop /> : <ArqoConceptMobile />;
}

function ArqoConceptDesktop() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const arqCardRef = useRef<HTMLElement | null>(null);
  const oCardRef = useRef<HTMLElement | null>(null);
  const connectorRef = useRef<SVGSVGElement | null>(null);
  const branchConnectorRef = useRef<SVGSVGElement | null>(null);
  const logoCardRef = useRef<HTMLDivElement | null>(null);
  const finalPhraseRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const arqCard = arqCardRef.current;
      const oCard = oCardRef.current;
      const connector = connectorRef.current;
      const branchConnector = branchConnectorRef.current;
      const logoCard = logoCardRef.current;
      const finalText = finalPhraseRef.current;

      if (!section || !arqCard || !oCard || !connector || !branchConnector || !logoCard || !finalText) return;

      let timeline: gsap.core.Timeline | undefined;
      let firstFrame = 0;
      let secondFrame = 0;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const arqBulletsNodes = gsap.utils.toArray<HTMLElement>(arqCard.querySelectorAll('[data-concept-bullet]'));
      const oBulletsNodes = gsap.utils.toArray<HTMLElement>(oCard.querySelectorAll('[data-concept-bullet]'));
      const finalChars = gsap.utils.toArray<HTMLElement>(finalText.querySelectorAll('[data-final-char]'));
      const branchPath = branchConnector.querySelector<SVGPathElement>('[data-logo-connector]');

      if (reduceMotion) {
        gsap.set([arqCard, oCard, connector, branchConnector, logoCard, finalText, arqBulletsNodes, oBulletsNodes, finalChars], {
          autoAlpha: 1,
          clearProps: 'transform',
        });
        if (branchPath) {
          gsap.set(branchPath, { strokeDashoffset: 0 });
        }
        return;
      }

      gsap.set(arqCard, { autoAlpha: 0, x: '50%', y: 80, scale: 0.96 });
      gsap.set(arqBulletsNodes, { autoAlpha: 0, y: 16 });
      gsap.set(oCard, { autoAlpha: 0, x: '-50%', y: 80, scale: 0.96 });
      gsap.set(oBulletsNodes, { autoAlpha: 0, y: 16 });
      gsap.set(connector, { autoAlpha: 0, scaleX: 0, transformOrigin: '0% 50%' });
      gsap.set(branchConnector, { autoAlpha: 0 });
      if (branchPath) {
        gsap.set(branchPath, { strokeDashoffset: 72 });
      }
      gsap.set(logoCard, { autoAlpha: 0, y: 24, scale: 0.96 });
      gsap.set(finalText, { autoAlpha: 0, y: 24 });
      gsap.set(finalChars, { color: 'rgba(22,22,21,0.22)' });

      const createTimeline = () => {
        timeline = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: section,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: '+=2200',
            anticipatePin: 1,
            invalidateOnRefresh: true,
            refreshPriority: 0,
          },
        });

        timeline
          .to(arqCard, { autoAlpha: 1, y: 0, scale: 1, duration: 0.16 }, 0.08)
          .to(arqBulletsNodes, { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.18 }, 0.24)
          .to(arqCard, { x: 0, y: 0, scale: 0.96, duration: 0.18 }, 0.44)
          .to(oCard, { autoAlpha: 1, y: 0, scale: 1, duration: 0.16 }, 0.58)
          .to(oCard, { x: 0, y: 0, scale: 0.96, duration: 0.18 }, 0.7)
          .to(oBulletsNodes, { autoAlpha: 1, y: 0, stagger: 0.04, duration: 0.16 }, 0.82)
          .to(connector, { autoAlpha: 1, scaleX: 1, duration: 0.1, ease: 'power1.out' }, 0.9)
          .to(branchConnector, { autoAlpha: 1, duration: 0.04 }, 0.92)
          .to(branchPath, { strokeDashoffset: 0, duration: 0.16, ease: 'none' }, 0.92)
          .to(logoCard, { autoAlpha: 1, y: 0, scale: 1, duration: 0.12 }, 0.96)
          .to(finalText, { autoAlpha: 1, y: 0, duration: 0.04 }, 0.975)
          .to(finalChars, { color: 'rgba(22,22,21,1)', stagger: 0.006, duration: 0.14, ease: 'none' }, 0.985);

        scheduleScrollTriggerRefresh();
      };

      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(createTimeline);
      });

      return () => {
        cancelAnimationFrame(firstFrame);
        cancelAnimationFrame(secondFrame);
        timeline?.scrollTrigger?.kill();
        timeline?.kill();
      };
    },
    { scope: sectionRef }
  );

  return (
    <>
      <section id="conceito" ref={sectionRef} className="relative h-screen min-h-screen overflow-hidden bg-white text-[#171715]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(22,22,21,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(22,22,21,0.024)_1px,transparent_1px)] bg-[size:64px_64px] opacity-70" />

      <div className="relative z-10 mx-auto flex h-screen max-w-[94rem] flex-col items-center justify-center overflow-hidden px-10">
        <div className="absolute left-1/2 top-[12vh] w-full max-w-4xl -translate-x-1/2 px-8 text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.36em] text-[#7B786E]">O Conceito da ARQO</p>
          <StableTextReveal
            text="Arquitetura aplicada à decisão."
            as="h2"
            className="arqo-heading text-balance text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-[#161615] xl:text-5xl"
          />
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[#6D6A62]">
            A ARQO nasce da união entre arquitetura e direção estratégica.
          </p>
        </div>

        <div className="relative mt-[8vh] grid h-[47vh] max-h-[25rem] min-h-[20rem] w-full grid-cols-[minmax(0,1fr)_clamp(7rem,12vw,12rem)_minmax(0,1fr)] items-center gap-8 xl:gap-12">
          <ConceptCard
            ref={arqCardRef}
            title="ARQ"
            eyebrow="A estrutura"
            bullets={arqBullets}
            body="A arquitetura deixa de ser apenas construção física. Ela vira método para organizar uma escolha."
            className="col-start-1 z-20 w-full justify-self-end"
          />

          <svg
            ref={connectorRef}
            className="pointer-events-none absolute left-[18%] right-[18%] top-1/2 z-10 h-8 -translate-y-1/2 overflow-visible text-[#8F8778]"
            viewBox="0 0 1000 16"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              className="arqo-dash-flow"
              x1="0"
              y1="8"
              x2="1000"
              y2="8"
              stroke="currentColor"
              strokeWidth="0.55"
              strokeLinecap="round"
              strokeDasharray="7 12"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <ConceptCard
            ref={oCardRef}
            title="O"
            eyebrow="O alvo"
            bullets={oBullets}
            body="O destino não é o imóvel em si. É a clareza de saber por que ele faz sentido."
            orbit
            className="col-start-3 z-20 w-full justify-self-start"
          />
        </div>

        <svg
          ref={branchConnectorRef}
          className="pointer-events-none absolute left-1/2 top-[58vh] z-10 h-[18vh] w-[25vw] -translate-x-1/2 overflow-visible text-[#8F8778]"
          viewBox="0 0 320 180"
          fill="none"
          aria-hidden="true"
        >
          <path
            data-logo-connector
            className="arqo-dash-flow"
            d="M320 0 L320 58 L160 58 L160 180"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 11"
          />
        </svg>

        <div
          ref={logoCardRef}
          className="absolute bottom-[12vh] left-1/2 z-20 flex w-[min(26.6rem,33.6vw)] -translate-x-1/2 items-center justify-center border border-black/[0.065] bg-[#F8F7F3]/88 px-8 py-6 shadow-[0_24px_70px_rgba(34,33,29,0.045)] backdrop-blur-xl"
        >
          <img src={arqoAssets.logo} alt="ARQO" className="h-auto w-full object-contain" loading="lazy" decoding="async" />
        </div>

        <div
          ref={finalPhraseRef}
          className="absolute bottom-[4vh] left-1/2 z-20 w-full max-w-5xl -translate-x-1/2 px-8 text-center"
        >
          <p className="arqo-heading text-balance text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-[#171715] xl:text-3xl">
            {finalPhrase.split(' ').map((word, wordIndex, words) => (
              <span key={`${word}-${wordIndex}`} className="inline-block whitespace-nowrap">
                {Array.from(word).map((char, charIndex) => (
                  <span key={`${word}-${charIndex}`} data-final-char className="inline">
                    {char}
                  </span>
                ))}
                {wordIndex < words.length - 1 && <span aria-hidden="true">&nbsp;</span>}
              </span>
            ))}
          </p>
        </div>
      </div>
      </section>
      <div aria-hidden="true" className="h-40 bg-white xl:h-12" />
    </>
  );
}

function ArqoConceptMobile() {
  return (
    <section id="conceito" className="relative overflow-x-hidden bg-white px-5 py-28 text-[#171715] sm:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.36em] text-[#7B786E]">O Conceito da ARQO</p>
        <StableTextReveal
          text="Arquitetura aplicada à decisão."
          as="h2"
          className="arqo-heading text-balance text-4xl font-medium leading-[1.02] tracking-[-0.045em] text-[#161615] sm:text-5xl"
        />
        <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-[#6D6A62] sm:text-lg">
          A ARQO nasce da união entre arquitetura e direção estratégica.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-xl gap-8">
        <ConceptCard
          title="ARQ"
          eyebrow="A estrutura"
          bullets={arqBullets}
          body="A arquitetura deixa de ser apenas construção física. Ela vira método para organizar uma escolha."
        />
        <div className="mx-auto h-24 w-px border-l border-dashed border-[#8F8778]" />
        <ConceptCard
          title="O"
          eyebrow="O alvo"
          bullets={oBullets}
          body="O destino não é o imóvel em si. É a clareza de saber por que ele faz sentido."
          orbit
        />
      </div>

      <p className="arqo-heading mx-auto mt-14 max-w-4xl text-center text-balance text-3xl font-medium leading-[1.08] tracking-[-0.035em] text-[#171715] sm:text-5xl">
        {finalPhrase}
      </p>
    </section>
  );
}

function ConceptCard({
  title,
  eyebrow,
  bullets,
  body,
  orbit = false,
  className,
  ref,
}: {
  title: string;
  eyebrow: string;
  bullets: string[];
  body: string;
  orbit?: boolean;
  className?: string;
  ref?: React.Ref<HTMLElement>;
}) {
  return (
    <article
      ref={ref}
      className={[
        'relative overflow-hidden border border-black/[0.065] bg-[#F8F7F3]/94 p-7 shadow-[0_24px_70px_rgba(34,33,29,0.045)] backdrop-blur-xl sm:p-9',
        'lg:h-[min(40vh,24rem)] lg:min-h-[20rem]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(22,22,21,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(22,22,21,0.034)_1px,transparent_1px)] bg-[size:42px_42px] opacity-70" />
      {orbit && (
        <div className="pointer-events-none absolute right-[-5rem] top-[-5rem] h-64 w-64 rounded-full border border-black/[0.08]">
          <div className="absolute inset-10 rounded-full border border-black/[0.06]" />
          <div className="absolute inset-20 rounded-full border border-black/[0.045]" />
        </div>
      )}
      <div className="relative z-10">
        <p className="arqo-heading text-7xl font-medium leading-none tracking-[-0.055em] text-[#171715] sm:text-8xl lg:text-[clamp(5rem,7vw,8rem)]">
          {title}
        </p>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#817D73]">{eyebrow}</p>
        <div className="mt-6 grid gap-3 text-base font-medium text-[#4E4B45]">
          {bullets.map((bullet) => (
            <span key={bullet} data-concept-bullet className="flex items-center gap-3 border-t border-black/[0.07] pt-3">
              <span className="h-1 w-1 rounded-full bg-[#8F8778]" />
              {bullet}
            </span>
          ))}
        </div>
        <p className="mt-7 max-w-md text-base leading-8 text-[#625F57] lg:text-[15px] lg:leading-7 xl:text-base xl:leading-8">{body}</p>
      </div>
    </article>
  );
}
