import { Navigate } from 'react-router-dom';
import { GuideRenderer } from '../components/guide/GuideRenderer';
import { GuideNavigation } from '../components/guide/GuideNavigation';
import { GuideId, guides } from '../content/guides';

interface GuidePageProps {
  guideId: GuideId;
}

export function GuidePage({ guideId }: GuidePageProps) {
  const guide = guides[guideId];

  if (!guide) {
    return <Navigate to="/home" replace />;
  }

  const screenCount = guide.sections.reduce((total, section) => {
    if (section.type === 'service-grid') return total + (section.services?.length || 0);
    return total + 1;
  }, 0);

  return (
    <>
      <GuideNavigation title={guide.title} sectionCount={screenCount} />
      <GuideRenderer guide={guide} />
    </>
  );
}
