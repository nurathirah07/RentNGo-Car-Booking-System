import { useId } from 'react';
import { ActivePill } from '@/components/rentngo/motion';
import { cn } from '@/lib/utils';

type Option<T extends string> = {
    value: T;
    label: string;
};

/**
 * Two (or more) joined buttons where one is selected, e.g. "All cars | Available on my dates".
 * The selected segment is pale blue; its highlight slides when the choice changes.
 */
export default function SegmentedToggle<T extends string>({
    options,
    value,
    onChange,
    label,
    className,
}: {
    options: Option<T>[];
    value: T;
    onChange: (value: T) => void;
    /** Read out by screen readers, e.g. "Which cars to show" */
    label: string;
    className?: string;
}) {
    // Each toggle needs its own id, or two toggles on a page would share one highlight.
    const pillId = useId();

    return (
        <div
            role="group"
            aria-label={label}
            className={cn(
                'inline-flex shrink-0 rounded-md border bg-card p-1',
                className,
            )}
        >
            {options.map((option) => {
                const isActive = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'relative isolate h-8 rounded-sm px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-150',
                            'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                            isActive
                                ? 'text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {isActive && (
                            <ActivePill
                                layoutId={`segment-${pillId}`}
                                className="rounded-sm bg-primary shadow-xs ring-1 ring-primary-border"
                            />
                        )}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
