import { Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { home } from '@/routes';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

/**
 * Frosted header at the top of the admin content area: menu toggle,
 * breadcrumbs (where am I?) and a shortcut to the public website.
 */
export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 rounded-t-2xl border-b bg-card/75 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-6">
            <SidebarTrigger className="-ml-1 rounded-lg text-muted-foreground hover:text-foreground" />
            <span className="h-5 w-px bg-border" aria-hidden />
            <div className="min-w-0 flex-1 truncate">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
            >
                <Link href={home()}>
                    <ExternalLink />
                    <span className="hidden sm:inline">View website</span>
                </Link>
            </Button>
        </header>
    );
}
