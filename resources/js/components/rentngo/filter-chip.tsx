import { X } from 'lucide-react';

/** Light grey pill for an active filter, with a small × to remove it. */
export default function FilterChip({
    label,
    onRemove,
}: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <span className="inline-flex h-8 items-center gap-1 rounded-full border bg-card pr-1 pl-3 text-sm font-medium">
            {label}
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove filter: ${label}`}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <X className="size-3.5" />
            </button>
        </span>
    );
}
