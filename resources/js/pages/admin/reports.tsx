import { Head } from '@inertiajs/react';
import {
    CalendarPlus,
    Clock,
    Download,
    Gauge,
    TrendingUp,
    XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Reveal, Stagger } from '@/components/rentngo/motion';
import PageHeader from '@/components/rentngo/page-header';
import SegmentedToggle from '@/components/rentngo/segmented-toggle';
import StatCard from '@/components/rentngo/stat-card';
import { Button } from '@/components/ui/button';
import { ringgit, ringgitShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
    exportMethod as exportCsv,
    index as reportsIndex,
} from '@/routes/admin/reports';

type MonthRevenue = { month: string; label: string; revenue: number };
type TopCar = {
    id: number;
    name: string;
    plate: string;
    bookings: number;
    revenue: number;
};

type ReportsProps = {
    monthlyRevenue: MonthRevenue[];
    topCars: TopCar[];
    utilisation: {
        percent: number;
        bookedDays: number;
        availableDays: number;
        days: number;
    };
    summary: {
        revenueThisMonth: number;
        bookingsThisMonth: number;
        cancellationRate: number;
        averageRentalDays: number;
    };
};

/** Round up to a tidy axis maximum: 1, 2, 2.5 or 5 × a power of ten. */
function niceMax(value: number): number {
    if (value <= 0) {
        return 1000;
    }

    const power = 10 ** Math.floor(Math.log10(value));

    for (const step of [1, 2, 2.5, 5, 10]) {
        if (value <= step * power) {
            return step * power;
        }
    }

    return 10 * power;
}

/** Axis labels: RM 0, RM 500, RM 1,000 … and RM 10K once the axis reaches ten thousand. */
function axisLabel(value: number, axisMax: number): string {
    return axisMax >= 10000
        ? `RM ${value / 1000}K`
        : `RM ${value.toLocaleString('en-MY')}`;
}

export default function Reports({
    monthlyRevenue,
    topCars,
    utilisation,
    summary,
}: ReportsProps) {
    return (
        <>
            <Head title="Reports" />
            <PageHeader
                eyebrow="Insights"
                title="Reports"
                description="Revenue, popular cars and how busy the fleet is."
                actions={
                    <Button variant="outline" asChild>
                        {/* A file download, so a plain link rather than an Inertia visit */}
                        <a href={exportCsv.url()}>
                            <Download />
                            Export bookings (CSV)
                        </a>
                    </Button>
                }
            />

            <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={TrendingUp}
                    label="Revenue this month"
                    value={summary.revenueThisMonth}
                    format={ringgitShort}
                />
                <StatCard
                    icon={CalendarPlus}
                    label="Bookings this month"
                    value={summary.bookingsThisMonth}
                />
                <StatCard
                    icon={XCircle}
                    label="Cancellation rate"
                    value={summary.cancellationRate}
                    format={(value) => `${value.toFixed(1)}%`}
                />
                <StatCard
                    icon={Clock}
                    label="Average rental"
                    value={summary.averageRentalDays}
                    format={(value) => `${value.toFixed(1)} days`}
                />
            </Stagger>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <Reveal inView>
                    <RevenueChart months={monthlyRevenue} />
                </Reveal>
                <div className="grid gap-6">
                    <Reveal inView>
                        <UtilisationCard {...utilisation} />
                    </Reveal>
                    <Reveal inView>
                        <TopCarsCard cars={topCars} />
                    </Reveal>
                </div>
            </div>
        </>
    );
}

/**
 * Paid revenue per month as columns (one series, so no legend: the title names it).
 * Hover or focus a column for its exact value; "Table" shows every number.
 */
function RevenueChart({ months }: { months: MonthRevenue[] }) {
    const [view, setView] = useState<'chart' | 'table'>('chart');
    const [active, setActive] = useState<number | null>(null);

    const max = niceMax(Math.max(...months.map((m) => m.revenue)));
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((share) => share * max);
    const total = months.reduce((sum, m) => sum + m.revenue, 0);
    const latest = months.length - 1;
    const best = months.reduce(
        (bestIndex, m, index) =>
            m.revenue > months[bestIndex].revenue ? index : bestIndex,
        0,
    );

    return (
        <section className="rounded-xl border bg-card p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold">Monthly revenue</h2>
                    <p className="text-sm text-muted-foreground">
                        Paid bookings, last 12 months ·{' '}
                        <span className="font-semibold text-foreground">
                            {ringgit(total)}
                        </span>{' '}
                        in total
                    </p>
                </div>
                <SegmentedToggle
                    label="Show revenue as"
                    value={view}
                    onChange={setView}
                    options={[
                        { value: 'chart', label: 'Chart' },
                        { value: 'table', label: 'Table' },
                    ]}
                />
            </div>

            {view === 'table' ? (
                <table className="mt-5 w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="py-2 font-medium">Month</th>
                            <th className="py-2 text-right font-medium">
                                Revenue
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {months.map((m) => (
                            <tr
                                key={m.month}
                                className="border-b last:border-0"
                            >
                                <td className="py-2">{m.month}</td>
                                <td className="py-2 text-right font-medium tabular-nums">
                                    {ringgit(m.revenue)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="mt-6 flex gap-3">
                    {/* Y axis */}
                    <div className="relative h-60 w-16 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                        {ticks.map((tick) => (
                            <span
                                key={tick}
                                className="absolute right-0"
                                style={{
                                    bottom: `${(tick / max) * 100}%`,
                                    transform: 'translateY(50%)',
                                }}
                            >
                                {axisLabel(tick, max)}
                            </span>
                        ))}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div
                            className="relative h-60"
                            onMouseLeave={() => setActive(null)}
                        >
                            {/* Hairline gridlines */}
                            {ticks.map((tick) => (
                                <div
                                    key={tick}
                                    aria-hidden
                                    className="absolute inset-x-0 h-px bg-border"
                                    style={{ bottom: `${(tick / max) * 100}%` }}
                                />
                            ))}

                            <div className="absolute inset-0 flex items-end gap-0.5">
                                {months.map((m, index) => {
                                    const height = (m.revenue / max) * 100;
                                    const isActive = active === index;
                                    const showLabel =
                                        m.revenue > 0 &&
                                        (index === best || index === latest);

                                    return (
                                        <button
                                            key={m.month}
                                            type="button"
                                            onMouseEnter={() =>
                                                setActive(index)
                                            }
                                            onFocus={() => setActive(index)}
                                            onBlur={() => setActive(null)}
                                            aria-label={`${m.month}: ${ringgit(m.revenue)}`}
                                            className="group relative flex h-full flex-1 items-end justify-center rounded-sm focus-visible:outline-none"
                                        >
                                            {/* Hover band, larger than the column */}
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    'absolute inset-0 rounded-md bg-muted/60 opacity-0 transition-opacity',
                                                    isActive && 'opacity-100',
                                                )}
                                            />
                                            <motion.span
                                                aria-hidden
                                                initial={{ height: 0 }}
                                                whileInView={{
                                                    height: `${height}%`,
                                                }}
                                                viewport={{ once: true }}
                                                transition={{
                                                    duration: 0.6,
                                                    delay: index * 0.03,
                                                    ease: [0.22, 1, 0.36, 1],
                                                }}
                                                className={cn(
                                                    'relative w-full max-w-6 rounded-t-[4px] bg-brand transition-opacity',
                                                    active !== null &&
                                                        !isActive &&
                                                        'opacity-50',
                                                    'group-focus-visible:ring-[3px] group-focus-visible:ring-ring/50',
                                                )}
                                            >
                                                {showLabel && !isActive && (
                                                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap text-foreground tabular-nums">
                                                        {ringgitShort(
                                                            m.revenue,
                                                        )}
                                                    </span>
                                                )}
                                            </motion.span>

                                            {isActive && (
                                                <span
                                                    role="tooltip"
                                                    className="pointer-events-none absolute z-10 rounded-lg border bg-popover px-3 py-2 text-left text-xs whitespace-nowrap shadow-lift"
                                                    style={{
                                                        bottom: `calc(${Math.min(height, 80)}% + 8px)`,
                                                    }}
                                                >
                                                    <span className="block text-muted-foreground">
                                                        {m.month}
                                                    </span>
                                                    <span className="block text-sm font-semibold tabular-nums">
                                                        {ringgit(m.revenue)}
                                                    </span>
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* X axis */}
                        <div className="mt-2 flex gap-0.5 text-[11px] text-muted-foreground">
                            {months.map((m, index) => (
                                <span
                                    key={m.month}
                                    className={cn(
                                        'flex-1 text-center',
                                        index % 2 === 1 && 'max-sm:invisible',
                                    )}
                                >
                                    {m.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

/** Share of car-days rented in the last 30 days, as a meter. */
function UtilisationCard({
    percent,
    bookedDays,
    availableDays,
    days,
}: ReportsProps['utilisation']) {
    return (
        <section className="rounded-xl border bg-card p-5 shadow-soft sm:p-6">
            <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-tint text-tint-foreground">
                    <Gauge className="size-5" />
                </div>
                <div>
                    <h2 className="text-base font-semibold">
                        Fleet utilisation
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Last {days} days
                    </p>
                </div>
            </div>
            <p className="mt-4 text-display font-bold tracking-tight tabular-nums">
                {percent.toFixed(1)}%
            </p>
            <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label="Fleet utilisation"
            >
                <motion.div
                    className="h-full rounded-full bg-brand"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(percent, 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
                {bookedDays.toLocaleString('en-MY')} of{' '}
                {availableDays.toLocaleString('en-MY')} car-days were rented
                (confirmed or completed bookings).
            </p>
        </section>
    );
}

/** The five most booked cars as horizontal bars, count at the bar tip. */
function TopCarsCard({ cars }: { cars: TopCar[] }) {
    const most = Math.max(1, ...cars.map((car) => car.bookings));

    return (
        <section className="rounded-xl border bg-card p-5 shadow-soft sm:p-6">
            <h2 className="text-base font-semibold">Most booked cars</h2>
            <p className="text-sm text-muted-foreground">
                Bookings that weren't cancelled
            </p>
            {cars.length === 0 ? (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    No bookings yet.
                </p>
            ) : (
                <ol className="mt-4 space-y-3.5">
                    {cars.map((car, index) => (
                        <li
                            key={car.id}
                            title={`${car.name}: ${car.bookings} bookings, ${ringgit(car.revenue)}`}
                        >
                            <div className="flex items-baseline justify-between gap-2 text-sm">
                                <span className="min-w-0 truncate font-medium">
                                    {car.name}{' '}
                                    <span className="font-mono text-[11px] text-muted-foreground">
                                        {car.plate}
                                    </span>
                                </span>
                                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                    {ringgitShort(car.revenue)}
                                </span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                                <div className="h-2 flex-1">
                                    <motion.div
                                        className="h-full rounded-r-[4px] bg-brand"
                                        initial={{ width: 0 }}
                                        whileInView={{
                                            width: `${(car.bookings / most) * 100}%`,
                                        }}
                                        viewport={{ once: true }}
                                        transition={{
                                            duration: 0.6,
                                            delay: index * 0.06,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                    />
                                </div>
                                <span className="w-6 text-right text-xs font-semibold tabular-nums">
                                    {car.bookings}
                                </span>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}

Reports.layout = {
    breadcrumbs: [{ title: 'Reports', href: reportsIndex() }],
};
