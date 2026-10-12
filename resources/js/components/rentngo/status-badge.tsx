import { cn } from '@/lib/utils';

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'grey';

const tones: Record<Tone, string> = {
    blue: 'bg-tint text-tint-foreground',
    green: 'bg-success-tint text-success',
    amber: 'bg-warning-tint text-warning',
    red: 'bg-danger-tint text-danger',
    grey: 'bg-muted text-muted-foreground',
};

/** One colour per status, for vehicles, bookings, payments and customers. */
const statusTones: Record<string, Tone> = {
    // vehicles
    available: 'green',
    maintenance: 'amber',
    inactive: 'grey',
    // bookings
    pending: 'amber',
    confirmed: 'blue',
    completed: 'green',
    cancelled: 'grey',
    // payments
    paid: 'green',
    refunded: 'grey',
    // customers
    active: 'green',
    blocked: 'red',
};

/** Soft tinted pill with a tiny dot, e.g. "• Confirmed". */
export default function StatusBadge({
    status,
    className,
}: {
    status: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap capitalize',
                tones[statusTones[status] ?? 'grey'],
                className,
            )}
        >
            <span className="size-1.5 rounded-full bg-current" aria-hidden />
            {status}
        </span>
    );
}

/** Small rounded tag for vehicle cards, e.g. "Automatic", "Popular". */
export function Tag({
    tone = 'blue',
    children,
    className,
}: {
    tone?: Tone;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
                tones[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}
