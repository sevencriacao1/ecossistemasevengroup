import { arqoGuide } from './arqo';
import { nexaGuide } from './nexa';
import { sevenGuide } from './seven';

export const guides = {
  seven: sevenGuide,
  arqo: arqoGuide,
  nexa: nexaGuide,
};

export type GuideId = keyof typeof guides;
