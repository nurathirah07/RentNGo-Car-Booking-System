import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarCheck,
    CalendarClock,
    CalendarDays,
    Car,
    CircleAlert,
    CircleCheck,
    Clock,
    Flag,
    MapPin,
    Search,
    UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import BookingController from '@/actions/App/Http/Controllers/BookingController';
import CarController from '@/actions/App/Http/Controllers/CarController';
import CarImage from '@/components/rentngo/car-image';
import EmptyState from '@/components/rentngo/empty-state';
import { Reveal } from '@/components/rentngo/motion';
import AnimatedNumber from '@/components/rentngo/animated-number';
import StatusBadge from '@/components/rentngo/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toISODate } from '@/lib/format';
import { cn } from '@/lib/utils';
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
    total_days: number;
    starts_in_days: number;
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

/** "Pickup today", "Pickup tomorrow", "Pickup in 3 days" or "On the road". */
function countdown(daysUntil: number): string {
    if (daysUntil < 0) {
        return 'On the road now';
    }

    if (daysUntil === 0) {
        return 'Pickup today';
    }

    return daysUntil === 1 ? 'Pickup tomorrow' : `Pickup in ${daysUntil} days`;
}

export default function Dashboard({
    stats,
    upcomingBookings,
    profileComplete,
}: DashboardProps) {
    const { auth } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];
    const [nextTrip, ...laterTrips] = upcomingBookings;

    // Quick search straight from the dashboard
    const today = toISODate(new Date());
    const [dates, setDates] = useState({ pickup_date: '', return_date: '' });

    function searchCars(event: FormEvent) {
        event.preventDefault();
        router.get(
            CarController.index.url(),
            dates.pickup_date && dates.return_date ? dates : {},
        );
    }

    return (
        <>
            <Head title="Dashboard" />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                {/* Greeting + quick search */}
                <Reveal className="relative overflow-hidden rounded-4xl border bg-hero-gradient p-6 shadow-soft sm:p-8">
                    <div
                        className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full bg-brand/10 blur-3xl"
                        aria-hidden
                    />
                    <div
                        className="pointer-events-none absolute -bottom-28 -left-10 size-72 rounded-full bg-violet/10 blur-3xl"
                        aria-hidden
                    />

                    <div className="relative">
                        <p className="text-sm font-semibold text-tint-foreground">
                            {greeting()}, {firstName}
                        </p>
                        <h1 className="mt-1 text-h1 sm:text-4xl sm:font-extrabold">
                            Where are you{' '}
                            <span className="text-brand-gradient">driving</span>{' '}
                            next?
                        </h1>
                        <p className="mt-2 text-body text-muted-foreground">
                            Pick your dates and we&apos;ll show every car
                            that&apos;s free.
                        </p>

                        <form
                            onSubmit={searchCars}
                            className="mt-6 grid gap-2 rounded-2xl border bg-card p-2 shadow-soft sm:grid-cols-[1fr_1fr_auto]"
                            aria-label="Find a car"
                        >
                            <DateField
                                id="dash-pickup"
                                label="Pickup"
                                min={today}
                                value={dates.pickup_date}
                                onChange={(value) =>
                                    setDates({
                                        pickup_date: value,
                                        return_date:
                                            dates.return_date &&
                                            dates.return_date >= value
                                                ? dates.return_date
                                                : value,
                                    })
                                }
                            />
                            <DateField
                                id="dash-return"
                                label="Return"
                                min={dates.pickup_date || today}
                                value={dates.return_date}
                                onChange={(value) =>
                                    setDates({ ...dates, return_date: value })
                                }
                            />
                            <Button
                                type="submit"
                                size="lg"
                                className="h-full min-h-12 rounded-xl"
                            >
                                <Search />
                                Find cars
                            </Button>
                        </form>

                        {/* Your numbers, inside the greeting card */}
                        <dl className="mt-6 grid grid-cols-3 divide-x rounded-2xl border bg-card/70 py-3 backdrop-blur">
                            <MiniStat
                                icon={CalendarClock}
                                label="Upcoming"
                                value={stats.upcoming}
                            />
                            <MiniStat
                                icon={Flag}
                                label="Completed"
                                value={stats.completed}
                            />
                            <MiniStat
                                icon={CalendarCheck}
                                label="All bookings"
                                value={stats.total}
                            />
                        </dl>

                        {!profileComplete && (
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                                <CircleAlert className="size-4 text-warning" />
                                <span className="text-muted-foreground">
                                    Add your IC and driving license before your
                                    first booking.
                                </span>
                                <Link
                                    href={profileEdit()}
                                    className="font-semibold text-tint-foreground underline underline-offset-2"
                                >
                                    Complete profile
                                </Link>
                            </div>
                        )}
                    </div>
                </Reveal>

                {/* Next trip */}
                <Reveal delay={0.08}>
                    {nextTrip ? (
                        <article className="flex h-full flex-col overflow-hidden rounded-4xl border bg-card shadow-soft">
                            <div className="relative h-44 bg-surface-gradient px-6 pt-6">
                                <span
                                    className={cn(
                                        'absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                                        nextTrip.starts_in_days <= 1
                                            ? 'bg-brand text-brand-foreground'
                                            : 'border border-primary-border bg-primary text-primary-foreground',
                                    )}
                                >
                                    <Clock className="size-3.5" />
                                    {countdown(nextTrip.starts_in_days)}
                                </span>
                                <div className="absolute top-4 right-4">
                                    <StatusBadge status={nextTrip.status} />
                                </div>
                                <div className="mx-auto mt-6 h-32 max-w-xs">
                                    <CarImage
                                        src={nextTrip.image_url}
                                        alt={nextTrip.vehicle}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-1 flex-col gap-4 p-5">
                                <div>
                                    <p className="text-eyebrow">Next trip</p>
                                    <h2 className="text-h2">
                                        {nextTrip.vehicle}
                                    </h2>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <InfoTile
                                        icon={CalendarDays}
                                        label={`${nextTrip.total_days} day${nextTrip.total_days === 1 ? '' : 's'}`}
                                        value={`${nextTrip.pickup}${nextTrip.pickup_time ? `, ${nextTrip.pickup_time}` : ''} – ${nextTrip.return}`}
                                    />
                                    <InfoTile
                                        icon={MapPin}
                                        label="Pickup at"
                                        value={nextTrip.pickup_location}
                                    />
                                </div>
                                <div className="mt-auto flex items-center justify-between gap-3">
                                    <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs">
                                        {nextTrip.ref}
                                    </span>
                                    <Link
                                        href={BookingController.index()}
                                        className="flex items-center gap-1 rounded-sm text-sm font-semibold text-tint-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                                    >
                                        Manage
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ) : (
                        <EmptyState
                            className="h-full justify-center rounded-4xl"
                            icon={CalendarClock}
                            title="No upcoming trips"
                            description="Your next booking will appear here with a countdown to pickup."
                            action={
                                <Button asChild>
                                    <Link href={CarController.index()}>
                                        Find a car
                                    </Link>
                                </Button>
                            }
                        />
                    )}
                </Reveal>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                {/* Later trips as a timeline */}
                <section aria-labelledby="later-heading">
                    <div className="flex items-end justify-between gap-3">
                        <h2 id="later-heading" className="text-h2">
                            Coming up
                        </h2>
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

                    {laterTrips.length === 0 ? (
                        <p className="mt-4 rounded-2xl border border-dashed bg-card/60 p-8 text-center text-sm text-muted-foreground">
                            {nextTrip
                                ? 'Nothing else planned after your next trip.'
                                : 'No trips planned yet.'}
                        </p>
                    ) : (
                        <ol className="relative mt-4 space-y-3 before:absolute before:top-4 before:bottom-4 before:left-[1.1rem] before:w-px before:bg-border">
                            {laterTrips.map((booking) => (
                                <li
                                    key={booking.id}
                                    className="relative flex items-center gap-4 pl-10"
                                >
                                    <span
                                        className="absolute left-2.5 flex size-3.5 items-center justify-center rounded-full border-2 border-brand bg-card"
                                        aria-hidden
                                    />
                                    <article className="flex flex-1 items-center gap-4 rounded-2xl border bg-card p-3 shadow-soft transition-shadow duration-200 hover:shadow-lift">
                                        <div className="h-14 w-20 shrink-0 rounded-xl bg-surface-gradient p-1.5">
                                            <CarImage
                                                src={booking.image_url}
                                                alt={booking.vehicle}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-semibold">
                                                {booking.vehicle}
                                            </div>
                                            <div className="text-caption text-muted-foreground">
                                                {booking.pickup} –{' '}
                                                {booking.return} ·{' '}
                                                {countdown(
                                                    booking.starts_in_days,
                                                )}
                                            </div>
                                        </div>
                                        <StatusBadge status={booking.status} />
                                    </article>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                {/* Quick actions */}
                <section aria-labelledby="actions-heading">
                    <h2 id="actions-heading" className="text-h2">
                        Quick actions
                    </h2>
                    <div className="mt-4 grid gap-3">
                        <QuickAction
                            href={CarController.index.url()}
                            icon={Car}
                            title="Browse cars"
                            text="See what's free on your dates"
                        />
                        <QuickAction
                            href={BookingController.index.url()}
                            icon={CalendarCheck}
                            title="My bookings"
                            text="View, or cancel before pickup"
                        />
                        <QuickAction
                            href={profileEdit.url()}
                            icon={UserRound}
                            title="Profile & license"
                            text={
                                profileComplete
                                    ? 'Ready to book'
                                    : 'Needed before you can book'
                            }
                            badge={
                                profileComplete ? (
                                    <CircleCheck
                                        className="size-4.5 text-success"
                                        aria-label="Complete"
                                    />
                                ) : (
                                    <CircleAlert
                                        className="size-4.5 text-warning"
                                        aria-label="Incomplete"
                                    />
                                )
                            }
                        />
                    </div>
                </section>
            </div>
        </>
    );
}

function MiniStat({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
}) {
    return (
        <div className="flex flex-col items-center gap-0.5 px-2 text-center">
            <Icon className="mb-1 size-4 text-brand" aria-hidden />
            <dt className="order-last text-caption text-muted-foreground">
                {label}
            </dt>
            <dd className="text-2xl font-extrabold tracking-tight">
                <AnimatedNumber value={value} countUp />
            </dd>
        </div>
    );
}

function DateField({
    id,
    label,
    value,
    min,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    min: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="rounded-xl px-3 py-1.5 transition-colors duration-150 focus-within:bg-muted hover:bg-muted/70">
            <label
                htmlFor={id}
                className="block text-caption font-medium text-muted-foreground"
            >
                {label}
            </label>
            <Input
                id={id}
                type="date"
                min={min}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-7 border-0 bg-transparent p-0 text-sm font-semibold shadow-none hover:border-0 focus-visible:ring-0"
            />
        </div>
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
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
            <Icon className="size-4.5 shrink-0 text-brand" />
            <div className="min-w-0">
                <div className="text-caption text-muted-foreground">
                    {label}
                </div>
                <div className="text-sm font-semibold break-words">{value}</div>
            </div>
        </div>
    );
}

function QuickAction({
    href,
    icon: Icon,
    title,
    text,
    badge,
}: {
    href: string;
    icon: LucideIcon;
    title: string;
    text: string;
    badge?: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="group flex card-hover items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tint text-tint-foreground transition-colors duration-200 group-hover:bg-brand group-hover:text-brand-foreground">
                <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block font-semibold">{title}</span>
                <span className="block text-caption text-muted-foreground">
                    {text}
                </span>
            </span>
            {badge ?? (
                <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand" />
            )}
        </Link>
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
