import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ethics, manifesto } from './sevenContent';
import { Reveal } from './SevenPrimitives';

export function SevenMindset() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end center'] });
  const quoteOpacity = useTransform(scrollYProgress, [0, 0.45, 1], [0.45, 1, 0.72]);

  return (
    <section ref={ref} className="bg-white px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div style={{ opacity: quoteOpacity }} className="lg:sticky lg:top-28 lg:h-fit">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#E76912]">Nossa mentalidade</p>
          <h2 className="mt-5 text-balance text-5xl font-semibold leading-[0.95] tracking-[-0.06em] text-[#111114] sm:text-6xl">
            Alta performance é regra, não exceção.
          </h2>
        </motion.div>
        <div className="space-y-5">
          <Reveal>
            <p className="text-2xl font-medium leading-snug tracking-[-0.035em] text-[#252529]">
              Resultados verdadeiros só existem quando são construídos com confiança, seriedade e responsabilidade.
            </p>
          </Reveal>
          <div className="grid gap-3 sm:grid-cols-2">
            {ethics.map((item) => (
              <Reveal key={item}>
                <div className="rounded-2xl border border-black/[0.06] bg-[#F7F7F8] px-5 py-4 text-sm font-semibold text-[#333338]">
                  {item}
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <blockquote className="rounded-[32px] border border-black/[0.06] bg-[#111114] p-8 text-justify text-2xl font-medium leading-snug tracking-[-0.035em] text-white shadow-[0_26px_80px_rgba(17,17,20,0.18)] [text-align-last:left]">
              “{manifesto}”
              <span className="mt-6 block text-sm font-normal leading-7 text-white/62">
                Porque, no longo prazo, o mercado sempre reconhece quem trabalha com seriedade.
              </span>
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
