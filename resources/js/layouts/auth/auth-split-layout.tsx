import { Link } from '@inertiajs/react';
import { CalendarCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { CarSilhouette } from '@/components/rentngo/car-image';
import Logo from '@/components/rentngo/logo';
import { PageTransition } from '@/components/rentngo/motion';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const highlights = [
    {
        icon: CalendarCheck,
        text: 'See which cars are free on your dates, live',
    },
    {
        icon: ShieldCheck,
        text: 'Free cancellation until the day before pickup',
    },
    { icon: Sparkles, text: 'Clean, serviced cars from Axia to Vellfire' },
];

/**
 * Login / register: a light brand panel with the RentNGo promise on the left
 * (large screens only), and the form in a white card on the right.
 */
export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Brand panel */}
            <div className="relative m-3 hidden overflow-hidden rounded-3xl border bg-hero-gradient p-10 shadow-soft lg:flex lg:flex-col">
                <Link
                    href={home()}
                    className="relative z-10 w-fit rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                    <span className="inline-flex items-center gap-2 rounded-full border bg-card py-1.5 pr-4 pl-1.5 shadow-soft">
                        <Logo />
                    </span>
                </Link>

                <div className="relative z-10 mt-auto max-w-md">
                    <h2 className="text-4xl leading-tight font-extrabold tracking-tight">
                        Drive your journey, your way.
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                        Car rental across Klang Valley with pickup in Shah Alam,
                        KLIA and KL Sentral.
                    </p>
                    <ul className="mt-8 space-y-3">
                        {highlights.map((item) => (
                            <li
                                key={item.text}
                                className="flex items-center gap-3 text-sm"
                            >
                                <span className="flex size-8 items-center justify-center rounded-full border border-primary-border bg-primary text-brand">
                                    <item.icon className="size-4" />
                                </span>
                                {item.text}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Decorative car + glows */}
                <CarSilhouette className="pointer-events-none absolute -right-16 bottom-40 h-auto w-[115%] max-w-none text-brand/[0.06]" />
                <div
                    className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-brand/10 blur-3xl"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-violet/10 blur-3xl"
                    aria-hidden
                />
            </div>

            {/* Form */}
            <div className="flex items-center justify-center px-4 py-10 sm:px-8">
                <PageTransition className="w-full max-w-md">
                    <Link
                        href={home()}
                        className="mb-8 flex justify-center rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none lg:hidden"
                    >
                        <Logo />
                    </Link>
                    <div className="rounded-2xl border bg-card p-6 shadow-lift sm:p-8">
                        <div className="mb-6 space-y-1.5">
                            <h1 className="text-h1">{title}</h1>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                        {children}
                    </div>
                </PageTransition>
            </div>
        </div>
    );
}
