import { usePage } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import AppTopNavLayout from '@/layouts/app/app-topnav-layout';
import type { BreadcrumbItem } from '@/types';

/**
 * Customers get the dark top bar (like a car marketplace);
 * admins keep the sidebar, which suits a back-office tool.
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
        return <AppTopNavLayout>{children}</AppTopNavLayout>;
    }

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppSidebarLayout>
    );
}
