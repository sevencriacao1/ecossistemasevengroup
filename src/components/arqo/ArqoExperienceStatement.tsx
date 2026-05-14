import { ArqoSection, StableTextReveal } from './ArqoPrimitives';

const lines = [
  'Não se trata de apresentar mais.',
  'Se trata de apresentar melhor.',
  'Cada atendimento é estruturado para que o cliente sinta segurança antes da decisão.',
  'A ARQO existe para transformar escolhas imobiliárias em decisões inteligentes.',
];

export function ArqoExperienceStatement() {
  return (
    <ArqoSection className="bg-[#F8F7F3]">
      <div className="mx-auto max-w-5xl">
        <p className="mb-10 text-xs font-semibold uppercase tracking-[0.32em] text-[#7B786E]">Experiência ARQO</p>
        <div className="space-y-8">
          {lines.map((line) => (
            <StableTextReveal
              key={line}
              text={line}
              as="p"
              className="arqo-heading text-balance text-3xl font-medium leading-[1.12] tracking-[-0.04em] text-[#171715] sm:text-5xl"
            />
          ))}
        </div>
      </div>
    </ArqoSection>
  );
}
