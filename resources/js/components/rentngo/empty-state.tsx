import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * "Nothing here" message: a line icon in a light circle, a short title,
 * one helpful sentence and (optionally) one blue button passed as `action`.
 */
export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center rounded-xl border bg-card px-6 py-14 text-center shadow-soft',
                className,
            )}
        >
            <div className="flex size-14 items-center justify-center rounded-full bg-tint text-tint-foreground">
                <Icon className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{title}</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {description}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
