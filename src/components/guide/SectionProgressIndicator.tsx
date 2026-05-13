interface SectionProgressIndicatorProps {
  activeIndex: number;
  total: number;
}

export function SectionProgressIndicator({ activeIndex, total }: SectionProgressIndicatorProps) {
  return (
    <div className="fixed bottom-7 left-1/2 z-[60] hidden -translate-x-1/2 items-center gap-4 text-xs uppercase tracking-[0.22em] text-white/50 sm:flex">
      <span>[{String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}]</span>
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === activeIndex ? 'w-8 bg-primary shadow-[0_0_14px_rgba(223,117,13,0.7)]' : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
