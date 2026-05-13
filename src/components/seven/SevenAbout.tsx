import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { expertise } from './sevenContent';
import { IconBadge, Reveal, SectionHeader } from './SevenPrimitives';

function ExpertiseFlipCard({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="group h-[190px] [perspective:1200px]">
      <motion.div
        className="relative h-full rounded-[30px] [transform-style:preserve-3d]"
        whileHover={{ rotateY: 180 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0 rounded-[30px] border border-black/[0.06] bg-white/76 p-6 shadow-[0_24px_70px_rgba(17,17,20,0.08)] backdrop-blur-2xl [backface-visibility:hidden]">
          <IconBadge icon={Icon} />
          <h3 className="mt-7 text-lg font-semibold leading-tight tracking-[-0.025em] text-[#111114]">
            {title}
          </h3>
        </div>
        <div className="absolute inset-0 flex flex-col justify-between rounded-[30px] bg-[#E76912] p-6 text-white shadow-[0_28px_80px_rgba(231,105,18,0.28)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-xl font-semibold leading-tight tracking-[-0.035em] text-white">{title}</h3>
        </div>
      </motion.div>
    </div>
  );
}

export function SevenAbout() {
  return (
    <section id="quem-somos" className="bg-[#F7F7F8] px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Quem é a Seven Group"
          title="Inteligência, percepção de valor e execução no mesmo ecossistema."
          description="A Seven atua desde a concepção do empreendimento até sua performance comercial, integrando as frentes que fazem um produto imobiliário ganhar mercado."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {expertise.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.03}>
              <ExpertiseFlipCard icon={item.icon} title={item.title} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
