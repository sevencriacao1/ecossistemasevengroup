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

  return (
    <>
      <GuideNavigation title={guide.title} sectionCount={guide.sections.length} />
      <GuideRenderer guide={guide} />
    </>
  );
}
