import * as React from "react";

import { cn } from "@/lib/utils";

export interface EyebrowPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Ícone de 12px à esquerda do texto. */
  icon?: React.ReactNode;
}

/**
 * Eyebrow Pill (Tone=White) — pílula branca com texto em maiúsculas,
 * usada acima de títulos sobre fundos fotográficos (ex.: hero da landing).
 */
const EyebrowPill = React.forwardRef<HTMLSpanElement, EyebrowPillProps>(
  ({ className, icon, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-6 items-center gap-2 rounded-full bg-card px-2 py-1 text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-success-soft-foreground",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  ),
);
EyebrowPill.displayName = "EyebrowPill";

export { EyebrowPill };
