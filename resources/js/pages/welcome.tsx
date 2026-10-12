import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    Car,
    CarFront,
    CalendarSearch,
    Gem,
    KeyRound,
    MapPin,
    Mountain,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Reveal, Stagger } from '@/components/rentngo/motion';
import CarImage from '@/components/rentngo/car-image';
import Logo from '@/components/rentngo/logo';
import VehicleCard from '@/components/rentngo/vehicle-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ringgitShort } from '@/lib/format';
import { PICKUP_POINTS, savePickupLocation } from '@/lib/pickup-location';
import { dashboard, login, register } from '@/routes';
import { index as carsIndex, show as carsShow } from '@/routes/cars';
import type { CarCard } from '@/types';

type CategoryTile = {
    id: number;
    name: string;
    description: string | null;
    cars: number;
    from_price: number | null;
};

type WelcomeProps = {
    popularCars: CarCard[];
    categories: CategoryTile[];
    today: string;
};

const categoryIcons: Record<string, LucideIcon> = {
    Compact: Car,
    Sedan: CarFront,
    SUV: Mountain,
    MPV: Users,
    Luxury: Gem,
};

const steps = [
    {
        icon: CalendarSearch,
        title: 'Pick your dates',
        text: 'We only show cars that are free for your whole trip, checked live.',
    },
    {
        icon: BadgeCheck,
        title: 'Book in a minute',
        text: 'Choose a pickup point and how you pay. No deposit to book online.',
    },
    {
        icon: KeyRound,
        title: 'Collect & drive',
        text: 'Pick up the keys in Shah Alam, KLIA or KL Sentral and off you go.',
    },
];

const ALL = 'all';
const ANY_LOCATION = 'any';

export default function Welcome({
    popularCars,
    categories,
    today,
}: WelcomeProps) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState({
        pickup_location: '',
        pickup_date: '',
        return_date: '',
        category: '',
    });

    /** Opens Browse cars with these filters (guests are asked to log in first). */
    function submitSearch(event: FormEvent) {
        event.preventDefault();

        // The pickup point doesn't filter cars; it's remembered and
        // pre-selected on the booking form instead.
        const { pickup_location: pickupLocation, ...filters } = search;
        savePickupLocation(pickupLocation);

        router.get(
            carsIndex.url(),
            Object.fromEntries(
                Object.entries(filters).filter(([, value]) => value !== ''),
            ),
        );
    }

    const heroCar = popularCars[0];

    return (
        <>
            <Head title="Car rental in Klang Valley" />

            <div className="mx-auto w-full max-w-330 px-3 pt-3 sm:px-4 sm:pt-4">
                {/* Top bar */}
                <header className="sticky top-3 z-40 flex h-16 items-center gap-3 rounded-2xl border bg-card/75 px-4 shadow-soft backdrop-blur-xl">
                    <Link
                        href="/"
                        className="rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                        <Logo />
                    </Link>
                    <nav
                        className="mx-auto hidden items-center gap-1 text-sm font-semibold text-muted-foreground md:flex"
                        aria-label="Sections"
                    >
                        {[
                            ['#cars', 'Popular cars'],
                            ['#how', 'How it works'],
                            ['#categories', 'Categories'],
                        ].map(([href, label]) => (
                            <a
                                key={href}
                                href={href}
                                className="rounded-full px-4 py-2 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                            >
                                {label}
                            </a>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-2 md:ml-0">
                        {auth.user ? (
                            <Button asChild size="pill">
                                <Link href={dashboard()}>
                                    Go to dashboard
                                    <ArrowRight />
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="rounded-full"
                                >
                                    <Link href={login()}>Log in</Link>
                                </Button>
                                <Button asChild size="pill">
                                    <Link href={register()}>Sign up</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </header>

                {/* Hero */}
                <section className="relative mt-5 overflow-hidden rounded-3xl border bg-hero-gradient px-5 pt-10 pb-6 sm:px-10 sm:pt-14 lg:pb-10">
                    <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
                        <Reveal>
                            <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1.5 text-xs font-semibold text-tint-foreground shadow-soft">
                                <MapPin className="size-3.5" />
                                Shah Alam · KLIA · KL Sentral
                            </span>
                            <h1 className="mt-5 text-display">
                                Drive your journey,{' '}
                                <span className="text-brand-gradient">
                                    your way.
                                </span>
                            </h1>
                            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
                                From a city-friendly Myvi to a Vellfire for the
                                big day. See what&apos;s free on your dates and
                                book in a minute.
                            </p>
                        </Reveal>
                        <Reveal
                            variant="scaleIn"
                            className="h-48 sm:h-64 lg:h-80"
                        >
                            <CarImage
                                src={heroCar?.image_url ?? null}
                                alt={heroCar?.name ?? 'RentNGo car'}
                                className="drop-shadow-2xl"
                            />
                        </Reveal>
                    </div>

                    {/* Floating search card */}
                    <Reveal delay={0.15} className="relative z-10 mt-6">
                        <form
                            onSubmit={submitSearch}
                            className="grid gap-3 rounded-2xl border bg-card p-4 shadow-lift sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-end"
                        >
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="hero-location"
                                    className="text-xs text-muted-foreground"
                                >
                                    Pickup location
                                </Label>
                                <Select
                                    value={
                                        search.pickup_location || ANY_LOCATION
                                    }
                                    onValueChange={(value) =>
                                        setSearch({
                                            ...search,
                                            pickup_location:
                                                value === ANY_LOCATION
                                                    ? ''
                                                    : value,
                                        })
                                    }
                                >
                                    <SelectTrigger
                                        id="hero-location"
                                        className="h-11! w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ANY_LOCATION}>
                                            Any pickup point
                                        </SelectItem>
                                        {PICKUP_POINTS.map((point) => (
                                            <SelectItem
                                                key={point}
                                                value={point}
                                            >
                                                {point}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="hero-pickup"
                                    className="text-xs text-muted-foreground"
                                >
                                    Pickup date
                                </Label>
                                <Input
                                    id="hero-pickup"
                                    type="date"
                                    min={today}
                                    value={search.pickup_date}
                                    onChange={(e) =>
                                        setSearch({
                                            ...search,
                                            pickup_date: e.target.value,
                                            return_date:
                                                search.return_date &&
                                                search.return_date >=
                                                    e.target.value
                                                    ? search.return_date
                                                    : e.target.value,
                                        })
                                    }
                                    className="h-11"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="hero-return"
                                    className="text-xs text-muted-foreground"
                                >
                                    Return date
                                </Label>
                                <Input
                                    id="hero-return"
                                    type="date"
                                    min={search.pickup_date || today}
                                    value={search.return_date}
                                    onChange={(e) =>
                                        setSearch({
                                            ...search,
                                            return_date: e.target.value,
                                        })
                                    }
                                    className="h-11"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label
                                    htmlFor="hero-category"
                                    className="text-xs text-muted-foreground"
                                >
                                    Category
                                </Label>
                                <Select
                                    value={search.category || ALL}
                                    onValueChange={(value) =>
                                        setSearch({
                                            ...search,
                                            category:
                                                value === ALL ? '' : value,
                                        })
                                    }
                                >
                                    <SelectTrigger
                                        id="hero-category"
                                        className="h-11! w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>
                                            Any category
                                        </SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={String(category.id)}
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                className="h-11 sm:col-span-2 lg:col-span-1"
                            >
                                <Search />
                                Search cars
                            </Button>
                        </form>
                    </Reveal>

                    <div
                        className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand/10 blur-3xl"
                        aria-hidden
                    />
                    <div
                        className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-violet/15 blur-3xl"
                        aria-hidden
                    />
                </section>

                {/* Trust strip */}
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                        {
                            icon: ShieldCheck,
                            title: 'Free cancellation',
                            text: 'Until the day before pickup',
                        },
                        {
                            icon: CalendarSearch,
                            title: 'Live availability',
                            text: 'No double bookings, ever',
                        },
                        {
                            icon: BadgeCheck,
                            title: 'Transparent pricing',
                            text: 'One daily rate, in RM',
                        },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-soft"
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-tint text-tint-foreground">
                                <item.icon className="size-5" />
                            </span>
                            <div>
                                <div className="text-sm font-semibold">
                                    {item.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {item.text}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Popular cars */}
                <section id="cars" className="mt-20 scroll-mt-24">
                    <SectionHeading
                        eyebrow="Our fleet"
                        title="Popular cars"
                        action={
                            <Button asChild variant="outline">
                                <Link href={carsIndex()}>
                                    See all cars
                                    <ArrowRight />
                                </Link>
                            </Button>
                        }
                    />
                    {!auth.user && (
                        <p className="mt-2 text-body text-muted-foreground">
                            Browse freely; you&apos;ll be asked to{' '}
                            <Link
                                href={login()}
                                className="font-semibold text-tint-foreground underline underline-offset-2"
                            >
                                log in
                            </Link>{' '}
                            or create a free account when you book.
                        </p>
                    )}
                    <Stagger className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {popularCars.map((car) => (
                            <VehicleCard
                                key={car.id}
                                car={car}
                                href={carsShow(car.id)}
                            />
                        ))}
                    </Stagger>
                </section>

                {/* How it works */}
                <section id="how" className="mt-20 scroll-mt-24">
                    <SectionHeading
                        eyebrow="Simple"
                        title="How it works"
                        centered
                    />
                    <ol className="mt-8 grid gap-5 md:grid-cols-3">
                        {steps.map((step, index) => (
                            <li
                                key={step.title}
                                className="relative rounded-2xl border bg-card p-6 shadow-soft"
                            >
                                <span
                                    className="absolute top-5 right-6 text-5xl font-extrabold text-muted-foreground/15 select-none"
                                    aria-hidden
                                >
                                    {index + 1}
                                </span>
                                <span className="flex size-12 items-center justify-center rounded-xl border border-primary-border bg-primary text-brand">
                                    <step.icon className="size-5.5" />
                                </span>
                                <h3 className="mt-5 text-lg font-bold">
                                    {step.title}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {step.text}
                                </p>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Categories */}
                <section id="categories" className="mt-20 scroll-mt-24">
                    <SectionHeading
                        eyebrow="For every trip"
                        title="Browse by category"
                    />
                    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                        {categories.map((category) => {
                            const Icon = categoryIcons[category.name] ?? Car;

                            return (
                                <Link
                                    key={category.id}
                                    href={carsIndex({
                                        query: { category: category.id },
                                    })}
                                    className="group card-hover rounded-2xl border bg-card p-5 shadow-soft focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                                >
                                    <span className="flex size-12 items-center justify-center rounded-xl bg-tint text-tint-foreground transition-colors duration-200 group-hover:bg-brand group-hover:text-brand-foreground">
                                        <Icon className="size-5.5" />
                                    </span>
                                    <div className="mt-4 font-bold">
                                        {category.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {category.cars} car
                                        {category.cars === 1 ? '' : 's'}
                                        {category.from_price !== null &&
                                            ` · from ${ringgitShort(category.from_price)}/day`}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Call to action */}
                <section className="relative mt-20 overflow-hidden rounded-3xl border bg-hero-gradient px-6 py-12 text-center shadow-soft sm:px-12">
                    <h2 className="text-h1 sm:text-4xl sm:font-extrabold">
                        Ready when you are.
                    </h2>
                    <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                        Create a free account, pick your dates and drive away
                        from one of our three pickup points.
                    </p>
                    <div className="mt-7 flex flex-wrap justify-center gap-3">
                        <Button asChild size="lg">
                            <Link href={auth.user ? carsIndex() : register()}>
                                {auth.user ? 'Browse cars' : 'Create account'}
                                <ArrowRight />
                            </Link>
                        </Button>
                    </div>
                    <div
                        className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-brand/10 blur-3xl"
                        aria-hidden
                    />
                    <div
                        className="pointer-events-none absolute -right-16 -bottom-24 size-72 rounded-full bg-violet/10 blur-3xl"
                        aria-hidden
                    />
                </section>

                {/* Footer */}
                <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t py-8 text-sm text-muted-foreground sm:flex-row">
                    <Logo />
                    <p>
                        Car rental in Klang Valley, Malaysia. Prices in RM, per
                        day.
                    </p>
                    <p>© {new Date().getFullYear()} RentNGo</p>
                </footer>
            </div>
        </>
    );
}

function SectionHeading({
    eyebrow,
    title,
    action,
    centered = false,
}: {
    eyebrow: string;
    title: string;
    action?: React.ReactNode;
    centered?: boolean;
}) {
    return (
        <div
            className={
                centered
                    ? 'text-center'
                    : 'flex flex-wrap items-end justify-between gap-4'
            }
        >
            <div>
                <p className="text-eyebrow">{eyebrow}</p>
                <h2 className="mt-1 text-h1">{title}</h2>
            </div>
            {action}
        </div>
    );
}
