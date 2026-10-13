import { Link, usePage } from '@inertiajs/react';
import { CalendarCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Logo from '@/components/rentngo/logo';
import { PageTransition } from '@/components/rentngo/motion';
import { easeOut } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { home, login, register } from '@/routes';
import { index as carsIndex } from '@/routes/cars';
import type { AuthLayoutProps } from '@/types';

/** Photo, small label above the title and the "switch" link for each auth page. */
const pages: Record<
    string,
    {
        photo: string;
        eyebrow: string;
        switchText?: string;
        switchLabel?: string;
        switchHref?: string;
        /** Photographer credit shown on the photo, when there is one */
        credit?: string;
    }
> = {
    'auth/login': {
        photo: '/images/auth/login-bg.jpg',
        eyebrow: 'Welcome back',
        switchText: 'New to RentNGo?',
        switchLabel: 'Create an account',
        switchHref: register.url(),
    },
    'auth/register': {
        photo: '/images/auth/register-bg.jpg',
        credit: 'visual_saga_studios',
        eyebrow: 'Start for free',
        switchText: 'Already a member?',
        switchLabel: 'Log in',
        switchHref: login.url(),
    },
    default: {
        photo: '/images/auth/login-bg.jpg',
        eyebrow: 'Your account',
        switchText: 'Remembered it?',
        switchLabel: 'Back to log in',
        switchHref: login.url(),
    },
};

/**
 * Wavy left edge of the photo, in 0-1 units of the photo box. Two versions of the
 * same shape: the edge slowly morphs between them so the panel feels alive.
 */
const blobShapes = [
    'M0.30,0 C0.16,0.10 0.30,0.26 0.20,0.38 C0.08,0.52 0.00,0.66 0.10,0.80 C0.18,0.91 0.10,1 0.10,1 L1,1 L1,0 Z',
    'M0.26,0 C0.20,0.12 0.34,0.25 0.22,0.40 C0.10,0.55 0.04,0.66 0.13,0.79 C0.21,0.90 0.14,1 0.14,1 L1,1 L1,0 Z',
];

/** The dashed line that follows the wavy edge, a little to the left of it. */
const dashedPath =
    'M23,0 C9,10 23,26 13,38 C1,52 -7,66 3,80 C11,91 3,100 3,100';

const highlights = [
    { icon: CalendarCheck, text: 'Live availability' },
    { icon: ShieldCheck, text: 'Free cancellation' },
    { icon: Sparkles, text: 'Axia to Vellfire' },
];

/**
 * Login / register / password pages: one large white card. The form sits on the
 * left; on the right a car photo is cut into a soft wave with a dashed line
 * tracing its edge (desktop). On phones the photo becomes a banner above the form.
 */
export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { component } = usePage();
    const page = pages[component] ?? pages.default;
    const reduceMotion = useReducedMotion();

    return (
        <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-3 py-6 sm:px-6">
            {/* Soft background lights */}
            <div
                className="pointer-events-none absolute -top-40 -left-32 size-[34rem] rounded-full bg-brand/10 blur-3xl"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute -right-40 -bottom-40 size-[34rem] rounded-full bg-violet/10 blur-3xl"
                aria-hidden
            />

            {/* Clip-path shapes used by the photo (an SVG with no size of its own) */}
            <svg width="0" height="0" className="absolute" aria-hidden>
                <defs>
                    <clipPath id="auth-blob" clipPathUnits="objectBoundingBox">
                        <motion.path
                            d={blobShapes[0]}
                            animate={
                                reduceMotion ? undefined : { d: blobShapes }
                            }
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                repeatType: 'mirror',
                                ease: 'easeInOut',
                            }}
                        />
                    </clipPath>
                    <clipPath id="auth-wave" clipPathUnits="objectBoundingBox">
                        <path d="M0,0 H1 V0.80 C0.78,0.98 0.55,0.72 0.32,0.88 C0.18,0.97 0,0.90 0,0.90 Z" />
                    </clipPath>
                </defs>
            </svg>

            <motion.div
                className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border bg-card shadow-lift lg:min-h-[44rem]"
                initial={{ opacity: 0, y: 16, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: easeOut }}
            >
                {/* ---------- Photo (desktop): right side, wavy edge ---------- */}
                <div
                    className="absolute inset-y-0 right-0 hidden w-[50%] lg:block"
                    aria-hidden
                >
                    <div
                        className="absolute inset-0"
                        style={{ clipPath: 'url(#auth-blob)' }}
                    >
                        <AnimatePresence initial={false}>
                            <motion.img
                                key={page.photo}
                                src={page.photo}
                                alt=""
                                className="absolute inset-0 size-full object-cover"
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1.02 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    opacity: { duration: 0.6 },
                                    scale: { duration: 12, ease: 'easeOut' },
                                }}
                            />
                        </AnimatePresence>
                        {/* Gentle blue tint so the photo matches the brand */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1430]/70 via-transparent to-[#0b1430]/20" />
                    </div>

                    {/* Dashed line that draws itself along the wave */}
                    <svg
                        className="absolute inset-0 size-full overflow-visible"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        <motion.path
                            d={dashedPath}
                            fill="none"
                            stroke="var(--primary-border)"
                            strokeWidth="1.5"
                            strokeDasharray="6 7"
                            vectorEffect="non-scaling-stroke"
                            // Fade in, then the dashes slowly flow along the curve
                            initial={{ opacity: 0, strokeDashoffset: 0 }}
                            animate={
                                reduceMotion
                                    ? { opacity: 1 }
                                    : { opacity: 1, strokeDashoffset: [0, -26] }
                            }
                            transition={{
                                opacity: {
                                    duration: 0.8,
                                    delay: 0.3,
                                    ease: easeOut,
                                },
                                strokeDashoffset: {
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: 'linear',
                                },
                            }}
                        />
                    </svg>

                    {/* Floating glass chips on the photo */}
                    <motion.div
                        className="absolute top-8 right-8 flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur-md"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: [0, -5, 0] }}
                        transition={{
                            opacity: { duration: 0.4, delay: 0.6 },
                            y: {
                                duration: 4,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            },
                        }}
                    >
                        <span className="size-2 rounded-full bg-[#7ee2a8] shadow-[0_0_10px_#7ee2a8]" />
                        Cars free today
                    </motion.div>

                    <motion.div
                        className="absolute right-8 bottom-8 left-[24%] rounded-3xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-md"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.5,
                            ease: easeOut,
                        }}
                    >
                        <p className="text-lg leading-snug font-bold">
                            Drive your journey, your way.
                        </p>
                        <p className="mt-1 text-sm text-white/75">
                            Pickup in Shah Alam, KLIA and KL Sentral.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {highlights.map((item) => (
                                <span
                                    key={item.text}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium"
                                >
                                    <item.icon className="size-3.5" />
                                    {item.text}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {page.credit && (
                        <span className="absolute right-3 bottom-1 text-[10px] text-white/50">
                            Photo: {page.credit}
                        </span>
                    )}
                </div>

                {/* ---------- Form side ---------- */}
                <div className="relative flex flex-col p-6 sm:p-10 lg:w-[54%] lg:p-14">
                    {/* Brand + small nav */}
                    <div className="flex items-center gap-6">
                        <Link
                            href={home()}
                            className="rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                            <Logo />
                        </Link>
                        <nav
                            className="ml-auto hidden items-center gap-1 text-sm font-semibold text-muted-foreground sm:flex"
                            aria-label="Site"
                        >
                            <AuthNavLink href={home.url()} active={false}>
                                Home
                            </AuthNavLink>
                            <AuthNavLink href={carsIndex.url()} active={false}>
                                Cars
                            </AuthNavLink>
                            <AuthNavLink
                                href={login.url()}
                                active={component === 'auth/login'}
                            >
                                Log in
                            </AuthNavLink>
                            <AuthNavLink
                                href={register.url()}
                                active={component === 'auth/register'}
                            >
                                Join
                            </AuthNavLink>
                        </nav>
                    </div>

                    {/* Phones: the photo as a wavy banner */}
                    <div
                        className="relative mt-6 h-40 overflow-hidden rounded-3xl lg:hidden"
                        style={{ clipPath: 'url(#auth-wave)' }}
                    >
                        <img
                            src={page.photo}
                            alt=""
                            className="size-full object-cover"
                        />
                        <div
                            className="absolute inset-0 bg-gradient-to-t from-[#0b1430]/60 to-transparent"
                            aria-hidden
                        />
                        <p className="absolute top-4 left-5 text-sm font-semibold text-white">
                            Drive your journey, your way.
                        </p>
                    </div>

                    <PageTransition className="mt-8 flex flex-1 flex-col justify-center lg:mt-0 lg:max-w-md lg:py-10">
                        <p className="text-eyebrow text-muted-foreground">
                            {page.eyebrow}
                        </p>
                        <h1 className="mt-2 text-[2.1rem] leading-tight font-extrabold tracking-tight sm:text-[2.6rem]">
                            {title}
                            {/* Brand-blue full stop, unless the title already ends in punctuation */}
                            {!/[.?!]$/.test(title ?? '') && (
                                <span className="text-brand">.</span>
                            )}
                        </h1>
                        {page.switchHref && (
                            <p className="mt-2 text-body text-muted-foreground">
                                {page.switchText}{' '}
                                <Link
                                    href={page.switchHref}
                                    className="font-semibold text-brand underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                                >
                                    {page.switchLabel}
                                </Link>
                            </p>
                        )}
                        {description && (
                            <p className="mt-1 text-caption text-muted-foreground">
                                {description}
                            </p>
                        )}
                        <div className="mt-8">{children}</div>
                    </PageTransition>
                </div>
            </motion.div>
        </div>
    );
}

function AuthNavLink({
    href,
    active,
    children,
}: {
    href: string;
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'relative rounded-full px-3 py-1.5 transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                active ? 'text-foreground' : 'hover:text-foreground',
            )}
        >
            {children}
            {active && (
                <motion.span
                    layoutId="auth-nav-dot"
                    className="absolute -bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-brand"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
            )}
        </Link>
    );
}
