import { FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CollapsibleSection } from '@/components/app/CollapsibleSection';

interface NotesSectionProps {
  notes: string;
  onNotesChange: (value: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

export function NotesSection({ notes, onNotesChange, expanded, onToggle }: NotesSectionProps) {
  return (
    <CollapsibleSection
      icon={FileText}
      title="Notas / Termos e Condições"
      open={expanded}
      onToggle={onToggle}
    >
      <div className="space-y-2">
        <Label htmlFor="quote-notes">Notas ou termos</Label>
        <Textarea
          id="quote-notes"
          rows={4}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Condições de pagamento, prazos, garantia..."
        />
      </div>
    </CollapsibleSection>
  );
}
