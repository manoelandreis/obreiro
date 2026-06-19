import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function SectionHeader({ icon: Icon, title, description }: Props) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent/10 text-accent shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="font-heading text-xl font-bold text-foreground tracking-tight">
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground pl-[42px]">{description}</p>
      )}
    </div>
  );
}
