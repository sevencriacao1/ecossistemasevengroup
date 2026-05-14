import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArqoSection } from './ArqoPrimitives';

export function ArqoEmotionalClose() {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 78%', 'end 24%'] });
  const lineScale = useTransform(scrollYProgress, [0.08, 0.72], [0.12, 1]);
  const statementY = useTransform(scrollYProgress, [0, 0.68], [reduceMotion ? 0 : 26, reduceMotion ? 0 : -10]);
  const paragraphY = useTransform(scrollYProgress, [0.12, 0.78], [reduceMotion ? 0 : 18, 0]);
  const paragraphOpacity = useTransform(scrollYProgress, [0.16, 0.58], [0.42, 1]);

  return (
    <ArqoSection className="bg-[#F8F7F3] py-20 lg:py-24">
      <div ref={ref} className="relative overflow-hidden border-y border-black/[0.07] py-16 lg:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/12 to-transparent" />
        <div className="grid gap-12 lg:grid-cols-[0.42fr_0.58fr] lg:items-end">
          <div>
            <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#7B786E]">Decisão</p>
            <h2 className="arqo-heading max-w-xl text-balance text-4xl font-medium leading-[1.03] tracking-[-0.045em] text-[#171715] sm:text-6xl">
              Escolher bem também é patrimônio.
            </h2>
          </div>

          <motion.div style={{ y: statementY }} className="relative">
            <div className="mb-10 h-px w-full origin-left overflow-hidden bg-black/[0.08]">
              <motion.div style={{ scaleX: lineScale }} className="h-full origin-left bg-[#171715]" />
            </div>
            <p className="arqo-heading text-balance text-4xl font-medium leading-[1.03] tracking-[-0.045em] text-[#171715] sm:text-6xl">
              Não é sobre vender imóveis.
              <span className="block text-[#8A8479]">É sobre acertar na escolha.</span>
            </p>
            <motion.p
              style={{ opacity: paragraphOpacity, y: paragraphY }}
              className="mt-8 max-w-3xl text-lg leading-8 text-[#625F57]"
            >
              Uma decisão imobiliária não impacta apenas o presente. Ela organiza futuro, segurança, liquidez, tranquilidade e percepção de valor.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </ArqoSection>
  );
}
