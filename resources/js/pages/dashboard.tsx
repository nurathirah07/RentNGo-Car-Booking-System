import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarCheck,
    CalendarClock,
    CalendarDays,
    CircleAlert,
    Flag,
    MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import BookingController from '@/actions/App/Http/Controllers/BookingController';
import CarController from '@/actions/App/Http/Controllers/CarController';
import { Stagger } from '@/components/rentngo/motion';
import CarImage from '@/components/rentngo/car-image';
import EmptyState from '@/components/rentngo/empty-state';
import StatCard from '@/components/rentngo/stat-card';
import StatusBadge from '@/components/rentngo/status-badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { edit as profileEdit } from '@/routes/profile';
import type { BookingStatus } from '@/types';

type UpcomingBooking = {
    id: number;
    ref: string;
    vehicle: string;
    image_url: string | null;
    pickup: string;
    pickup_time: string | null;
    return: string;
    pickup_location: string;
    status: BookingStatus;
};

type DashboardProps = {
    stats: { upcoming: number; completed: number; total: number };
    upcomingBookings: UpcomingBooking[];
    profileComplete: boolean;
};

/** "Good morning" / "Good afternoon" / "Good evening" from the visitor's clock. */
function greeting(): string {
    const hour = new Date().getHours();

    return hour < 12
        ? 'Good morning'
        : hour < 18
          ? 'Good afternoon'
          : 'Good evening';
}

export default function Dashboard({
    stats,
    upcomingBookings,
    profileComplete,
}: DashboardProps) {
    const { auth } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];
    const [nextTrip, ...laterTrips] = upcomingBookings;

    return (
        <>
            <Head title="Dashboard" />

            {/* Greeting banner */}
            <section className="relative overflow-hidden rounded-2xl border bg-hero-gradient p-6 shadow-soft sm:p-8">
                <div className="relative z-10 max-w-xl">
                    <p className="text-sm font-semibold text-tint-foreground">
                        {greeting()}, {firstName}
                    </p>
                    <h1 className="mt-1 text-h1">
                        Where are you{' '}
                        <span className="text-brand-gradient">driving</span>{' '}
                        next?
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Pick your dates and we&apos;ll show you every car
                        that&apos;s free.
                    </p>
                    <Button asChild className="mt-5">
                        <Link href={CarController.index()}>
                            Browse cars
                            <ArrowRight />
                        </Link>
                    </Button>
                </div>
                {/* Decorative soft glows */}
                <div
                    className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-brand/10 blur-3xl"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full bg-violet/15 blur-3xl"
                    aria-hidden
                />
            </section>

            {!profileComplete && (
                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-warning/25 bg-warning-tint p-4 sm:flex-row sm:items-center">
                    <CircleAlert className="size-5 shrink-0 text-warning" />
                    <div className="flex-1 text-sm">
                        <p className="font-semibold">
                            One step before your first booking
                        </p>
                        <p className="text-muted-foreground">
                            Add your phone, IC and driving license details.
                        </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                        <Link href={profileEdit()}>Complete profile</Link>
                    </Button>
                </div>
            )}

            <Stagger className="mt-5 grid gap-4 sm:grid-cols-3">
                <StatCard
                    icon={CalendarClock}
                    label="Upcoming trips"
                    value={stats.upcoming}
                />
                <StatCard
                    icon={Flag}
                    label="Completed trips"
                    value={stats.completed}
                />
                <StatCard
                    icon={CalendarCheck}
                    label="All bookings"
                    value={stats.total}
                />
            </Stagger>

            <div className="mt-8 flex items-end justify-between gap-3">
                <h2 className="text-h2">Upcoming trips</h2>
                {stats.total > 0 && (
                    <Link
                        href={BookingController.index()}
                        className="flex items-center gap-1 rounded-sm text-sm font-semibold text-tint-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                        All bookings
                        <ArrowRight className="size-4" />
                    </Link>
                )}
            </div>

            {!nextTrip ? (
                <EmptyState
                    className="mt-4"
                    icon={CalendarDays}
                    title="No upcoming trips"
                    description="Browse our cars and plan your next drive. Booking takes under a minute."
                    action={
                        <Button asChild>
                            <Link href={CarController.index()}>Find a car</Link>
                        </Button>
                    }
                />
            ) : (
                <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    {/* Next trip, shown big */}
                    <article className="overflow-hidden rounded-2xl border bg-card shadow-soft">
                        <div className="h-48 bg-surface-gradient p-6">
                            <CarImage
                                src={nextTrip.image_url}
                                alt={nextTrip.vehicle}
                            />
                        </div>
                        <div className="space-y-3 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-xs font-semibold tracking-wider text-tint-foreground uppercase">
                                        Next trip
                                    </p>
                                    <h3 className="text-lg font-bold">
                                        {nextTrip.vehicle}
                                    </h3>
                                </div>
                                <StatusBadge status={nextTrip.status} />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <InfoTile
                                    icon={CalendarDays}
                                    label="Dates"
                                    value={`${nextTrip.pickup}${nextTrip.pickup_time ? `, ${nextTrip.pickup_time}` : ''} – ${nextTrip.return}`}
                                />
                                <InfoTile
                                    icon={MapPin}
                                    label="Pickup"
                                    value={nextTrip.pickup_location}
                                />
                            </div>
                            <span className="inline-block rounded-full bg-muted px-2.5 py-1 font-mono text-xs">
                                {nextTrip.ref}
                            </span>
                        </div>
                    </article>

                    {/* Later trips */}
                    <div className="space-y-3">
                        {laterTrips.length === 0 ? (
                            <div className="flex h-full min-h-32 items-center justify-center rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No other trips planned yet.
                            </div>
                        ) : (
                            laterTrips.map((booking) => (
                                <article
                                    key={booking.id}
                                    className="flex items-center gap-4 rounded-xl border bg-card p-3 shadow-soft"
                                >
                                    <div className="h-14 w-20 shrink-0 rounded-lg bg-surface-gradient p-1.5">
                                        <CarImage
                                            src={booking.image_url}
                                            alt={booking.vehicle}
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-semibold">
                                            {booking.vehicle}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {booking.pickup} – {booking.return}
                                        </div>
                                    </div>
                                    <StatusBadge status={booking.status} />
                                </article>
                            ))
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function InfoTile({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
            <Icon className="size-4.5 shrink-0 text-brand" />
            <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="truncate text-sm font-semibold">{value}</div>
            </div>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
