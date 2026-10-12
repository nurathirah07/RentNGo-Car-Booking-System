import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Grey placeholders shaped like the real content, shown while new results load
 * (instead of blank space or a frozen old list).
 */

/** Same shape as VehicleCard. */
export function CarCardSkeleton() {
    return (
        <div
            className="flex flex-col rounded-xl border bg-card p-4 shadow-soft"
            aria-hidden
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                </div>
                <Skeleton className="size-9 rounded-md" />
            </div>
            <Skeleton className="my-3 h-[150px] rounded-lg" />
            <div className="flex items-end justify-between">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24" />
            </div>
        </div>
    );
}

/** A grid of car card skeletons; `count` matches what usually fits on screen. */
export function CarGridSkeleton({
    count = 6,
    className,
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'grid gap-5 sm:grid-cols-2 xl:grid-cols-3',
                className,
            )}
            role="status"
            aria-label="Loading cars"
        >
            {Array.from({ length: count }, (_, index) => (
                <CarCardSkeleton key={index} />
            ))}
        </div>
    );
}

/** Placeholder rows inside a TableCard <tbody>. */
export function TableRowsSkeleton({
    columns,
    rows = 6,
}: {
    columns: number;
    rows?: number;
}) {
    return (
        <>
            {Array.from({ length: rows }, (_, row) => (
                <tr key={row} className="border-b last:border-0" aria-hidden>
                    {Array.from({ length: columns }, (_, column) => (
                        <td key={column} className="h-14 px-4 py-3">
                            <Skeleton
                                className={cn(
                                    'h-4',
                                    column === 0 ? 'w-36' : 'w-20',
                                )}
                            />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

/** Placeholder for the stacked cards admin tables turn into on phones. */
export function MobileCardsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid gap-3" role="status" aria-label="Loading">
            {Array.from({ length: count }, (_, index) => (
                <div
                    key={index}
                    className="space-y-3 rounded-xl border bg-card p-4 shadow-soft"
                    aria-hidden
                >
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-2/5" />
                </div>
            ))}
        </div>
    );
}
