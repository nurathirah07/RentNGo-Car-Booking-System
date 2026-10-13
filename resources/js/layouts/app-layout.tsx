import { usePage } from '@inertiajs/react';
import WelcomeCelebration from '@/components/rentngo/welcome-celebration';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import AppTopNavLayout from '@/layouts/app/app-topnav-layout';
import type { BreadcrumbItem } from '@/types';

/**
 * Customers get the frosted top bar (like a car marketplace);
 * admins keep the sidebar, which suits a back-office tool.
 * Both show the one-time welcome animation right after logging in or signing up.
 */
export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { auth } = usePage().props;

    if (auth.user?.role === 'customer') {
        return (
            <>
                <AppTopNavLayout>{children}</AppTopNavLayout>
                <WelcomeCelebration />
            </>
        );
    }

    return (
        <>
            <AppSidebarLayout breadcrumbs={breadcrumbs}>
                {children}
            </AppSidebarLayout>
            <WelcomeCelebration />
        </>
    );
}
