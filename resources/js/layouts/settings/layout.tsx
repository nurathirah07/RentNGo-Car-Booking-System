import { Link, usePage } from '@inertiajs/react';
import { ShieldCheck, UserRound } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { ActivePill, PageTransition } from '@/components/rentngo/motion';
import PageHeader from '@/components/rentngo/page-header';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: UserRound,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: ShieldCheck,
    },
];

/** Settings: tabs on the left (a horizontal strip on phones) and the form in a white card. */
export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { component } = usePage();

    return (
        <div>
            <PageHeader
                eyebrow="Account"
                title="Settings"
                description="Manage your profile and password."
            />

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
                <aside className="lg:w-56 lg:shrink-0">
                    <nav
                        className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1.5 shadow-soft lg:flex-col"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => {
                            const isActive = isCurrentOrParentUrl(item.href);

                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${index}`}
                                    href={item.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={cn(
                                        'relative isolate flex h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold transition-colors duration-200',
                                        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                                        isActive
                                            ? 'text-tint-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    {isActive && (
                                        <ActivePill
                                            layoutId="settings-tab"
                                            className="rounded-lg bg-tint"
                                        />
                                    )}
                                    {item.icon && (
                                        <item.icon className="size-4" />
                                    )}
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="min-w-0 flex-1 rounded-xl border bg-card p-5 shadow-soft sm:p-8 md:max-w-3xl">
                    {/* Switching tabs fades just the form, not the whole page */}
                    <PageTransition transitionKey={component}>
                        <section className="max-w-xl space-y-12">
                            {children}
                        </section>
                    </PageTransition>
                </div>
            </div>
        </div>
    );
}
