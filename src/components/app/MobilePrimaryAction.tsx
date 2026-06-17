import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Plus, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  icon?: LucideIcon;
  to?: string;
  onClick?: () => void;
  /** Render a custom inline trigger (e.g. a DialogTrigger wrapping a Button). When provided, `to` / `onClick` are ignored for the inline button. */
  children?: ReactNode;
  /** Called by the floating action button. Falls back to onClick if not provided. */
  onFloatingClick?: () => void;
  className?: string;
}

/**
 * Primary action that is:
 * - Full width on mobile, inline (auto width) on md+.
 * - Sticks to the bottom of the viewport as a floating action button on mobile
 *   when the inline version scrolls out of view.
 */
export function MobilePrimaryAction({
  label,
  icon: Icon = Plus,
  to,
  onClick,
  children,
  onFloatingClick,
  className,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowFab(!entry.isIntersecting),
      { rootMargin: '0px 0px -8px 0px', threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const inlineButton = children ?? (
    to ? (
      <Button asChild className="gap-2 w-full md:w-auto">
        <Link to={to}>
          <Icon className="h-4 w-4" /> {label}
        </Link>
      </Button>
    ) : (
      <Button className="gap-2 w-full md:w-auto" onClick={onClick}>
        <Icon className="h-4 w-4" /> {label}
      </Button>
    )
  );

  const handleFab = () => {
    if (onFloatingClick) return onFloatingClick();
    if (onClick) return onClick();
  };

  const fab =
    to && !onFloatingClick ? (
      <Button
        asChild
        size="lg"
        className="h-16 w-full rounded-2xl px-6 gap-3 text-base shadow-xl shadow-primary/30"
      >
        <Link to={to} aria-label={label}>
          <Icon className="h-5 w-5" /> {label}
        </Link>
      </Button>
    ) : (
      <Button
        size="lg"
        onClick={handleFab}
        aria-label={label}
        className="h-16 w-full rounded-2xl px-6 gap-3 text-base shadow-xl shadow-primary/30"
      >
        <Icon className="h-5 w-5" /> {label}
      </Button>
    );

  return (
    <>
      <div ref={sentinelRef} className={cn('w-full md:w-auto', className)}>
        {inlineButton}
      </div>

      {/* Floating action — mobile only, appears after inline scrolls off-screen */}
      <div
        className={cn(
          'md:hidden fixed left-0 right-0 bottom-0 z-40 pointer-events-none',
          'px-4 pb-[max(env(safe-area-inset-bottom),1rem)]',
          'transition-all duration-200',
          showFab ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        )}
      >
        <div className="pointer-events-auto w-full">{fab}</div>
      </div>
    </>
  );
}
