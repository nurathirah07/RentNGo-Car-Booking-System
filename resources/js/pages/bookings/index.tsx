import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarCheck,
    CalendarDays,
    ChevronDown,
    CreditCard,
    FileDown,
    MapPin,
    Plus,
    Star,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import BookingController from '@/actions/App/Http/Controllers/BookingController';
import CarController from '@/actions/App/Http/Controllers/CarController';
import PaymentController from '@/actions/App/Http/Controllers/PaymentController';
import ReviewController from '@/actions/App/Http/Controllers/ReviewController';
import InputError from '@/components/input-error';
import { Stagger } from '@/components/rentngo/motion';
import Pagination from '@/components/pagination';
import CarImage from '@/components/rentngo/car-image';
import EmptyState from '@/components/rentngo/empty-state';
import PageHeader from '@/components/rentngo/page-header';
import PriceBreakdown from '@/components/rentngo/price-breakdown';
import SegmentedToggle from '@/components/rentngo/segmented-toggle';
import { StarInput, StarRating } from '@/components/rentngo/star-rating';
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
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ringgit } from '@/lib/format';
import { receipt } from '@/routes/bookings';
import type { BookingStatus, CustomerBooking, Paginated } from '@/types';

type Tab = 'upcoming' | 'completed' | 'cancelled';

/** Which booking statuses each tab shows. */
const tabStatuses: Record<Tab, BookingStatus[]> = {
    upcoming: ['pending', 'confirmed'],
    completed: ['completed'],
    cancelled: ['cancelled'],
};

const tabLabels: Record<Tab, string> = {
    upcoming: 'Upcoming',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

export default function MyBookings({
    bookings,
    onlinePaymentEnabled,
}: {
    bookings: Paginated<CustomerBooking>;
    onlinePaymentEnabled: boolean;
}) {
    const [bookingToCancel, setBookingToCancel] =
        useState<CustomerBooking | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [bookingToReview, setBookingToReview] =
        useState<CustomerBooking | null>(null);
    const [payingId, setPayingId] = useState<number | null>(null);

    /** Sends the customer to ToyyibPay (the server answers with a full-page redirect). */
    function payOnline(booking: CustomerBooking) {
        router.post(
            PaymentController.start.url(booking.id),
            {},
            {
                preserveScroll: true,
                onStart: () => setPayingId(booking.id),
                onFinish: () => setPayingId(null),
            },
        );
    }

    // Tabs filter the bookings on this page in the browser (no reload needed).
    const [tab, setTab] = useState<Tab>('upcoming');
    const countFor = (name: Tab) =>
        bookings.data.filter((booking) =>
            tabStatuses[name].includes(booking.status),
        ).length;
    const visibleBookings = bookings.data.filter((booking) =>
        tabStatuses[tab].includes(booking.status),
    );

    function cancelBooking() {
        if (!bookingToCancel) {
            return;
        }

        router.patch(
            BookingController.cancel.url(bookingToCancel.id),
            {},
            {
                preserveScroll: true,
                onStart: () => setIsCancelling(true),
                onFinish: () => {
                    setIsCancelling(false);
                    setBookingToCancel(null);
                },
            },
        );
    }

    return (
        <>
            <Head title="My bookings" />

            <PageHeader
                eyebrow="Your trips"
                title="My bookings"
                description="Every car you have booked with RentNGo, newest first."
                actions={
                    <Button asChild>
                        <Link href={CarController.index()}>
                            <Plus />
                            Book a car
                        </Link>
                    </Button>
                }
            />

            {bookings.data.length === 0 ? (
                <EmptyState
                    className="mt-6"
                    icon={CalendarCheck}
                    title="No bookings yet"
                    description="Find a car you like, pick your dates and it will show up here."
                    action={
                        <Button asChild>
                            <Link href={CarController.index()}>
                                Browse cars
                                <ArrowRight />
                            </Link>
                        </Button>
                    }
                />
            ) : (
                <>
                    <SegmentedToggle
                        className="mt-6 max-w-full overflow-x-auto"
                        label="Show bookings"
                        value={tab}
                        onChange={setTab}
                        options={(Object.keys(tabLabels) as Tab[]).map(
                            (name) => ({
                                value: name,
                                label: `${tabLabels[name]} (${countFor(name)})`,
                            }),
                        )}
                    />

                    {visibleBookings.length === 0 ? (
                        <p className="mt-4 rounded-xl border border-dashed bg-card/60 p-10 text-center text-sm text-muted-foreground">
                            {tab === 'upcoming'
                                ? 'No upcoming trips. Time to plan one?'
                                : `No ${tabLabels[tab].toLowerCase()} bookings here.`}
                        </p>
                    ) : (
                        // Keyed by tab so switching tabs replays the staggered entrance.
                        <Stagger key={tab} className="mt-4 grid gap-4">
                            {visibleBookings.map((booking) => (
                                <article
                                    key={booking.id}
                                    className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-soft transition-shadow duration-200 hover:shadow-lift sm:flex-row sm:items-center sm:p-5"
                                >
                                    <div className="h-24 w-full shrink-0 rounded-lg bg-surface-gradient p-2 sm:w-40">
                                        <CarImage
                                            src={booking.image_url}
                                            alt={booking.vehicle}
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-base font-semibold">
                                                {booking.vehicle}
                                            </h2>
                                            <StatusBadge
                                                status={booking.status}
                                            />
                                        </div>
                                        <p className="flex flex-wrap items-center gap-2 text-sm">
                                            <CalendarDays className="size-4 text-brand" />
                                            {booking.pickup}
                                            {booking.pickup_time &&
                                                `, ${booking.pickup_time}`}{' '}
                                            – {booking.return}
                                            <span className="text-muted-foreground">
                                                ({booking.total_days} day
                                                {booking.total_days === 1
                                                    ? ''
                                                    : 's'}
                                                )
                                            </span>
                                        </p>
                                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="size-3.5" />
                                                {booking.pickup_location}
                                            </span>
                                            <span aria-hidden>·</span>
                                            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px]">
                                                {booking.ref}
                                            </span>
                                        </p>
                                        {booking.my_rating !== null && (
                                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                                You rated
                                                <StarRating
                                                    rating={booking.my_rating}
                                                />
                                            </p>
                                        )}
                                        <details className="group text-sm">
                                            <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-sm text-xs font-semibold text-tint-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                                                Price details
                                                <ChevronDown className="size-3.5 transition-transform duration-200 group-open:rotate-180" />
                                            </summary>
                                            <PriceBreakdown
                                                className="mt-2 max-w-sm animate-in duration-200 fade-in slide-in-from-top-1"
                                                pricePerDay={
                                                    booking.price_per_day
                                                }
                                                days={booking.total_days}
                                                subtotal={
                                                    booking.subtotal_amount
                                                }
                                                discount={
                                                    booking.discount_amount
                                                }
                                                total={booking.total_amount}
                                                deposit={booking.deposit_amount}
                                                lateFee={booking.late_fee}
                                            />
                                        </details>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 border-t pt-4 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                                        <div className="sm:text-right">
                                            <div className="text-lg font-bold tracking-tight">
                                                {ringgit(booking.total_amount)}
                                            </div>
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {booking.payment_method}
                                                {booking.payment_status &&
                                                    ` · ${booking.payment_status}`}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap justify-end gap-2">
                                            {booking.can_pay &&
                                                onlinePaymentEnabled && (
                                                    <Button
                                                        variant="brand"
                                                        size="sm"
                                                        onClick={() =>
                                                            payOnline(booking)
                                                        }
                                                        disabled={
                                                            payingId !== null
                                                        }
                                                    >
                                                        {payingId ===
                                                        booking.id ? (
                                                            <Spinner />
                                                        ) : (
                                                            <CreditCard />
                                                        )}
                                                        Pay online
                                                    </Button>
                                                )}
                                            {booking.can_review && (
                                                <Button
                                                    variant="tint"
                                                    size="sm"
                                                    onClick={() =>
                                                        setBookingToReview(
                                                            booking,
                                                        )
                                                    }
                                                >
                                                    <Star />
                                                    Rate trip
                                                </Button>
                                            )}
                                            {booking.status !== 'cancelled' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    {/* A file download, so a plain link rather than an Inertia visit */}
                                                    <a
                                                        href={receipt.url(
                                                            booking.id,
                                                        )}
                                                    >
                                                        <FileDown />
                                                        Receipt
                                                    </a>
                                                </Button>
                                            )}
                                            {booking.can_cancel && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-destructive-foreground hover:border-destructive/40 hover:text-destructive-foreground"
                                                    onClick={() =>
                                                        setBookingToCancel(
                                                            booking,
                                                        )
                                                    }
                                                >
                                                    Cancel booking
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </Stagger>
                    )}
                </>
            )}

            <div className="mt-6">
                <Pagination paginator={bookings} />
            </div>

            <Dialog
                open={bookingToCancel !== null}
                onOpenChange={(open) => {
                    if (!open && !isCancelling) {
                        setBookingToCancel(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel this booking?</DialogTitle>
                        <DialogDescription>
                            {bookingToCancel &&
                                `${bookingToCancel.vehicle}, ${bookingToCancel.pickup} – ${bookingToCancel.return}. `}
                            The car will be released for other customers. If you
                            already paid, RentNGo will refund you.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isCancelling}>
                                Keep booking
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={cancelBooking}
                            disabled={isCancelling}
                        >
                            {isCancelling ? 'Cancelling…' : 'Cancel booking'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ReviewDialog
                booking={bookingToReview}
                onClose={() => setBookingToReview(null)}
            />
        </>
    );
}

/** Stars + an optional comment for a completed trip. */
function ReviewDialog({
    booking,
    onClose,
}: {
    booking: CustomerBooking | null;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({ rating: 0, comment: '' });

    function close() {
        if (processing) {
            return;
        }

        reset();
        clearErrors();
        onClose();
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        if (!booking) {
            return;
        }

        post(ReviewController.store.url(booking.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <Dialog
            open={booking !== null}
            onOpenChange={(open) => !open && close()}
        >
            <DialogContent>
                <form onSubmit={submit} className="grid gap-5">
                    <DialogHeader>
                        <DialogTitle>How was your trip?</DialogTitle>
                        <DialogDescription>
                            {booking &&
                                `${booking.vehicle}, ${booking.pickup} – ${booking.return}. `}
                            Your review helps other renters choose.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-2">
                        <StarInput
                            value={data.rating}
                            onChange={(rating) => setData('rating', rating)}
                        />
                        <InputError message={errors.rating} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="review-comment">
                            Comment{' '}
                            <span className="font-normal text-muted-foreground">
                                (optional)
                            </span>
                        </Label>
                        <textarea
                            id="review-comment"
                            rows={3}
                            maxLength={1000}
                            value={data.comment}
                            onChange={(e) => setData('comment', e.target.value)}
                            placeholder="Clean car, smooth pickup…"
                            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground hover:border-brand/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                        <InputError message={errors.comment} />
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                            >
                                Not now
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={processing || data.rating === 0}
                        >
                            {processing && <Spinner />}
                            Submit review
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

MyBookings.layout = {
    breadcrumbs: [{ title: 'My bookings', href: BookingController.index() }],
};
