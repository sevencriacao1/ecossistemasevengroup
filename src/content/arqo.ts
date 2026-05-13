import { Guide } from './types';

export const arqoGuide: Guide = {
  id: 'arqo',
  company: 'ARQO',
  title: 'ARQO Inteligência Imobiliária',
  subtitle: 'Operação comercial e imobiliária com foco em clareza, relacionamento e performance.',
  sections: [
    {
      type: 'hero',
      eyebrow: 'Guia ARQO',
      title: 'ARQO Inteligência Imobiliária',
      subtitle: 'Inserir aqui o posicionamento institucional da ARQO.',
    },
    {
      type: 'statement',
      eyebrow: 'Atuação',
      title: 'Como a ARQO atua',
      text: 'Inserir aqui a explicação sobre a atuação comercial da ARQO.',
    },
    {
      type: 'image-feature',
      eyebrow: 'Cultura comercial',
      title: 'Pilares que sustentam a operação',
      text: 'Este bloco será substituído pelo conteúdo oficial do onboarding.',
      pillars: ['Atendimento', 'Relacionamento', 'Velocidade', 'Clareza', 'Performance'],
    },
    {
      type: 'statement',
      eyebrow: 'Rotina',
      title: 'Rotina operacional',
      text: 'Adicionar aqui os principais rituais, processos e rotinas da operação.',
    },
    {
      type: 'statement',
      eyebrow: 'Postura',
      title: 'Comunicação e postura',
      text: 'Inserir aqui os padrões de comunicação, postura e relacionamento esperados.',
    },
    {
      type: 'closing',
      title: 'Próximos passos',
      text: 'Este bloco será substituído pelo conteúdo oficial do onboarding.',
      ctaLabel: 'Voltar para início',
    },
  ],
};
