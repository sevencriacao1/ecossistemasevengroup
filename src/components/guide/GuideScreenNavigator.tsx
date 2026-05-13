import { ReactNode, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NextSectionButton } from './NextSectionButton';
import { PreviousSectionButton } from './PreviousSectionButton';
import { SectionProgressIndicator } from './SectionProgressIndicator';

export interface GuideScreen {
  id: string;
  node: ReactNode;
}

interface GuideScreenNavigatorProps {
  screens: GuideScreen[];
  finalLabel: string;
  onFinish: () => void;
}

export function GuideScreenNavigator({ screens, finalLabel, onFinish }: GuideScreenNavigatorProps) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(0);
  const [direction, setDirection] = useState(1);
  const isLast = activeSection === screens.length - 1;

  const goNext = () => {
    setDirection(1);
    if (isLast) {
      onFinish();
      return;
    }
    setActiveSection((current) => Math.min(current + 1, screens.length - 1));
  };

  const goPrevious = () => {
    setDirection(-1);
    setActiveSection((current) => Math.max(current - 1, 0));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ') {
        event.preventDefault();
        goNext();
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        goPrevious();
      }

      if (event.key === 'Escape') {
        navigate('/home');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="relative h-screen overflow-hidden bg-background text-text">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={screens[activeSection]?.id}
          custom={direction}
          initial={{ opacity: 0, y: direction > 0 ? 26 : -22, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: direction > 0 ? -22 : 26, scale: 0.992 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          className="h-screen overflow-y-auto overflow-x-hidden"
        >
          {screens[activeSection]?.node}
        </motion.div>
      </AnimatePresence>

      <PreviousSectionButton disabled={activeSection === 0} onClick={goPrevious} />
      <SectionProgressIndicator activeIndex={activeSection} total={screens.length} />
      <NextSectionButton label={isLast ? finalLabel : 'Avançar'} onClick={goNext} />
    </div>
  );
}
