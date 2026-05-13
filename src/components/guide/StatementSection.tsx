import { motion } from 'framer-motion';

interface StatementSectionProps {
  eyebrow?: string;
  title: string;
  text?: string;
}

export function StatementSection({ eyebrow, title, text }: StatementSectionProps) {
  return (
    <section className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(223,117,13,0.16),transparent_30%),radial-gradient(circle_at_16%_72%,rgba(255,255,255,0.045),transparent_28%),linear-gradient(180deg,#0F0F10_0%,#18181B_48%,#0F0F10_100%)]" />
      <div className="absolute left-[-10rem] top-1/3 h-72 w-[42rem] -rotate-12 bg-primary/10 blur-3xl" />
      <div className="absolute right-10 top-12 hidden h-64 w-64 border border-white/10 lg:block" />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto max-w-5xl"
      >
        {eyebrow && <p className="mb-5 text-sm uppercase tracking-[0.28em] text-primary">{eyebrow}</p>}
        <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">{title}</h2>
        {text && <p className="mt-8 max-w-3xl text-xl leading-9 text-[#D6D6D6]">{text}</p>}
      </motion.div>
    </section>
  );
}
