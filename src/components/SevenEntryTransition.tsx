import { motion } from 'framer-motion';

export function SevenEntryTransition() {
  const particles = Array.from({ length: 18 }, (_, index) => index);

  return (
    <main className="fixed inset-0 z-[100] overflow-hidden bg-background text-text">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(223,117,13,0.18),transparent_26%),radial-gradient(circle_at_18%_78%,rgba(255,255,255,0.05),transparent_22%),linear-gradient(145deg,#0F0F10_0%,#18181B_48%,#0F0F10_100%)]" />
      <motion.div
        initial={{ opacity: 0.2, scale: 0.96 }}
        animate={{ opacity: [0.2, 0.55, 0.28], scale: [0.96, 1.04, 1] }}
        transition={{ duration: 3.2, ease: 'easeInOut' }}
        className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15 shadow-[0_0_90px_rgba(223,117,13,0.18)]"
      />
      <motion.div
        initial={{ opacity: 0, rotate: -8 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:86px_86px] [mask-image:radial-gradient(ellipse_at_center,#000_0%,transparent_70%)]"
      />
      <motion.div
        initial={{ opacity: 0, x: '-12%' }}
        animate={{ opacity: 0.75, x: '12%' }}
        transition={{ duration: 3.4, ease: 'easeInOut' }}
        className="absolute left-[-15%] top-[18%] h-px w-[130%] bg-gradient-to-r from-transparent via-primary/45 to-transparent"
      />
      <motion.div
        initial={{ opacity: 0, x: '10%' }}
        animate={{ opacity: 0.35, x: '-8%' }}
        transition={{ duration: 3.4, ease: 'easeInOut' }}
        className="absolute bottom-[22%] left-[-10%] h-px w-[120%] bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      {particles.map((particle) => (
        <motion.span
          key={particle}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: [0, 0.75, 0], y: [-4, -28, -54] }}
          transition={{
            duration: 2.4 + (particle % 5) * 0.2,
            delay: 0.2 + particle * 0.045,
            ease: 'easeInOut',
          }}
          className="absolute h-1 w-1 rounded-full bg-primary/70 shadow-[0_0_14px_rgba(223,117,13,0.75)]"
          style={{
            left: `${12 + ((particle * 43) % 78)}%`,
            top: `${20 + ((particle * 29) % 60)}%`,
          }}
        />
      ))}

      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-6 text-xs font-medium uppercase tracking-[0.38em] text-primary"
          >
            Seven Group
          </motion.p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            Uma entrada guiada no Ecossistema Seven.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#D6D6D6]">
            Sua jornada foi personalizada para mostrar a estrutura institucional do grupo e os guias liberados para sua empresa.
          </p>
        </motion.div>
      </section>
    </main>
  );
}
