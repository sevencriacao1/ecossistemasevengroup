import { ArqoSection, ArqoReveal, StableTextReveal } from './ArqoPrimitives';

export function ArqoStrategicConcept() {
  return (
    <ArqoSection className="bg-white">
      <div className="mx-auto max-w-5xl text-center">
        <ArqoReveal>
          <p className="mb-7 text-xs font-semibold uppercase tracking-[0.32em] text-[#7B786E]">Conceito Estratégico</p>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-[#625F57]">
            A ARQO traduz o produto em percepção. Ela constrói a forma como o cliente enxerga, sente e valoriza o empreendimento.
          </p>
        </ArqoReveal>

        <StableTextReveal
          text="A ARQO defende apenas um produto: a decisão inteligente."
          as="p"
          className="arqo-heading mt-12 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.045em] text-[#171715] sm:text-5xl lg:text-7xl"
        />
      </div>
    </ArqoSection>
  );
}
