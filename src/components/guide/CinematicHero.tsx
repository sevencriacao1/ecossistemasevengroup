import { motion } from 'framer-motion';

interface CinematicHeroProps {
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
}

export function CinematicHero({ eyebrow, title, highlight, subtitle }: CinematicHeroProps) {
  return (
    <section className="relative flex min-h-screen items-end overflow-hidden px-5 pb-20 pt-28 sm:px-8 lg:px-12 lg:pb-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(223,117,13,0.24),transparent_30%),radial-gradient(circle_at_75%_18%,rgba(255,255,255,0.06),transparent_24%),linear-gradient(135deg,#0F0F10_0%,#18181B_46%,#0F0F10_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:92px_92px] opacity-60 [mask-image:radial-gradient(ellipse_at_35%_42%,#000_0%,transparent_70%)]" />
      <div className="absolute right-[-20rem] top-[-18rem] h-[48rem] w-[48rem] rounded-full border border-primary/15" />
      <div className="absolute right-[-11rem] top-[-8rem] h-[32rem] w-[32rem] rounded-full border border-white/10" />
      <div className="absolute right-[-8rem] top-0 h-[120%] w-80 rotate-12 bg-primary/20 blur-3xl" />
      <div className="absolute left-0 top-20 h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto w-full max-w-7xl"
      >
        {eyebrow && (
          <p className="mb-6 text-sm font-medium uppercase tracking-[0.34em] text-primary">{eyebrow}</p>
        )}
        <h1 className="max-w-6xl text-5xl font-semibold leading-[0.96] tracking-tight text-white sm:text-7xl lg:text-8xl">
          {title}
        </h1>
        {highlight && (
          <p className="mt-8 max-w-4xl text-2xl font-medium leading-tight text-primary sm:text-4xl">
            {highlight}
          </p>
        )}
        {subtitle && (
          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#D6D6D6] sm:text-xl">
            {subtitle}
          </p>
        )}
      </motion.div>
    </section>
  );
}
