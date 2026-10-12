import { Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck,
    CalendarDays,
    Car,
    LayoutGrid,
    ShieldCheck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as adminBookingsIndex } from '@/routes/admin/bookings';
import { index as customersIndex } from '@/routes/admin/customers';
import { index as vehiclesIndex } from '@/routes/admin/vehicles';
import { index as myBookingsIndex } from '@/routes/bookings';
import { index as carsIndex } from '@/routes/cars';
import type { NavItem } from '@/types';

const customerNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        exact: true,
    },
    {
        title: 'Browse cars',
        href: carsIndex(),
        icon: Car,
    },
    {
        title: 'My bookings',
        href: myBookingsIndex(),
        icon: CalendarCheck,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin',
        icon: ShieldCheck,
        exact: true,
    },
    {
        title: 'Vehicles',
        href: vehiclesIndex(), // Wayfinder helper for the admin.vehicles.index route
        icon: Car,
    },
    {
        title: 'Bookings',
        href: adminBookingsIndex(),
        icon: CalendarDays,
    },
    {
        title: 'Customers',
        href: customersIndex(),
        icon: Users,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const isAdmin = auth.user.role === 'admin';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={isAdmin ? '/admin' : dashboard()}
                                prefetch
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={isAdmin ? adminNavItems : customerNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
