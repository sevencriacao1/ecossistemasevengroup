import { motion } from 'framer-motion';

interface MarketPainMapProps {
  eyebrow?: string;
  title: string;
  text?: string;
  pains?: string[];
}

const positions = [
  'left-[8%] top-[18%]',
  'left-[38%] top-[7%]',
  'right-[6%] top-[22%]',
  'left-[10%] bottom-[17%]',
  'right-[7%] bottom-[20%]',
  'left-1/2 bottom-[7%] -translate-x-1/2',
];

export function MarketPainMap({ eyebrow, title, text, pains = [] }: MarketPainMapProps) {
  return (
    <section className="relative min-h-screen overflow-hidden px-5 py-24 sm:px-8 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(223,117,13,0.18),transparent_28%),linear-gradient(180deg,#0F0F10_0%,#18181B_50%,#0F0F10_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60" />
      <div className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10" />
      <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent shadow-[0_0_22px_rgba(223,117,13,0.8)] lg:block" />
      <div className="absolute left-1/2 top-[10%] hidden h-[80%] w-px bg-gradient-to-b from-transparent via-primary/70 to-transparent lg:block" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center"
      >
        <div className="max-w-3xl text-center">
          {eyebrow && <p className="mb-5 text-sm uppercase tracking-[0.28em] text-text-muted">{eyebrow}</p>}
          {text && <p className="mx-auto mb-8 max-w-2xl text-lg font-medium leading-8 text-white">{text}</p>}
          <h2 className="text-6xl font-black uppercase leading-[0.9] tracking-tight text-primary sm:text-8xl lg:text-9xl">
            {title}
          </h2>
        </div>

        <div className="absolute inset-0 hidden lg:block">
          {pains.map((pain, index) => (
            <motion.div
              key={pain}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + index * 0.08, duration: 0.65 }}
              className={`absolute ${positions[index]} max-w-[260px] border border-white/15 bg-white/[0.08] px-6 py-4 text-center text-xl text-primary shadow-glass backdrop-blur-xl`}
            >
              {pain}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto grid max-w-3xl gap-3 lg:hidden">
        {pains.map((pain) => (
          <div key={pain} className="border border-primary/25 bg-primary/10 px-4 py-3 text-primary backdrop-blur-xl">
            {pain}
          </div>
        ))}
      </div>
    </section>
  );
}
