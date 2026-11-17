import { Head, Link } from '@inertiajs/react';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import EmptyState from '@/components/rentngo/empty-state';
import PageHeader from '@/components/rentngo/page-header';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { calendar } from '@/routes/admin';
import { index as bookingsIndex } from '@/routes/admin/bookings';
import type { BookingStatus } from '@/types';

type CalendarBooking = {
    id: number;
    ref: string;
    customer: string;
    status: BookingStatus;
    pickup: string;
    return: string;
    /** Column where the bar starts (0 = first day shown). */
    offset: number;
    /** Number of day columns the bar covers. */
    span: number;
};

type CalendarVehicle = {
    id: number;
    name: string;
    plate: string;
    status: 'available' | 'maintenance' | 'inactive';
    bookings: CalendarBooking[];
};

type Day = { date: string; weekday: string; day: string; month: string };

type FleetCalendarProps = {
    vehicles: CalendarVehicle[];
    days: Day[];
    start: string;
    previous: string;
    next: string;
    today: string;
};

/** Bar colours per booking status; the legend below names each one. */
const barStyles: Record<string, string> = {
    pending: 'bg-warning-tint text-warning border-warning/30 border-dashed',
    confirmed: 'bg-brand text-white border-transparent',
    completed: 'bg-muted text-muted-foreground border-border',
};

const legend: { status: BookingStatus; label: string }[] = [
    { status: 'pending', label: 'Pending' },
    { status: 'confirmed', label: 'Confirmed' },
    { status: 'completed', label: 'Completed' },
];

/**
 * The whole fleet on one screen: a row per car, a column per day, and each
 * booking as a bar. Spot free gaps and clashes at a glance; ← → move a week.
 */
export default function FleetCalendar({
    vehicles,
    days,
    previous,
    next,
    today,
}: FleetCalendarProps) {
    const columns = `repeat(${days.length}, minmax(44px, 1fr))`;
    const range = `${days[0].day} ${days[0].month} – ${days[days.length - 1].day} ${days[days.length - 1].month}`;

    return (
        <>
            <Head title="Fleet calendar" />
            <PageHeader
                eyebrow="Operations"
                title="Fleet calendar"
                description="Every car's bookings over the next two weeks."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" asChild>
                            <Link
                                href={calendar({ query: { start: previous } })}
                                preserveScroll
                                aria-label="Previous week"
                            >
                                <ChevronLeft />
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={calendar()} preserveScroll>
                                Today
                            </Link>
                        </Button>
                        <Button variant="outline" size="icon" asChild>
                            <Link
                                href={calendar({ query: { start: next } })}
                                preserveScroll
                                aria-label="Next week"
                            >
                                <ChevronRight />
                            </Link>
                        </Button>
                    </div>
                }
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold">{range}</p>
                <ul className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {legend.map((item) => (
                        <li
                            key={item.status}
                            className="flex items-center gap-1.5"
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    'h-3 w-5 rounded-[4px] border',
                                    barStyles[item.status],
                                )}
                            />
                            {item.label}
                        </li>
                    ))}
                </ul>
            </div>

            {vehicles.length === 0 ? (
                <EmptyState
                    className="mt-4"
                    icon={CalendarRange}
                    title="No cars in service"
                    description="Add a vehicle to see its bookings here."
                />
            ) : (
                <div className="mt-3 overflow-x-auto rounded-xl border bg-card shadow-soft">
                    <div className="min-w-max">
                        {/* Day header */}
                        <div className="sticky top-0 z-10 flex border-b bg-card">
                            <div className="sticky left-0 z-10 w-48 shrink-0 border-r bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
                                Car
                            </div>
                            <div
                                className="grid flex-1"
                                style={{ gridTemplateColumns: columns }}
                            >
                                {days.map((day) => {
                                    const isToday = day.date === today;
                                    const isWeekend =
                                        day.weekday === 'Sat' ||
                                        day.weekday === 'Sun';

                                    return (
                                        <div
                                            key={day.date}
                                            className={cn(
                                                'py-2 text-center text-[11px]',
                                                isWeekend && 'bg-muted/40',
                                            )}
                                        >
                                            <div className="text-muted-foreground">
                                                {day.weekday}
                                            </div>
                                            <div
                                                className={cn(
                                                    'mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                                                    isToday &&
                                                        'bg-brand text-white',
                                                )}
                                            >
                                                {day.day}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* One row per car */}
                        {vehicles.map((vehicle, rowIndex) => (
                            <div
                                key={vehicle.id}
                                className="flex border-b last:border-0"
                            >
                                <div className="sticky left-0 z-[5] w-48 shrink-0 border-r bg-card px-4 py-2.5">
                                    <div className="truncate text-sm font-semibold">
                                        {vehicle.name}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                        <span className="font-mono">
                                            {vehicle.plate}
                                        </span>
                                        {vehicle.status === 'maintenance' && (
                                            <span className="rounded-full bg-muted px-1.5">
                                                Maintenance
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div
                                    className="relative grid flex-1"
                                    style={{ gridTemplateColumns: columns }}
                                >
                                    {/* Day cells (background) */}
                                    {days.map((day) => (
                                        <div
                                            key={day.date}
                                            aria-hidden
                                            className={cn(
                                                'border-r border-border/50 last:border-0',
                                                (day.weekday === 'Sat' ||
                                                    day.weekday === 'Sun') &&
                                                    'bg-muted/40',
                                                day.date === today &&
                                                    'bg-tint/50',
                                                vehicle.status ===
                                                    'maintenance' &&
                                                    'bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,var(--color-muted)_6px,var(--color-muted)_8px)]',
                                            )}
                                            style={{ gridRow: 1 }}
                                        />
                                    ))}

                                    {/* Booking bars, on the same grid row as the cells */}
                                    {vehicle.bookings.map((booking) => (
                                        <Tooltip key={booking.id}>
                                            <TooltipTrigger asChild>
                                                <motion.div
                                                    initial={{
                                                        opacity: 0,
                                                        scaleX: 0.6,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        scaleX: 1,
                                                    }}
                                                    transition={{
                                                        duration: 0.35,
                                                        delay: rowIndex * 0.02,
                                                    }}
                                                    style={{
                                                        gridRow: 1,
                                                        gridColumn: `${booking.offset + 1} / span ${booking.span}`,
                                                        originX: 0,
                                                    }}
                                                    className="z-[1] my-2 self-center px-0.5"
                                                >
                                                    <Link
                                                        href={bookingsIndex({
                                                            query: {
                                                                search: booking.ref,
                                                            },
                                                        })}
                                                        className={cn(
                                                            'flex h-8 items-center overflow-hidden rounded-[4px] border px-2 text-[11px] font-semibold transition-[filter] hover:brightness-95 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                                                            barStyles[
                                                                booking.status
                                                            ],
                                                        )}
                                                        aria-label={`${booking.ref}, ${booking.customer}, ${booking.pickup} to ${booking.return}, ${booking.status}`}
                                                    >
                                                        <span className="truncate">
                                                            {booking.span >= 2
                                                                ? booking.customer
                                                                : ''}
                                                        </span>
                                                    </Link>
                                                </motion.div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="font-semibold">
                                                    {booking.ref} ·{' '}
                                                    {booking.customer}
                                                </p>
                                                <p className="capitalize">
                                                    {booking.pickup} →{' '}
                                                    {booking.return} ·{' '}
                                                    {booking.status}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

FleetCalendar.layout = {
    breadcrumbs: [{ title: 'Fleet calendar', href: calendar() }],
};
