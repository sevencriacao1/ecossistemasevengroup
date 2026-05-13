import { MapPinned } from 'lucide-react';
import { addresses, metrics } from './sevenContent';
import { IconBadge, PremiumCard, Reveal, SectionHeader } from './SevenPrimitives';

function splitAddress(address: string) {
  const [city, ...rest] = address.split(' - ');
  return {
    city: city.toUpperCase(),
    address: rest.join(' - '),
  };
}

export function SevenMetrics() {
  return (
    <section id="estrutura" className="bg-[#F7F7F8] px-5 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Estrutura nacional"
          title="Presença em mais de 30 cidades e 9 estados brasileiros."
          description="A Seven atua no Sul, Sudeste, Centro-Oeste e Nordeste, com operação física em Dourados/MS e Santa Maria/RS."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric, index) => (
            <Reveal key={metric.label} delay={index * 0.04}>
              <PremiumCard className="min-h-[168px]">
                <p className="text-4xl font-semibold tracking-[-0.06em] text-[#111114] sm:text-5xl">{metric.value}</p>
                <p className="mt-4 text-sm font-medium uppercase tracking-[0.18em] text-[#74747C]">{metric.label}</p>
              </PremiumCard>
            </Reveal>
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {addresses.map((item) => {
            const address = splitAddress(item);

            return (
              <Reveal key={item}>
                <PremiumCard className="flex items-start gap-4">
                  <IconBadge icon={MapPinned} className="shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E76912]">Unidade física</p>
                    <h3 className="mt-2 text-xl font-semibold uppercase tracking-[-0.02em] text-[#111114]">{address.city}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#666670]">{address.address}</p>
                  </div>
                </PremiumCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
