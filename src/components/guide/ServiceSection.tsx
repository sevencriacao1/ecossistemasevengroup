import { motion } from 'framer-motion';
import { ServiceItem } from '../../content/types';
import { cn } from '../../lib/utils';

interface ServiceSectionProps {
  service: ServiceItem;
}

export function ServiceSection({ service }: ServiceSectionProps) {
  const isFull = service.variant === 'full-bleed' || service.variant === 'architectural-map';

  return (
    <section className="relative min-h-screen overflow-hidden px-5 py-24 sm:px-8 lg:px-12 lg:py-28">
      <div className={cn(
        'absolute inset-0',
        isFull
          ? 'bg-[radial-gradient(circle_at_70%_24%,rgba(223,117,13,0.22),transparent_30%),linear-gradient(120deg,#0F0F10_0%,#202024_48%,#0F0F10_100%)]'
          : 'bg-[radial-gradient(circle_at_16%_30%,rgba(223,117,13,0.18),transparent_30%),linear-gradient(120deg,#0F0F10_0%,#18181B_52%,#0F0F10_100%)]'
      )} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:88px_88px] opacity-50 [mask-image:linear-gradient(90deg,#000_0%,transparent_82%)]" />
      <div className="absolute bottom-[-12rem] right-[-8rem] h-[34rem] w-[34rem] rounded-full border border-primary/15" />
      <div className="absolute bottom-[8rem] right-[10rem] hidden h-48 w-48 border border-white/10 lg:block" />
      <div className="absolute -right-24 top-12 h-[70%] w-52 rotate-12 bg-primary/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'relative z-10 mx-auto grid min-h-[70vh] max-w-7xl items-center gap-10',
          service.variant === 'split-image' ? 'lg:grid-cols-[0.9fr_1.1fr]' : 'lg:grid-cols-[1.05fr_0.95fr]'
        )}
      >
        <div className={cn(
          'max-w-2xl',
          service.variant === 'center-card' && 'lg:mx-auto lg:text-center',
          service.variant === 'glass-panel' && 'border border-white/10 bg-white/[0.08] p-8 shadow-premium backdrop-blur-2xl sm:p-10'
        )}>
          <p className="mb-5 text-4xl font-light tracking-tight text-white/80">[{service.number}]</p>
          <h2 className="text-5xl font-semibold uppercase leading-[0.95] tracking-tight text-white sm:text-7xl">
            {service.title.replace(service.highlight, '')}
            <span className="block text-primary">{service.highlight}</span>
          </h2>
          <div className={cn('my-8 h-1 w-24 bg-primary', service.variant === 'center-card' && 'lg:mx-auto')} />
          <p className="text-xl leading-8 text-[#D6D6D6]">{service.description}</p>
        </div>

        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid gap-4"
        >
          {service.bullets.map((bullet) => (
            <motion.li
              key={bullet}
              variants={{
                hidden: { opacity: 0, x: 18 },
                show: { opacity: 1, x: 0, transition: { duration: 0.5 } },
              }}
              className="flex items-center gap-3 border border-white/15 bg-black/20 px-5 py-4 text-lg text-white shadow-glass backdrop-blur-xl"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_14px_rgba(223,117,13,0.9)]" />
              {bullet}
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}
