import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarCheck,
    CalendarClock,
    Car,
    CircleDollarSign,
    Plus,
    Users,
} from 'lucide-react';
import BookingController from '@/actions/App/Http/Controllers/Admin/BookingController';
import VehicleController from '@/actions/App/Http/Controllers/Admin/VehicleController';
import {
    EmptyRow,
    TableCard,
    Td,
    Th,
    THead,
    Tr,
} from '@/components/rentngo/data-table';
import { Stagger } from '@/components/rentngo/motion';
import StatCard from '@/components/rentngo/stat-card';
import StatusBadge from '@/components/rentngo/status-badge';
import { Button } from '@/components/ui/button';
import { ringgit } from '@/lib/format';
import type { BookingStatus } from '@/types';

interface Stats {
    totalVehicles: number;
    availableNow: number;
    customers: number;
    pendingBookings: number;
    activeBookings: number;
    revenue: number;
}

interface RecentBooking {
    id: number;
    ref: string;
    customer: string;
    vehicle: string;
    plate: string;
    pickup: string;
    return: string;
    amount: number;
    status: BookingStatus;
}

export default function AdminDashboard({
    stats,
    recentBookings,
}: {
    stats: Stats;
    recentBookings: RecentBooking[];
}) {
    return (
        <>
            <Head title="Admin Dashboard" />

            {/* Welcome banner with the two most common jobs */}
            <section className="relative overflow-hidden rounded-2xl border bg-hero-gradient p-6 shadow-soft sm:p-8">
                <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold tracking-wider text-tint-foreground uppercase">
                            RentNGo admin
                        </p>
                        <h1 className="mt-1 text-h1">
                            {stats.pendingBookings > 0
                                ? `${stats.pendingBookings} booking${stats.pendingBookings === 1 ? '' : 's'} waiting for you`
                                : 'All caught up today'}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {stats.availableNow} of {stats.totalVehicles} cars
                            are free to rent today.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild>
                            <Link
                                href={BookingController.index({
                                    query: { status: 'pending' },
                                })}
                            >
                                Review pending
                                <ArrowRight />
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={VehicleController.create()}>
                                <Plus />
                                Add vehicle
                            </Link>
                        </Button>
                    </div>
                </div>
                <div
                    className="pointer-events-none absolute -top-20 -right-10 size-64 rounded-full bg-brand/10 blur-3xl"
                    aria-hidden
                />
            </section>

            <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard
                    icon={Car}
                    label="Vehicles"
                    value={stats.totalVehicles}
                    note={`${stats.availableNow} available today`}
                    noteTone="up"
                />
                <StatCard
                    icon={Users}
                    label="Customers"
                    value={stats.customers}
                    note="Registered accounts"
                />
                <StatCard
                    icon={CalendarClock}
                    label="Pending bookings"
                    value={stats.pendingBookings}
                    note={
                        stats.pendingBookings > 0
                            ? 'Waiting for confirmation'
                            : 'Nothing to review'
                    }
                    noteTone={stats.pendingBookings > 0 ? 'down' : 'muted'}
                />
                <StatCard
                    icon={CalendarCheck}
                    label="Active bookings"
                    value={stats.activeBookings}
                    note="Pending + confirmed"
                />
                <StatCard
                    icon={CircleDollarSign}
                    label="Revenue"
                    value={stats.revenue}
                    format={ringgit}
                    note="From paid payments"
                    noteTone="up"
                />
            </Stagger>

            <div className="mt-8 flex items-end justify-between gap-3">
                <h2 className="text-h2">Recent bookings</h2>
                <Link
                    href={BookingController.index()}
                    className="flex items-center gap-1 rounded-sm text-sm font-semibold text-tint-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                    All bookings
                    <ArrowRight className="size-4" />
                </Link>
            </div>

            <TableCard className="mt-4">
                <THead>
                    <Th>Ref</Th>
                    <Th>Customer</Th>
                    <Th>Vehicle</Th>
                    <Th>Dates</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Status</Th>
                </THead>
                <tbody>
                    {recentBookings.length === 0 && (
                        <EmptyRow colSpan={6}>No bookings yet.</EmptyRow>
                    )}
                    {recentBookings.map((booking) => (
                        <Tr key={booking.id}>
                            <Td className="font-mono text-xs">{booking.ref}</Td>
                            <Td className="font-medium">{booking.customer}</Td>
                            <Td>
                                {booking.vehicle}
                                <div className="font-mono text-xs text-muted-foreground">
                                    {booking.plate}
                                </div>
                            </Td>
                            <Td className="whitespace-nowrap">
                                {booking.pickup} – {booking.return}
                            </Td>
                            <Td className="text-right font-semibold whitespace-nowrap">
                                {ringgit(booking.amount)}
                            </Td>
                            <Td>
                                <StatusBadge status={booking.status} />
                            </Td>
                        </Tr>
                    ))}
                </tbody>
            </TableCard>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Admin Dashboard',
            href: '/admin',
        },
    ],
};
