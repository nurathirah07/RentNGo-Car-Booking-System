import { Link, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import {
    Bell,
    CalendarCheck,
    Car,
    ChevronDown,
    LayoutGrid,
    MapPin,
    Menu,
    Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMotionValueEvent, useScroll } from 'motion/react';
import { useState } from 'react';
import Logo from '@/components/rentngo/logo';
import { ActivePill, Stagger } from '@/components/rentngo/motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { PICKUP_POINTS } from '@/lib/pickup-location';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as myBookingsIndex } from '@/routes/bookings';
import { index as carsIndex } from '@/routes/cars';

type NavLink = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon: LucideIcon;
};

const links: NavLink[] = [
    { title: 'Browse cars', href: carsIndex(), icon: Car },
    { title: 'My bookings', href: myBookingsIndex(), icon: CalendarCheck },
    { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
];

const focusRing =
    'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none';

/**
 * Customer top bar (frosted white, sticks to the top while scrolling):
 * logo on the left, the main pages as tabs in the middle (so you always see
 * where you are), pickup points, bookings shortcut, account menu and one
 * blue call-to-action on the right. On phones the tabs move into a slide-in menu.
 */
export default function TopNav() {
    const { auth } = usePage().props;
    const getInitials = useInitials();
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Once the page scrolls, the bar gets a firmer shadow so it reads as "floating".
    const { scrollY } = useScroll();
    const [isScrolled, setIsScrolled] = useState(false);
    useMotionValueEvent(scrollY, 'change', (y) => setIsScrolled(y > 8));

    return (
        <header
            className={cn(
                'sticky top-3 z-40 rounded-2xl border backdrop-blur-xl transition-[box-shadow,background-color] duration-300',
                isScrolled
                    ? 'bg-card/90 shadow-lift'
                    : 'bg-card/75 shadow-soft',
            )}
        >
            <div className="flex h-16 items-center gap-3 px-3 sm:px-4">
                <Link
                    href={carsIndex()}
                    className={cn('shrink-0 rounded-full', focusRing)}
                    aria-label="RentNGo home"
                >
                    <Logo />
                </Link>

                {/* Main pages as tabs (tablet and up) */}
                <nav
                    aria-label="Main"
                    className="mx-auto hidden items-center gap-1 rounded-full bg-muted/70 p-1 md:flex"
                >
                    {links.map((link) => {
                        const isActive = isCurrentOrParentUrl(link.href);

                        return (
                            <Link
                                key={link.title}
                                href={link.href}
                                prefetch
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    'relative isolate flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200',
                                    focusRing,
                                    isActive
                                        ? 'text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {/* White pill that slides to the active tab */}
                                {isActive && (
                                    <ActivePill
                                        layoutId="top-nav-tab"
                                        className="rounded-full bg-card shadow-soft"
                                    />
                                )}
                                <link.icon
                                    className={cn(
                                        'size-4',
                                        isActive && 'text-brand',
                                    )}
                                />
                                {link.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="ml-auto flex items-center gap-1.5 md:ml-0">
                    {/* Pickup points */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    'hidden h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:flex',
                                    focusRing,
                                )}
                            >
                                <MapPin className="size-4 text-brand" />
                                Shah Alam, Selangor
                                <ChevronDown className="size-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                                Pick up your car at
                            </DropdownMenuLabel>
                            {PICKUP_POINTS.map((point) => (
                                <DropdownMenuItem key={point} asChild>
                                    <Link href={carsIndex()}>
                                        <MapPin />
                                        {point}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link
                        href={myBookingsIndex()}
                        className={cn(
                            'hidden size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex',
                            focusRing,
                        )}
                        aria-label="Booking updates"
                    >
                        <Bell className="size-4.5" />
                    </Link>

                    {/* Account menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    'flex items-center gap-1 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-muted',
                                    focusRing,
                                )}
                                aria-label="Account menu"
                                data-test="top-nav-user-menu"
                            >
                                <Avatar className="size-9 ring-2 ring-card">
                                    <AvatarImage
                                        src={auth.user.avatar}
                                        alt={auth.user.name}
                                    />
                                    <AvatarFallback className="bg-tint text-xs font-bold text-tint-foreground">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <ChevronDown className="hidden size-4 text-muted-foreground sm:inline" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        asChild
                        size="pill"
                        className="hidden lg:inline-flex"
                    >
                        <Link href={carsIndex()}>
                            <Plus />
                            Book a car
                        </Link>
                    </Button>

                    {/* Phone menu */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full md:hidden"
                        onClick={() => setIsMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu />
                    </Button>
                </div>
            </div>

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetContent side="right" className="w-72 gap-0 p-4">
                    <SheetHeader className="p-0 pb-4">
                        <SheetTitle>
                            <Logo />
                        </SheetTitle>
                        <SheetDescription className="sr-only">
                            Main menu
                        </SheetDescription>
                    </SheetHeader>
                    <nav aria-label="Main">
                        <Stagger className="grid gap-1" gap={0.04}>
                            {links.map((link) => {
                                const isActive = isCurrentOrParentUrl(
                                    link.href,
                                );

                                return (
                                    <Link
                                        key={link.title}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        aria-current={
                                            isActive ? 'page' : undefined
                                        }
                                        className={cn(
                                            'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors',
                                            focusRing,
                                            isActive
                                                ? 'bg-tint text-tint-foreground'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                        )}
                                    >
                                        <link.icon className="size-4.5" />
                                        {link.title}
                                    </Link>
                                );
                            })}
                        </Stagger>
                    </nav>
                    <div className="mt-6 rounded-xl bg-hero-gradient p-4 text-sm">
                        <p className="flex items-center gap-2 font-semibold">
                            <MapPin className="size-4 text-brand" />
                            Pickup points
                        </p>
                        <ul className="mt-2 space-y-1 text-muted-foreground">
                            {PICKUP_POINTS.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </div>
                </SheetContent>
            </Sheet>
        </header>
    );
}
