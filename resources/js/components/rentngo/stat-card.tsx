import type { LucideIcon } from 'lucide-react';
import AnimatedNumber from '@/components/rentngo/animated-number';
import { cn } from '@/lib/utils';

/**
 * Dashboard number tile: light-blue icon at the top left, a big bold value,
 * a muted label and an optional small trend/note in green, red or grey.
 * Numbers count up when the card first appears; pass `format` for money etc.
 */
export default function StatCard({
    icon: Icon,
    label,
    value,
    note,
    noteTone = 'muted',
    format,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
    format?: (value: number) => string;
    note?: string;
    noteTone?: 'up' | 'down' | 'muted';
}) {
    return (
        <div className="card-hover rounded-xl border bg-card p-5 shadow-soft">
            <div className="flex size-10 items-center justify-center rounded-md bg-tint text-tint-foreground">
                <Icon className="size-5" />
            </div>
            <div className="mt-4 text-2xl font-bold tracking-tight">
                <AnimatedNumber value={value} format={format} countUp />
            </div>
            <div className="text-sm text-muted-foreground">{label}</div>
            {note && (
                <div
                    className={cn(
                        'mt-2 text-xs font-medium',
                        noteTone === 'up' && 'text-success',
                        noteTone === 'down' && 'text-danger',
                        noteTone === 'muted' && 'text-muted-foreground',
                    )}
                >
                    {note}
                </div>
            )}
        </div>
    );
}
