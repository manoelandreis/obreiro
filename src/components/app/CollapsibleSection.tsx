import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CollapsibleSectionProps {
  icon: LucideIcon;
  title: string;
  summary?: React.ReactNode;
  open?: boolean;
  onToggle?: () => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  icon: Icon,
  title,
  summary,
  open: controlledOpen,
  onToggle,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  return (
    <Card>
      <button type="button" onClick={handleToggle} className="w-full text-left">
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-5 w-5" />
            <span>{title}</span>
            {summary && <span className="ml-2 text-sm font-normal text-muted-foreground truncate">{summary}</span>}
          </CardTitle>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardHeader>
      </button>
      {isOpen && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}
