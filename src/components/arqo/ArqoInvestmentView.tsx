import { ArqoSection, ArqoTitle, StableTextReveal } from './ArqoPrimitives';
import { investmentWords } from './arqoContent';

export function ArqoInvestmentView() {
  return (
    <ArqoSection className="bg-[#EFEEE8]">
      <div className="grid gap-14 lg:grid-cols-[0.44fr_0.56fr]">
        <ArqoTitle
          eyebrow="Como Enxergamos o Investimento"
          title="Cada cliente possui um momento diferente."
          subtitle="Por isso, não trabalhamos no volume. Não mostramos tudo. Mostramos o que faz sentido."
        />

        <div>
          <div className="space-y-3">
            {investmentWords.map((word) => (
              <StableTextReveal
                key={word}
                text={word}
                as="p"
                className="arqo-heading text-5xl font-medium leading-[0.98] tracking-[-0.06em] text-[#171715] sm:text-6xl lg:text-7xl"
              />
            ))}
          </div>
          <p className="mt-10 max-w-2xl text-lg leading-8 text-[#625F57]">
            Nosso objetivo não é vender rápido. É construir decisões seguras, inteligentes e sustentáveis.
          </p>
        </div>
      </div>
    </ArqoSection>
  );
}
