import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { PageTransition } from '@/components/rentngo/motion';
import type { AppLayoutProps } from '@/types';

/**
 * Admin layout: white sidebar on the left, frosted header with breadcrumbs,
 * and the page below. Sidebar and header stay put; only the page transitions.
 */
export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <a
                href="#main-content"
                className="sr-only rounded-lg bg-card px-4 py-2 text-sm font-semibold shadow-lift focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:ring-[3px] focus:ring-ring/50"
            >
                Skip to content
            </a>
            <AppSidebar />
            <AppContent variant="sidebar" className="min-w-0 overflow-x-clip">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <PageTransition className="flex flex-1 flex-col p-4 md:p-6">
                    <span
                        id="main-content"
                        tabIndex={-1}
                        className="outline-none"
                    />
                    {children}
                </PageTransition>
            </AppContent>
        </AppShell>
    );
}
