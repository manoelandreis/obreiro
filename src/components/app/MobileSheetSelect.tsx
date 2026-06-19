import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Check, ChevronDown } from 'lucide-react';

export interface SheetSelectOption {
  value: string;
  label: string;
  /** Style as primary action (orange) — e.g. "+ Novo modelo" */
  primary?: boolean;
  /** Render a divider above this item */
  dividerBefore?: boolean;
}

interface Props {
  value: string;
  options: SheetSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  title?: string;
  triggerClassName?: string;
}

export function MobileSheetSelect({
  value,
  options,
  onChange,
  disabled,
  placeholder,
  title = 'Selecione uma opção',
  triggerClassName,
}: Props) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Desktop: use the regular shadcn Select
  if (!isMobile) {
    return (
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt, idx) => (
            <div key={opt.value}>
              {opt.dividerBefore && idx > 0 && <div className="my-1 border-t" />}
              <SelectItem
                value={opt.value}
                className={opt.primary ? 'text-primary font-medium' : ''}
              >
                {opt.label}
              </SelectItem>
            </div>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Mobile: trigger + bottom Sheet
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={
          'flex items-center justify-between gap-2 w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-left disabled:opacity-50 disabled:cursor-not-allowed ' +
          (triggerClassName ?? '')
        }
      >
        <span className={selected ? '' : 'text-muted-foreground'}>
          {selected?.label ?? placeholder ?? 'Selecionar'}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 max-h-[90vh] overflow-y-auto"
        >
          <SheetHeader className="px-5 pt-5 pb-3 text-left">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
            <SheetTitle className="text-xl">{title}</SheetTitle>
          </SheetHeader>

          <div className="px-2 pb-6 flex flex-col">
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              return (
                <div key={opt.value}>
                  {opt.dividerBefore && idx > 0 && (
                    <div className="h-px bg-border my-2 mx-3" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onChange(opt.value);
                    }}
                    className={
                      'flex items-center gap-3 w-full h-14 px-4 rounded-lg text-base text-left ' +
                      (isSelected
                        ? 'bg-accent text-accent-foreground font-medium'
                        : opt.primary
                          ? 'text-primary font-medium hover:bg-muted/50 active:bg-muted'
                          : 'hover:bg-muted/50 active:bg-muted')
                    }
                  >
                    {isSelected ? (
                      <Check className="h-5 w-5 shrink-0" />
                    ) : (
                      <span className="w-5 shrink-0" />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
