import { Company } from '../contexts/AuthContext';

export type GuideSectionType =
  | 'hero'
  | 'statement'
  | 'pain-map'
  | 'service'
  | 'service-grid'
  | 'image-feature'
  | 'quote'
  | 'transition'
  | 'company-branch'
  | 'closing';

export interface ServiceItem {
  number: string;
  title: string;
  highlight: string;
  description: string;
  bullets: string[];
  image?: string;
  variant?: 'left-text' | 'center-card' | 'split-image' | 'full-bleed' | 'glass-panel' | 'architectural-map';
}

export interface GuideSection {
  type: GuideSectionType;
  eyebrow?: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  text?: string;
  image?: string;
  pains?: string[];
  services?: ServiceItem[];
  service?: ServiceItem;
  pillars?: string[];
  quote?: string;
  ctaLabel?: string;
}

export interface Guide {
  id: 'seven' | 'arqo' | 'nexa';
  company: Company;
  title: string;
  subtitle: string;
  sections: GuideSection[];
}
