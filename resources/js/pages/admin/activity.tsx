import { Head, router } from '@inertiajs/react';
import {
    Car,
    CalendarDays,
    CircleDollarSign,
    History,
    Star,
    UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Pagination from '@/components/pagination';
import EmptyState from '@/components/rentngo/empty-state';
import { Stagger } from '@/components/rentngo/motion';
import PageHeader from '@/components/rentngo/page-header';
import SegmentedToggle from '@/components/rentngo/segmented-toggle';
import { cn } from '@/lib/utils';
import { activity } from '@/routes/admin';
import type { Paginated } from '@/types';

type LogEntry = {
    id: number;
    action: string;
    description: string;
    actor: string;
    actor_role: 'admin' | 'customer' | null;
    time: string | null;
    ago: string | null;
};

type ActivityProps = {
    logs: Paginated<LogEntry>;
    filters: { area: string };
    areas: string[];
};

const areaIcons: Record<string, LucideIcon> = {
    booking: CalendarDays,
    payment: CircleDollarSign,
    vehicle: Car,
    customer: UserRound,
    review: Star,
};

const areaLabels: Record<string, string> = {
    booking: 'Bookings',
    payment: 'Payments',
    vehicle: 'Vehicles',
    customer: 'Customers',
    review: 'Reviews',
};

/**
 * The audit trail: every booking, payment, car, customer and review change,
 * newest first, with who did it ("System" for the scheduler and online payments).
 */
export default function ActivityLog({ logs, filters, areas }: ActivityProps) {
    function showArea(area: string) {
        router.get(
            activity.url({ query: area ? { area } : {} }),
            {},
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <>
            <Head title="Activity log" />
            <PageHeader
                eyebrow="Audit"
                title="Activity log"
                description="Who changed what, and when."
            />

            <SegmentedToggle
                className="mt-6 max-w-full overflow-x-auto"
                label="Show activity for"
                value={filters.area || 'all'}
                onChange={(value) => showArea(value === 'all' ? '' : value)}
                options={[
                    { value: 'all', label: 'All' },
                    ...areas.map((area) => ({
                        value: area,
                        label: areaLabels[area] ?? area,
                    })),
                ]}
            />

            {logs.data.length === 0 ? (
                <EmptyState
                    className="mt-4"
                    icon={History}
                    title="Nothing logged yet"
                    description="Changes to bookings, payments, cars and customers will appear here."
                />
            ) : (
                <div className="mt-4 rounded-xl border bg-card p-2 shadow-soft sm:p-3">
                    <Stagger
                        key={`${filters.area}-${logs.current_page}`}
                        gap={0.025}
                    >
                        {logs.data.map((log) => {
                            const area = log.action.split('.')[0];
                            const Icon = areaIcons[area] ?? History;

                            return (
                                <article
                                    key={log.id}
                                    className="relative flex gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50 sm:px-3"
                                >
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-tint text-tint-foreground">
                                        <Icon className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm">
                                            {log.description}
                                        </p>
                                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                                            <span
                                                className={cn(
                                                    'font-semibold',
                                                    log.actor_role ===
                                                        'admin' &&
                                                        'text-tint-foreground',
                                                )}
                                            >
                                                {log.actor}
                                            </span>
                                            <span aria-hidden>·</span>
                                            <time title={log.time ?? undefined}>
                                                {log.ago}
                                            </time>
                                            <span className="rounded-full bg-muted px-2 py-px font-mono text-[10px]">
                                                {log.action}
                                            </span>
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </Stagger>
                </div>
            )}

            <div className="mt-4">
                <Pagination paginator={logs} />
            </div>
        </>
    );
}

ActivityLog.layout = {
    breadcrumbs: [{ title: 'Activity log', href: activity() }],
};
