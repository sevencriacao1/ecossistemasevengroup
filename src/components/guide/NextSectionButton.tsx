import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface NextSectionButtonProps {
  label: string;
  onClick: () => void;
}

export function NextSectionButton({ label, onClick }: NextSectionButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.04, x: 2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className="fixed bottom-6 right-5 z-[60] inline-flex h-14 items-center justify-center gap-3 rounded-full border border-primary/35 bg-primary/15 px-5 text-primary shadow-[0_0_32px_rgba(223,117,13,0.2)] backdrop-blur-2xl transition hover:bg-primary/20 sm:bottom-8 sm:right-8 sm:px-6"
      aria-label={label}
    >
      <span className="hidden text-sm font-medium uppercase tracking-[0.18em] sm:inline">{label}</span>
      <motion.span
        animate={{ x: [0, 3, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ArrowRight className="h-5 w-5" />
      </motion.span>
    </motion.button>
  );
}
