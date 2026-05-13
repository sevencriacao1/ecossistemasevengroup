import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface ClosingSectionProps {
  title: string;
  text?: string;
  ctaLabel?: string;
  onContinue: () => void;
}

export function ClosingSection({ title, text, ctaLabel = 'Continuar', onContinue }: ClosingSectionProps) {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-5 py-24 sm:px-8 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(223,117,13,0.24),transparent_34%),radial-gradient(circle_at_12%_82%,rgba(255,255,255,0.055),transparent_26%),linear-gradient(180deg,#0F0F10_0%,#18181B_50%,#0F0F10_100%)]" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto max-w-5xl text-center"
      >
        <p className="mb-6 text-sm uppercase tracking-[0.3em] text-primary">Encerramento</p>
        <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">{title}</h2>
        {text && <p className="mx-auto mt-8 max-w-3xl text-xl leading-9 text-[#D6D6D6]">{text}</p>}
        <Button onClick={onContinue} size="lg" className="mt-10 rounded-none">
          {ctaLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </section>
  );
}
