import { ArqoCard, ArqoIconBadge, ArqoSection, ArqoTitle } from './ArqoPrimitives';
import { deliverables } from './arqoContent';

export function ArqoDeliverables() {
  return (
    <ArqoSection className="bg-white">
      <ArqoTitle
        eyebrow="O Que a ARQO Entrega"
        title="Estrutura, percepção e direção."
        subtitle="Entregas estratégicas para transformar excesso de opções em clareza decisória."
        align="center"
      />

      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {deliverables.map((item) => (
          <ArqoCard key={item.title} className="min-h-[190px]">
            <ArqoIconBadge icon={item.icon} />
            <h3 className="arqo-heading mt-10 text-xl font-medium leading-tight tracking-[-0.025em] text-[#171715]">{item.title}</h3>
          </ArqoCard>
        ))}
      </div>
    </ArqoSection>
  );
}
