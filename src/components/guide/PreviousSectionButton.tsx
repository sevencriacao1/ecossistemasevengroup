import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface PreviousSectionButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export function PreviousSectionButton({ disabled, onClick }: PreviousSectionButtonProps) {
  if (disabled) return null;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.04, x: -2 }}
      whileTap={{ scale: 0.97 }}
      className="fixed bottom-6 left-5 z-[60] inline-flex h-12 items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.045] px-4 text-white/70 shadow-glass backdrop-blur-2xl transition hover:border-white/20 hover:text-white sm:bottom-8 sm:left-8 sm:px-5"
      aria-label="Voltar seção"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden text-xs font-medium uppercase tracking-[0.18em] sm:inline">Voltar</span>
    </motion.button>
  );
}
