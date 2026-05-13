import { Guide } from './types';

export const nexaGuide: Guide = {
  id: 'nexa',
  company: 'Nexa',
  title: 'Nexa Gestão e Operação Imobiliária',
  subtitle: 'Uma estrutura institucional voltada a organização, suporte e performance operacional.',
  sections: [
    {
      type: 'hero',
      eyebrow: 'Guia Nexa',
      title: 'Nexa Gestão e Operação Imobiliária',
      subtitle: 'Inserir aqui o posicionamento institucional da Nexa.',
    },
    {
      type: 'statement',
      eyebrow: 'Atuação',
      title: 'Como a Nexa atua',
      text: 'Inserir aqui a explicação sobre a atuação da Nexa junto a parceiros, corretores e imobiliárias.',
    },
    {
      type: 'image-feature',
      eyebrow: 'Assessoria operacional',
      title: 'Processo, suporte e acompanhamento',
      text: 'Este bloco será substituído pelo conteúdo oficial do onboarding.',
      pillars: ['Suporte', 'Processo', 'Acompanhamento', 'Organização', 'Performance'],
    },
    {
      type: 'statement',
      eyebrow: 'Relacionamento',
      title: 'Relacionamento com parceiros',
      text: 'Adicionar aqui os princípios de relacionamento com parceiros.',
    },
    {
      type: 'statement',
      eyebrow: 'Institucional',
      title: 'Comunicação institucional',
      text: 'Inserir aqui os padrões de comunicação e posicionamento.',
    },
    {
      type: 'closing',
      title: 'Próximos passos',
      text: 'Este bloco será substituído pelo conteúdo oficial do onboarding.',
      ctaLabel: 'Voltar para início',
    },
  ],
};
