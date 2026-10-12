import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * The same heading block on every page: optional small eyebrow, bold title,
 * one muted sentence, and the page's main actions on the right.
 */
export default function PageHeader({
    eyebrow,
    title,
    description,
    actions,
    className,
}: {
    eyebrow?: string;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-end justify-between gap-4',
                className,
            )}
        >
            <div className="min-w-0">
                {eyebrow && <p className="mb-1 text-eyebrow">{eyebrow}</p>}
                <h1 className="text-h1">{title}</h1>
                {description && (
                    <p className="mt-1 text-body text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
