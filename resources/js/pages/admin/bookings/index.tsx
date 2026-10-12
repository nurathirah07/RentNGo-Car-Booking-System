import { Head, router } from '@inertiajs/react';
import {
    Ban,
    CircleCheck,
    CircleDollarSign,
    Flag,
    MoreHorizontal,
    Search,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import BookingController from '@/actions/App/Http/Controllers/Admin/BookingController';
import Pagination from '@/components/pagination';
import {
    EmptyRow,
    TableCard,
    Td,
    Th,
    THead,
    Tr,
    MobileCard,
    MobileCards,
    MobileField,
} from '@/components/rentngo/data-table';
import PageHeader from '@/components/rentngo/page-header';
import {
    MobileCardsSkeleton,
    TableRowsSkeleton,
} from '@/components/rentngo/skeletons';
import SegmentedToggle from '@/components/rentngo/segmented-toggle';
import StatusBadge from '@/components/rentngo/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { ringgit } from '@/lib/format';
import type { AdminBooking, BookingStatus, Paginated } from '@/types';

type Filters = {
    search: string;
    status: string;
};

type BookingsIndexProps = {
    bookings: Paginated<AdminBooking>;
    filters: Filters;
    statuses: BookingStatus[];
};

/** Menu text and icon for each status the admin can move a booking to. */
const statusActions: Partial<
    Record<BookingStatus, { label: string; icon: LucideIcon }>
> = {
    confirmed: { label: 'Confirm booking', icon: CircleCheck },
    completed: { label: 'Mark as completed', icon: Flag },
    cancelled: { label: 'Cancel booking', icon: Ban },
};

/**
 * The "..." menu on each row. It only shows what the server says is allowed
 * for this booking right now (next_statuses / can_mark_paid).
 */
function BookingActions({
    booking,
    onChangeStatus,
    onCancel,
    onMarkPaid,
}: {
    booking: AdminBooking;
    onChangeStatus: (booking: AdminBooking, status: BookingStatus) => void;
    onCancel: (booking: AdminBooking) => void;
    onMarkPaid: (booking: AdminBooking) => void;
}) {
    if (booking.next_statuses.length === 0 && !booking.can_mark_paid) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="bg-muted"
                    aria-label={`Actions for ${booking.ref}`}
                >
                    <MoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                {booking.next_statuses.map((status) => {
                    const action = statusActions[status];

                    if (!action) {
                        return null;
                    }

                    const isCancel = status === 'cancelled';

                    return (
                        <DropdownMenuItem
                            key={status}
                            variant={isCancel ? 'destructive' : 'default'}
                            onSelect={() =>
                                isCancel
                                    ? onCancel(booking)
                                    : onChangeStatus(booking, status)
                            }
                        >
                            <action.icon />
                            {action.label}
                        </DropdownMenuItem>
                    );
                })}

                {booking.can_mark_paid && (
                    <>
                        {booking.next_statuses.length > 0 && (
                            <DropdownMenuSeparator />
                        )}
                        <DropdownMenuItem onSelect={() => onMarkPaid(booking)}>
                            <CircleDollarSign />
                            Mark as paid
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function AdminBookingsIndex({
    bookings,
    filters,
    statuses,
}: BookingsIndexProps) {
    const {
        search,
        hasFilters,
        isLoading,
        applyFilters,
        handleSearchChange,
        clearFilters,
    } = useQueryFilters(BookingController.index.url(), filters);

    // Cancelling is the only destructive action, so it asks for confirmation first.
    const [bookingToCancel, setBookingToCancel] = useState<AdminBooking | null>(
        null,
    );

    function changeStatus(booking: AdminBooking, status: BookingStatus) {
        router.patch(
            BookingController.updateStatus.url(booking.id),
            { status },
            {
                preserveScroll: true,
                onFinish: () => setBookingToCancel(null),
            },
        );
    }

    function markPaid(booking: AdminBooking) {
        router.patch(
            BookingController.markPaid.url(booking.id),
            {},
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title="Bookings" />

            <PageHeader
                eyebrow="Operations"
                title="Bookings"
                description="Confirm new bookings, record payments and close finished rentals."
            />

            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-soft">
                {/* Status as quick tabs: one click instead of opening a dropdown */}
                <SegmentedToggle
                    label="Filter by status"
                    options={[
                        { value: 'all', label: 'All' },
                        ...statuses.map((status) => ({
                            value: status,
                            label:
                                status.charAt(0).toUpperCase() +
                                status.slice(1),
                        })),
                    ]}
                    value={filters.status || 'all'}
                    onChange={(value) =>
                        applyFilters({ status: value === 'all' ? '' : value })
                    }
                    className="max-w-full overflow-x-auto"
                />

                <div className="relative min-w-0 flex-1 basis-60">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search ref, customer, plate or model..."
                        className="pl-9"
                        aria-label="Search bookings"
                    />
                </div>

                {hasFilters && (
                    <Button variant="ghost" onClick={clearFilters}>
                        <X />
                        Clear
                    </Button>
                )}
            </div>

            <TableCard className="mt-4 hidden md:block">
                <THead>
                    <Th>Booking</Th>
                    <Th>Customer</Th>
                    <Th>Vehicle</Th>
                    <Th>Dates</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Payment</Th>
                    <Th>Status</Th>
                    <Th>
                        <span className="sr-only">Actions</span>
                    </Th>
                </THead>
                <tbody>
                    {isLoading ? (
                        <TableRowsSkeleton columns={8} />
                    ) : (
                        <>
                            {bookings.data.length === 0 && (
                                <EmptyRow colSpan={8}>
                                    {hasFilters
                                        ? 'No bookings match your filters.'
                                        : 'No bookings yet.'}
                                </EmptyRow>
                            )}

                            {bookings.data.map((booking) => (
                                <Tr key={booking.id} className="align-top">
                                    <Td>
                                        <div className="font-mono text-xs font-medium">
                                            {booking.ref}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {booking.pickup_location}
                                        </div>
                                        {booking.notes && (
                                            <div className="mt-1 max-w-48 text-xs text-muted-foreground italic">
                                                “{booking.notes}”
                                            </div>
                                        )}
                                    </Td>
                                    <Td>
                                        <div className="font-semibold">
                                            {booking.customer}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {booking.customer_phone ??
                                                booking.customer_email}
                                        </div>
                                    </Td>
                                    <Td>
                                        {booking.vehicle}
                                        <div className="font-mono text-xs text-muted-foreground">
                                            {booking.plate}
                                        </div>
                                    </Td>
                                    <Td className="whitespace-nowrap">
                                        {booking.pickup} – {booking.return}
                                        <div className="text-xs text-muted-foreground">
                                            {booking.pickup_time &&
                                                `Pickup ${booking.pickup_time} · `}
                                            {booking.total_days} day
                                            {booking.total_days === 1
                                                ? ''
                                                : 's'}
                                        </div>
                                    </Td>
                                    <Td className="text-right font-semibold whitespace-nowrap">
                                        {ringgit(booking.total_amount)}
                                    </Td>
                                    <Td>
                                        {booking.payment_status && (
                                            <StatusBadge
                                                status={booking.payment_status}
                                            />
                                        )}
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {booking.payment_method}
                                        </div>
                                    </Td>
                                    <Td>
                                        <StatusBadge status={booking.status} />
                                    </Td>
                                    <Td className="text-right">
                                        <BookingActions
                                            booking={booking}
                                            onChangeStatus={changeStatus}
                                            onCancel={setBookingToCancel}
                                            onMarkPaid={markPaid}
                                        />
                                    </Td>
                                </Tr>
                            ))}
                        </>
                    )}
                </tbody>
            </TableCard>

            {/* Phones: each row as a card */}
            <MobileCards className="mt-4 md:hidden">
                {isLoading ? (
                    <MobileCardsSkeleton />
                ) : bookings.data.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        {hasFilters
                            ? 'No bookings match your filters.'
                            : 'No bookings yet.'}
                    </p>
                ) : (
                    bookings.data.map((booking) => (
                        <MobileCard
                            key={booking.id}
                            title={booking.customer}
                            subtitle={
                                <span className="font-mono">{booking.ref}</span>
                            }
                            badge={<StatusBadge status={booking.status} />}
                            actions={
                                (booking.next_statuses.length > 0 ||
                                    booking.can_mark_paid) && (
                                    <BookingActions
                                        booking={booking}
                                        onChangeStatus={changeStatus}
                                        onCancel={setBookingToCancel}
                                        onMarkPaid={markPaid}
                                    />
                                )
                            }
                        >
                            <MobileField label="Vehicle">
                                {booking.vehicle}
                            </MobileField>
                            <MobileField label="Amount">
                                {ringgit(booking.total_amount)}
                            </MobileField>
                            <MobileField label="Dates">
                                {booking.pickup} – {booking.return}
                            </MobileField>
                            <MobileField label="Payment">
                                <span className="capitalize">
                                    {booking.payment_status ?? '—'}
                                </span>
                            </MobileField>
                        </MobileCard>
                    ))
                )}
            </MobileCards>

            <div className="mt-4">
                <Pagination paginator={bookings} />
            </div>

            <Dialog
                open={bookingToCancel !== null}
                onOpenChange={(open) => !open && setBookingToCancel(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel this booking?</DialogTitle>
                        <DialogDescription>
                            {bookingToCancel &&
                                `${bookingToCancel.ref} for ${bookingToCancel.customer} (${bookingToCancel.vehicle}, ${bookingToCancel.pickup} – ${bookingToCancel.return}) will be cancelled and the car becomes available again. `}
                            A payment that was already made is marked as
                            refunded.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">Keep booking</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                bookingToCancel &&
                                changeStatus(bookingToCancel, 'cancelled')
                            }
                        >
                            Cancel booking
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminBookingsIndex.layout = {
    breadcrumbs: [{ title: 'Bookings', href: BookingController.index() }],
};
