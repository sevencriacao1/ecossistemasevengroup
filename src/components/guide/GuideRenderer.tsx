import { useNavigate } from 'react-router-dom';
import { Guide } from '../../content/types';
import { useAuth } from '../../contexts/AuthContext';
import { CinematicHero } from './CinematicHero';
import { ClosingSection } from './ClosingSection';
import { MarketPainMap } from './MarketPainMap';
import { ServiceSection } from './ServiceSection';
import { StatementSection } from './StatementSection';

interface GuideRendererProps {
  guide: Guide;
}

export function GuideRenderer({ guide }: GuideRendererProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const continueFromClosing = () => {
    if (guide.id === 'seven') {
      if (profile?.company === 'ARQO') {
        navigate('/guia/arqo');
        return;
      }

      if (profile?.company === 'Nexa') {
        navigate('/guia/nexa');
        return;
      }
    }

    navigate('/home');
  };

  return (
    <div className="bg-background text-text">
      {guide.sections.map((section, index) => {
        const key = `${section.type}-${section.title}-${index}`;

        if (section.type === 'hero') {
          return (
            <CinematicHero
              key={key}
              eyebrow={section.eyebrow}
              title={section.title}
              highlight={section.highlight}
              subtitle={section.subtitle}
            />
          );
        }

        if (section.type === 'pain-map') {
          return (
            <MarketPainMap
              key={key}
              eyebrow={section.eyebrow}
              title={section.title}
              text={section.text}
              pains={section.pains}
            />
          );
        }

        if (section.type === 'transition') {
          return (
            <StatementSection
              key={key}
              title={section.title}
              text={section.text}
            />
          );
        }

        if (section.type === 'service-grid') {
          return (
            <div key={key}>
              {section.services?.map((service) => (
                <ServiceSection key={service.number} service={service} />
              ))}
            </div>
          );
        }

        if (section.type === 'image-feature') {
          return (
            <section key={key} className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(223,117,13,0.16),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.05),transparent_24%),linear-gradient(180deg,#0F0F10_0%,#18181B_48%,#0F0F10_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:80px_80px] opacity-50" />
              <div className="relative z-10 mx-auto max-w-6xl">
                {section.eyebrow && <p className="mb-5 text-sm uppercase tracking-[0.28em] text-primary">{section.eyebrow}</p>}
                <h2 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">{section.title}</h2>
                {section.text && <p className="mt-7 max-w-3xl text-xl leading-9 text-[#D6D6D6]">{section.text}</p>}
                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {section.pillars?.map((pillar) => (
                    <div key={pillar} className="border border-primary/25 bg-primary/10 px-5 py-6 text-lg font-medium text-white backdrop-blur-xl">
                      <span className="mb-5 block h-2 w-2 rounded-full bg-primary" />
                      {pillar}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'closing') {
          return (
            <ClosingSection
              key={key}
              title={section.title}
              text={section.text}
              ctaLabel={section.ctaLabel}
              onContinue={continueFromClosing}
            />
          );
        }

        return (
          <StatementSection
            key={key}
            eyebrow={section.eyebrow}
            title={section.title}
            text={section.text || section.subtitle}
          />
        );
      })}
    </div>
  );
}
