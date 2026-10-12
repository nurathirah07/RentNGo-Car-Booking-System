import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { ActivePill } from '@/components/rentngo/motion';
import { cn } from '@/lib/utils';

export type ChoiceOption = {
    value: string;
    label: string;
    icon?: LucideIcon;
    disabled?: boolean;
};

/**
 * A group of pill buttons where one is chosen (like the "Available Times" grid):
 * light grey chips, the chosen one dark. Used for pickup time, location and
 * payment method. Behaves as a radio group for keyboards and screen readers.
 * The dark highlight slides from the old choice to the new one.
 */
export default function ChoiceChips({
    options,
    value,
    onChange,
    label,
    className,
}: {
    options: ChoiceOption[];
    value: string;
    onChange: (value: string) => void;
    /** Read out by screen readers, e.g. "Pickup time" */
    label: string;
    className?: string;
}) {
    // Own id per group, so several chip groups on one page don't share a highlight.
    const pillId = useId();

    return (
        <div
            role="radiogroup"
            aria-label={label}
            className={cn('grid grid-cols-4 gap-2', className)}
        >
            {options.map((option) => {
                const isChosen = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isChosen}
                        disabled={option.disabled}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'relative isolate flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium tabular-nums',
                            'transition-[background-color,color,transform,box-shadow] duration-150 active:scale-95',
                            'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                            'disabled:cursor-not-allowed disabled:line-through disabled:opacity-40',
                            isChosen
                                ? 'bg-muted text-background'
                                : 'bg-muted text-foreground hover:bg-primary-hover hover:text-primary-foreground',
                        )}
                    >
                        {isChosen && (
                            <ActivePill
                                layoutId={`chip-${pillId}`}
                                className="rounded-lg bg-foreground shadow-soft"
                            />
                        )}
                        {option.icon && (
                            <option.icon className="size-4 shrink-0" />
                        )}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
