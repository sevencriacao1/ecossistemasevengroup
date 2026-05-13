import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

interface BranchCardProps {
  eyebrow: string;
  title: string;
  description: string;
  onClick: () => void;
}

export function BranchCard({ eyebrow, title, description, onClick }: BranchCardProps) {
  return (
    <motion.button
      type="button"
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
      }}
      whileHover={{ y: -6 }}
      onClick={onClick}
      className="group min-h-[280px] overflow-hidden border border-white/10 bg-white/[0.045] p-7 text-left shadow-glass backdrop-blur-2xl transition hover:border-primary/45 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-6">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 text-text-muted transition group-hover:border-primary/40 group-hover:text-primary">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <h3 className="mt-20 text-4xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-5 text-base leading-7 text-text-muted">{description}</p>
    </motion.button>
  );
}
