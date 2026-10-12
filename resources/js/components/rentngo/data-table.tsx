import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Clean admin tables: white rounded card, no vertical lines, light grey
 * header text, 56px rows that tint softly on hover.
 * `loading` dims the rows while the next page of results is on its way.
 */
export function TableCard({
    children,
    loading = false,
    className,
}: {
    children: ReactNode;
    loading?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border bg-card shadow-soft',
                className,
            )}
        >
            <div
                className={cn(
                    'overflow-x-auto transition-opacity duration-200',
                    loading && 'pointer-events-none opacity-55',
                )}
                aria-busy={loading}
            >
                <table className="w-full text-left text-sm">{children}</table>
            </div>
        </div>
    );
}

export function THead({ children }: { children: ReactNode }) {
    return (
        <thead className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground">
            <tr>{children}</tr>
        </thead>
    );
}

export function Th({ className, ...props }: ComponentProps<'th'>) {
    return (
        <th
            scope="col"
            className={cn(
                'h-11 px-4 font-semibold whitespace-nowrap',
                className,
            )}
            {...props}
        />
    );
}

export function Tr({ className, ...props }: ComponentProps<'tr'>) {
    return (
        <tr
            className={cn(
                'border-b transition-colors duration-150 last:border-0 hover:bg-muted/40',
                className,
            )}
            {...props}
        />
    );
}

export function Td({ className, ...props }: ComponentProps<'td'>) {
    return <td className={cn('h-14 px-4 py-3', className)} {...props} />;
}

/** One full-width row for "nothing found" messages. */
export function EmptyRow({
    colSpan,
    children,
}: {
    colSpan: number;
    children: ReactNode;
}) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="px-4 py-14 text-center text-sm text-muted-foreground"
            >
                {children}
            </td>
        </tr>
    );
}

/**
 * Phone layout for admin tables: each row becomes a small card.
 * Use next to a TableCard: <TableCard className="hidden md:block"> + <MobileCards className="md:hidden">.
 */
export function MobileCards({
    children,
    loading = false,
    className,
}: {
    children: ReactNode;
    loading?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'grid gap-3 transition-opacity duration-200',
                loading && 'pointer-events-none opacity-55',
                className,
            )}
            aria-busy={loading}
        >
            {children}
        </div>
    );
}

export function MobileCard({
    title,
    subtitle,
    badge,
    children,
    actions,
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    badge?: ReactNode;
    /** Label/value rows, see MobileField */
    children?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <article className="rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="truncate font-semibold">{title}</div>
                    {subtitle && (
                        <div className="text-caption text-muted-foreground">
                            {subtitle}
                        </div>
                    )}
                </div>
                {badge}
            </div>
            {children && (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                    {children}
                </dl>
            )}
            {actions && (
                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t pt-3">
                    {actions}
                </div>
            )}
        </article>
    );
}

export function MobileField({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="min-w-0">
            <dt className="text-caption text-muted-foreground">{label}</dt>
            <dd className="truncate text-sm font-medium">{children}</dd>
        </div>
    );
}
