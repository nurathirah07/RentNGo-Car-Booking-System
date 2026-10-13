import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    CalendarSearch,
    Car,
    CarFront,
    CircleCheck,
    Gem,
    KeyRound,
    MapPin,
    Mountain,
    Search,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import AnimatedNumber from '@/components/rentngo/animated-number';
import CarImage from '@/components/rentngo/car-image';
import Logo from '@/components/rentngo/logo';
import { Reveal, Stagger } from '@/components/rentngo/motion';
import VehicleCard from '@/components/rentngo/vehicle-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ringgitShort } from '@/lib/format';
import { easeOut } from '@/lib/motion';
import { PICKUP_POINTS, savePickupLocation } from '@/lib/pickup-location';
import { cn } from '@/lib/utils';
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
        text: 'Choose a pickup time, point and how you pay. Review, then confirm.',
    },
    {
        icon: KeyRound,
        title: 'Collect & drive',
        text: 'Pick up the keys in Shah Alam, KLIA or KL Sentral and off you go.',
    },
];

const perks = [
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
];

const ANY = 'any';

/** A gentle, endless up-and-down float for the chips around the hero car. */
function floatLoop(delay = 0) {
    return {
        animate: { y: [0, -6, 0] },
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            delay,
        },
    };
}

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

    // The top bar gets a firmer shadow once you scroll.
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    useMotionValueEvent(scrollY, 'change', (y) => setIsScrolled(y > 8));

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

    // Real numbers for the hero stats, taken from the categories data.
    const fleetSize = categories.reduce(
        (sum, category) => sum + category.cars,
        0,
    );
    const prices = categories
        .map((category) => category.from_price)
        .filter((price): price is number => price !== null);
    const lowestPrice = prices.length ? Math.min(...prices) : null;

    const heroCar = popularCars[0];
    const ctaCar = popularCars[1] ?? popularCars[0];

    return (
        <>
            <Head title="Car rental in Klang Valley" />

            <div className="mx-auto w-full max-w-330 px-3 pt-3 sm:px-4 sm:pt-4">
                {/* Top bar */}
                <header
                    className={cn(
                        'sticky top-3 z-40 flex h-16 items-center gap-3 rounded-2xl border px-4 backdrop-blur-xl transition-[box-shadow,background-color] duration-300',
                        isScrolled
                            ? 'bg-card/90 shadow-lift'
                            : 'bg-card/70 shadow-soft',
                    )}
                >
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

                {/* ---------- Hero ---------- */}
                <section className="relative mt-4 overflow-hidden rounded-4xl bg-hero-gradient px-5 pt-10 pb-24 sm:px-10 sm:pt-14 lg:pb-28">
                    {/* Soft light behind everything */}
                    {/* Soft lights that drift slowly behind the hero ("aurora") */}
                    <motion.div
                        className="pointer-events-none absolute -top-40 left-1/3 size-[36rem] rounded-full bg-brand/15 blur-3xl"
                        animate={{ x: [0, 60, -30, 0], y: [0, 30, 10, 0] }}
                        transition={{
                            duration: 18,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        aria-hidden
                    />
                    <motion.div
                        className="pointer-events-none absolute -right-24 -bottom-40 size-[30rem] rounded-full bg-violet/15 blur-3xl"
                        animate={{ x: [0, -50, 20, 0], y: [0, -40, -10, 0] }}
                        transition={{
                            duration: 22,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        aria-hidden
                    />

                    <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                        <Reveal>
                            <span className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-xs font-semibold text-tint-foreground shadow-soft backdrop-blur">
                                <Sparkles className="size-3.5" />
                                Car rental in Klang Valley
                            </span>
                            <h1 className="mt-5 text-display">
                                Drive your journey,{' '}
                                <span className="text-brand-gradient">
                                    your way.
                                </span>
                            </h1>
                            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
                                From a city-friendly Myvi to a Vellfire for the
                                big day. See what&apos;s free on your dates and
                                book in a minute.
                            </p>

                            <div className="mt-7 flex flex-wrap items-center gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="rounded-full"
                                >
                                    <Link href={carsIndex()}>
                                        Browse cars
                                        <ArrowRight />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="ghost"
                                    className="rounded-full"
                                >
                                    <a href="#how">How it works</a>
                                </Button>
                            </div>

                            {/* Real fleet numbers */}
                            <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-4">
                                <HeroStat
                                    label="cars to choose from"
                                    value={fleetSize}
                                />
                                <HeroStat
                                    label="pickup points"
                                    value={PICKUP_POINTS.length}
                                />
                                {lowestPrice !== null && (
                                    <HeroStat
                                        label="per day, from"
                                        value={lowestPrice}
                                        format={ringgitShort}
                                    />
                                )}
                            </dl>
                        </Reveal>

                        {/* Car on a lit "stage" */}
                        <Reveal
                            variant="scaleIn"
                            delay={0.1}
                            className="relative"
                        >
                            <div
                                className="absolute inset-x-[8%] top-[12%] bottom-[18%] rounded-full bg-gradient-to-br from-brand/20 via-primary to-violet/15 blur-2xl"
                                aria-hidden
                            />
                            <div className="relative h-56 sm:h-72 lg:h-[22rem]">
                                <CarImage
                                    src={heroCar?.image_url ?? null}
                                    alt={heroCar?.name ?? 'RentNGo car'}
                                    className="drop-shadow-[0_30px_35px_rgb(20_30_70/0.25)]"
                                />
                            </div>
                            {/* Ground shadow */}
                            <div
                                className="mx-auto -mt-6 h-6 w-3/4 rounded-[50%] bg-foreground/15 blur-xl"
                                aria-hidden
                            />

                            {/* Floating info chips */}
                            <motion.div
                                {...floatLoop()}
                                className="absolute top-2 left-0 hidden items-center gap-2 rounded-2xl border bg-card/90 px-3.5 py-2.5 text-sm font-semibold shadow-lift backdrop-blur sm:flex"
                            >
                                <span className="flex size-7 items-center justify-center rounded-full bg-success-tint text-success">
                                    <CircleCheck className="size-4" />
                                </span>
                                Free cancellation
                            </motion.div>
                            {heroCar && (
                                <motion.div
                                    {...floatLoop(1.2)}
                                    className="absolute right-0 bottom-6 hidden rounded-2xl border bg-card/90 px-4 py-3 shadow-lift backdrop-blur sm:block"
                                >
                                    <div className="text-caption text-muted-foreground">
                                        Most booked
                                    </div>
                                    <div className="font-semibold">
                                        {heroCar.name}
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-bold">
                                            {ringgitShort(
                                                heroCar.price_per_day,
                                            )}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {' '}
                                            / day
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </Reveal>
                    </div>
                </section>

                {/* ---------- Search bar (overlaps the hero) ---------- */}
                <Reveal
                    delay={0.2}
                    className="relative z-10 mx-auto -mt-14 max-w-5xl px-2 sm:px-6"
                >
                    <form
                        onSubmit={submitSearch}
                        className="grid gap-1 rounded-3xl border bg-card p-2 shadow-lift sm:grid-cols-2 lg:flex lg:items-center lg:rounded-full"
                        aria-label="Find a car"
                    >
                        <SearchField
                            label="Pickup location"
                            htmlFor="hero-location"
                            icon={MapPin}
                        >
                            <Select
                                value={search.pickup_location || ANY}
                                onValueChange={(value) =>
                                    setSearch({
                                        ...search,
                                        pickup_location:
                                            value === ANY ? '' : value,
                                    })
                                }
                            >
                                <SelectTrigger
                                    id="hero-location"
                                    className={bareControl}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ANY}>
                                        Any pickup point
                                    </SelectItem>
                                    {PICKUP_POINTS.map((point) => (
                                        <SelectItem key={point} value={point}>
                                            {point}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </SearchField>

                        <Divider />

                        <SearchField
                            label="Pickup date"
                            htmlFor="hero-pickup"
                            icon={CalendarSearch}
                        >
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
                                            search.return_date >= e.target.value
                                                ? search.return_date
                                                : e.target.value,
                                    })
                                }
                                className={bareControl}
                            />
                        </SearchField>

                        <Divider />

                        <SearchField
                            label="Return date"
                            htmlFor="hero-return"
                            icon={CalendarSearch}
                        >
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
                                className={bareControl}
                            />
                        </SearchField>

                        <Divider />

                        <SearchField
                            label="Category"
                            htmlFor="hero-category"
                            icon={Car}
                        >
                            <Select
                                value={search.category || ANY}
                                onValueChange={(value) =>
                                    setSearch({
                                        ...search,
                                        category: value === ANY ? '' : value,
                                    })
                                }
                            >
                                <SelectTrigger
                                    id="hero-category"
                                    className={bareControl}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ANY}>
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
                        </SearchField>

                        <Button
                            type="submit"
                            size="lg"
                            className="m-1 h-12 rounded-2xl sm:col-span-2 lg:rounded-full lg:px-6"
                        >
                            <Search />
                            Search
                        </Button>
                    </form>
                </Reveal>

                {/* ---------- Perks ---------- */}
                <Stagger
                    className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3"
                    delay={0.25}
                >
                    {perks.map((perk) => (
                        <div
                            key={perk.title}
                            className="flex items-center gap-3 sm:justify-center"
                        >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary-border bg-primary text-brand">
                                <perk.icon className="size-4.5" />
                            </span>
                            <div>
                                <div className="text-sm font-semibold">
                                    {perk.title}
                                </div>
                                <div className="text-caption text-muted-foreground">
                                    {perk.text}
                                </div>
                            </div>
                        </div>
                    ))}
                </Stagger>

                {/* ---------- Popular cars ---------- */}
                <section id="cars" className="mt-24 scroll-mt-24">
                    <SectionHeading
                        eyebrow="Our fleet"
                        title="Popular cars"
                        description={
                            auth.user ? (
                                'The cars our customers book the most.'
                            ) : (
                                <>
                                    Browse freely; you&apos;ll be asked to{' '}
                                    <Link
                                        href={login()}
                                        className="font-semibold text-tint-foreground underline underline-offset-2"
                                    >
                                        log in
                                    </Link>{' '}
                                    or create a free account when you book.
                                </>
                            )
                        }
                        action={
                            <Button
                                asChild
                                variant="outline"
                                className="rounded-full"
                            >
                                <Link href={carsIndex()}>
                                    See all cars
                                    <ArrowRight />
                                </Link>
                            </Button>
                        }
                    />
                    <Stagger
                        inView
                        className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        {popularCars.map((car) => (
                            <VehicleCard
                                key={car.id}
                                car={car}
                                href={carsShow(car.id)}
                            />
                        ))}
                    </Stagger>
                </section>

                {/* ---------- How it works ---------- */}
                <section id="how" className="mt-28 scroll-mt-24">
                    <SectionHeading
                        eyebrow="Simple"
                        title="How it works"
                        centered
                    />
                    <div className="relative mt-10">
                        {/* Dashed line joining the steps (large screens) */}
                        <div
                            className="absolute top-7 right-[16%] left-[16%] hidden border-t-2 border-dashed border-primary-border lg:block"
                            aria-hidden
                        />
                        <Stagger
                            inView
                            className="relative grid gap-8 lg:grid-cols-3"
                            gap={0.1}
                        >
                            {steps.map((step, index) => (
                                <div
                                    key={step.title}
                                    className="flex flex-col items-center text-center"
                                >
                                    <span className="relative flex size-14 items-center justify-center rounded-2xl border border-primary-border bg-card text-brand shadow-soft">
                                        <step.icon className="size-6" />
                                        <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
                                            {index + 1}
                                        </span>
                                    </span>
                                    <h3 className="mt-5 text-h3">
                                        {step.title}
                                    </h3>
                                    <p className="mt-1 max-w-xs text-body text-muted-foreground">
                                        {step.text}
                                    </p>
                                </div>
                            ))}
                        </Stagger>
                    </div>
                </section>

                {/* ---------- Categories ---------- */}
                <section id="categories" className="mt-28 scroll-mt-24">
                    <SectionHeading
                        eyebrow="For every trip"
                        title="Browse by category"
                    />
                    <Stagger
                        inView
                        className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"
                    >
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
                                    <div className="text-caption text-muted-foreground">
                                        {category.cars} car
                                        {category.cars === 1 ? '' : 's'}
                                        {category.from_price !== null &&
                                            ` · from ${ringgitShort(category.from_price)}/day`}
                                    </div>
                                    <ArrowRight className="mt-3 size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand" />
                                </Link>
                            );
                        })}
                    </Stagger>
                </section>

                {/* ---------- Call to action ---------- */}
                <Reveal inView className="mt-28">
                    <section className="relative grid items-center gap-6 overflow-hidden rounded-4xl border bg-hero-gradient p-8 shadow-soft sm:p-12 lg:grid-cols-2">
                        <div
                            className="pointer-events-none absolute -top-24 -left-16 size-80 rounded-full bg-brand/10 blur-3xl"
                            aria-hidden
                        />
                        <div className="relative">
                            <p className="text-eyebrow">Ready when you are</p>
                            <h2 className="mt-2 text-h1 sm:text-4xl sm:font-extrabold">
                                Your next drive is a minute away.
                            </h2>
                            <p className="mt-3 max-w-md text-muted-foreground">
                                Create a free account, pick your dates and drive
                                away from one of our three pickup points.
                            </p>
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="rounded-full"
                                >
                                    <Link
                                        href={
                                            auth.user ? carsIndex() : register()
                                        }
                                    >
                                        {auth.user
                                            ? 'Browse cars'
                                            : 'Create free account'}
                                        <ArrowRight />
                                    </Link>
                                </Button>
                                {!auth.user && (
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="ghost"
                                        className="rounded-full"
                                    >
                                        <Link href={login()}>
                                            I have an account
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="relative h-48 sm:h-64">
                            <CarImage
                                src={ctaCar?.image_url ?? null}
                                alt={ctaCar?.name ?? 'RentNGo car'}
                                className="drop-shadow-[0_24px_30px_rgb(20_30_70/0.2)]"
                            />
                        </div>
                    </section>
                </Reveal>

                {/* ---------- Footer ---------- */}
                <footer className="mt-20 border-t py-12">
                    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
                        <div>
                            <Logo />
                            <p className="mt-3 max-w-xs text-body text-muted-foreground">
                                Car rental in Klang Valley, Malaysia. Prices in
                                RM, per day, with free cancellation until the
                                day before pickup.
                            </p>
                        </div>
                        <FooterColumn title="Explore">
                            <FooterLink href={carsIndex.url()}>
                                Browse cars
                            </FooterLink>
                            <FooterLink href="#how">How it works</FooterLink>
                            <FooterLink href="#categories">
                                Categories
                            </FooterLink>
                            {!auth.user && (
                                <FooterLink href={register.url()}>
                                    Create account
                                </FooterLink>
                            )}
                        </FooterColumn>
                        <FooterColumn title="Pickup points">
                            {PICKUP_POINTS.map((point) => (
                                <li
                                    key={point}
                                    className="flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                    <MapPin className="size-3.5 text-brand" />
                                    {point}
                                </li>
                            ))}
                        </FooterColumn>
                    </div>
                    <p className="mt-10 text-caption text-muted-foreground">
                        © {new Date().getFullYear()} RentNGo. Built as a
                        portfolio project.
                    </p>
                </footer>
            </div>
        </>
    );
}

/** Borderless control inside a search-bar segment (the segment draws the box). */
const bareControl =
    'h-7 w-full border-0 bg-transparent p-0 text-sm font-semibold shadow-none hover:border-0 focus-visible:ring-0 [&_svg]:text-muted-foreground';

function SearchField({
    label,
    htmlFor,
    icon: Icon,
    children,
}: {
    label: string;
    htmlFor: string;
    icon: LucideIcon;
    children: ReactNode;
}) {
    return (
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-4 py-2.5 transition-colors duration-150 focus-within:bg-muted hover:bg-muted/70 lg:rounded-full">
            <Icon className="size-4.5 shrink-0 text-brand" aria-hidden />
            <div className="min-w-0 flex-1">
                <label
                    htmlFor={htmlFor}
                    className="block text-caption font-medium text-muted-foreground"
                >
                    {label}
                </label>
                {children}
            </div>
        </div>
    );
}

function Divider() {
    return (
        <span
            className="hidden h-8 w-px shrink-0 bg-border lg:block"
            aria-hidden
        />
    );
}

function HeroStat({
    value,
    label,
    format,
}: {
    value: number;
    label: string;
    format?: (value: number) => string;
}) {
    return (
        <div>
            <dt className="sr-only">{label}</dt>
            <dd className="text-2xl font-extrabold tracking-tight">
                <AnimatedNumber
                    value={value}
                    format={format}
                    countUp
                    duration={1}
                />
            </dd>
            <dd className="text-caption text-muted-foreground" aria-hidden>
                {label}
            </dd>
        </div>
    );
}

function SectionHeading({
    eyebrow,
    title,
    description,
    action,
    centered = false,
}: {
    eyebrow: string;
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    centered?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, ease: easeOut }}
            className={
                centered
                    ? 'text-center'
                    : 'flex flex-wrap items-end justify-between gap-4'
            }
        >
            <div>
                <p className="text-eyebrow">{eyebrow}</p>
                <h2 className="mt-1 text-h1">{title}</h2>
                {description && (
                    <p className="mt-2 text-body text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </motion.div>
    );
}

function FooterColumn({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <ul className="mt-3 space-y-2">{children}</ul>
        </div>
    );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <li>
            <a
                href={href}
                className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                {children}
            </a>
        </li>
    );
}
