import { Head, Link, useForm, useHttp } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Banknote,
    CalendarDays,
    CalendarX2,
    CircleAlert,
    CircleCheck,
    Clock,
    CreditCard,
    Fuel,
    Landmark,
    LayoutGrid,
    MapPin,
    Palette,
    Settings2,
    ShieldCheck,
    Users,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import BookingController from '@/actions/App/Http/Controllers/BookingController';
import CarController from '@/actions/App/Http/Controllers/CarController';
import VehicleAvailabilityController from '@/actions/App/Http/Controllers/VehicleAvailabilityController';
import { Reveal, Stagger } from '@/components/rentngo/motion';
import InputError from '@/components/input-error';
import BookingCalendar from '@/components/rentngo/booking-calendar';
import AnimatedNumber from '@/components/rentngo/animated-number';
import CarImage from '@/components/rentngo/car-image';
import ChoiceChips from '@/components/rentngo/choice-chips';
import ImageLightbox from '@/components/rentngo/image-lightbox';
import { Tag } from '@/components/rentngo/status-badge';
import StepIndicator from '@/components/rentngo/step-indicator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dayAndDate, ringgit, ringgitShort } from '@/lib/format';
import { baseTransition } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { readPickupLocation } from '@/lib/pickup-location';
import { edit as profileEdit } from '@/routes/profile';
import type { AvailabilityResult, CarDetails } from '@/types';

type Dates = {
    pickup_date: string;
    return_date: string;
};

type CarShowProps = {
    vehicle: CarDetails;
    bookedRanges: string[];
    bookedDates: { from: string; to: string }[];
    initialDates: Dates;
    pickupLocations: string[];
    pickupTimes: string[];
    paymentMethods: string[];
    profileComplete: boolean;
    today: string;
    nowTime: string;
    maxDays: number;
};

/** An icon for each payment method chip. */
const paymentIcons: Record<string, LucideIcon> = {
    Cash: Banknote,
    'Online Banking': Landmark,
    'Credit/Debit Card': CreditCard,
    'E-Wallet': Wallet,
};

export default function CarShow({
    vehicle,
    bookedRanges,
    bookedDates,
    initialDates,
    pickupLocations,
    pickupTimes,
    paymentMethods,
    profileComplete,
    today,
    nowTime,
    maxDays,
}: CarShowProps) {
    // The booking itself: submitted once with POST /bookings.
    const { data, setData, post, processing, errors } = useForm({
        vehicle_id: vehicle.id,
        pickup_date: initialDates.pickup_date,
        return_date: initialDates.return_date,
        pickup_time: '',
        // Pre-select the pickup point chosen in the landing page search, if any.
        pickup_location:
            readPickupLocation(pickupLocations) ?? pickupLocations[0],
        payment_method: paymentMethods[0],
        notes: '',
    });

    // The live availability check: a plain JSON request (useHttp), not a page visit,
    // so the page stays where it is while we ask the server "is this car free?".
    const availability = useHttp<Dates, AvailabilityResult>({
        pickup_date: initialDates.pickup_date,
        return_date: initialDates.return_date,
    });
    const [result, setResult] = useState<AvailabilityResult | null>(null);

    function checkAvailability(pickupDate: string, returnDate: string) {
        if (!pickupDate || !returnDate) {
            setResult(null);

            return;
        }

        // The previous result stays on screen while checking, so the total can
        // roll from the old amount to the new one instead of disappearing.

        availability.cancel(); // drop an older check that is still running
        availability.transform(() => ({
            pickup_date: pickupDate,
            return_date: returnDate,
        }));
        availability
            .get(VehicleAvailabilityController.url(vehicle.id))
            .then(setResult)
            .catch(() => setResult(null)); // invalid dates: errors are shown under the calendar
    }

    // Dates picked on the Browse page arrive pre-filled: check them once on load.
    useEffect(() => {
        checkAvailability(initialDates.pickup_date, initialDates.return_date);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** A pickup slot is over if it's today and the time has passed. */
    function isPastSlot(pickupDate: string, time: string): boolean {
        return pickupDate === today && time <= nowTime;
    }

    function changeDates(pickupDate: string, returnDate: string) {
        setData((current) => ({
            ...current,
            pickup_date: pickupDate,
            return_date: returnDate,
            // Moving the pickup to today can make the chosen time impossible.
            pickup_time:
                current.pickup_time &&
                isPastSlot(pickupDate, current.pickup_time)
                    ? ''
                    : current.pickup_time,
        }));
        checkAvailability(pickupDate, returnDate);
    }

    // "Book now" first opens a summary to check; "Confirm booking" sends it.
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    function submit(event: FormEvent) {
        event.preventDefault();

        if (canBook) {
            setIsReviewOpen(true);
        }
    }

    function confirmBooking() {
        // The server checks availability AGAIN while saving (someone may have
        // booked in the meantime), so this dialog is never the only protection.
        post(BookingController.store.url(), {
            preserveScroll: true,
            // Validation errors are shown next to their fields, so close the summary.
            onError: () => setIsReviewOpen(false),
        });
    }

    // On phones, a bar with the total sticks to the bottom until the real
    // "Book now" button scrolls into view.
    const bookButtonRef = useRef<HTMLDivElement>(null);
    const isBookButtonVisible = useInView(bookButtonRef, { amount: 0.5 });

    function goToBookButton() {
        bookButtonRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    }

    const canBook =
        profileComplete &&
        vehicle.is_rentable &&
        result?.available === true &&
        !availability.processing &&
        data.pickup_time !== '' &&
        !processing;

    // "profile" is not a form field: the server adds it when IC/license details are missing.
    const profileError = (errors as Partial<Record<string, string>>).profile;

    const dateError =
        errors.pickup_date ??
        errors.return_date ??
        availability.errors.pickup_date ??
        availability.errors.return_date;

    /** Tells the customer what to do next, instead of just greying out the button. */
    const bookingHint = !vehicle.is_rentable
        ? 'This car is not available right now.'
        : !profileComplete
          ? 'Complete your profile to book.'
          : !data.pickup_date
            ? 'Pick your dates on the calendar.'
            : result && !result.available
              ? 'Choose dates when this car is free.'
              : !data.pickup_time
                ? 'Choose a pickup time.'
                : null;

    const steps = [
        { label: 'Dates', done: result?.available === true },
        { label: 'Time', done: data.pickup_time !== '' },
        {
            label: 'Details',
            done: result?.available === true && data.pickup_time !== '',
        },
        { label: 'Review', done: isReviewOpen },
    ];

    const isOneDay =
        data.pickup_date !== '' && data.pickup_date === data.return_date;

    const specs: { icon: LucideIcon; label: string; value: string }[] = [
        { icon: Users, label: 'Seats', value: `${vehicle.seats} people` },
        {
            icon: Settings2,
            label: 'Transmission',
            value: vehicle.transmission === 'Auto' ? 'Automatic' : 'Manual',
        },
        { icon: Fuel, label: 'Fuel', value: vehicle.fuel_type },
        { icon: CalendarDays, label: 'Year', value: String(vehicle.year) },
        { icon: Palette, label: 'Colour', value: vehicle.color ?? '—' },
        { icon: LayoutGrid, label: 'Category', value: vehicle.category },
    ];

    return (
        <>
            <Head title={vehicle.name} />

            <Link
                href={CarController.index()}
                className="mb-4 inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
                <ArrowLeft className="size-4" />
                Back to all cars
            </Link>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
                {/* Car details */}
                <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-2xl border bg-hero-gradient p-6 shadow-soft sm:p-10">
                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            <Tag tone="blue">{vehicle.category}</Tag>
                            <Tag tone={vehicle.is_rentable ? 'green' : 'grey'}>
                                {vehicle.is_rentable
                                    ? 'Available to book'
                                    : 'In maintenance'}
                            </Tag>
                        </div>
                        <ImageLightbox
                            src={vehicle.image_url}
                            alt={vehicle.name}
                        >
                            <Reveal
                                variant="scaleIn"
                                className="mx-auto mt-6 aspect-16/8 max-w-2xl"
                            >
                                <CarImage
                                    src={vehicle.image_url}
                                    alt={vehicle.name}
                                />
                            </Reveal>
                        </ImageLightbox>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="text-h1">{vehicle.name}</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {vehicle.category} · {vehicle.year} model
                            </p>
                        </div>
                        <p className="whitespace-nowrap">
                            <span className="text-2xl font-bold tracking-tight">
                                {ringgitShort(vehicle.price_per_day)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                /day
                            </span>
                        </p>
                    </div>

                    {/* Spec tiles */}
                    <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {specs.map((spec) => (
                            <div
                                key={spec.label}
                                className="flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-soft"
                            >
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-tint text-tint-foreground">
                                    <spec.icon className="size-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs text-muted-foreground">
                                        {spec.label}
                                    </div>
                                    <div className="truncate text-sm font-semibold">
                                        {spec.value}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Stagger>

                    {vehicle.description && (
                        <div className="rounded-xl border bg-card p-5 shadow-soft">
                            <h2 className="text-sm font-semibold">
                                About this car
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                {vehicle.description}
                            </p>
                        </div>
                    )}

                    <div className="rounded-xl border bg-card p-5 shadow-soft">
                        <h2 className="flex items-center gap-2 text-sm font-semibold">
                            <CalendarX2 className="size-4 text-brand" />
                            Already booked
                        </h2>
                        {bookedRanges.length === 0 ? (
                            <p className="mt-2 text-sm text-muted-foreground">
                                No upcoming bookings. Every date is free.
                            </p>
                        ) : (
                            <ul className="mt-3 flex flex-wrap gap-2">
                                {bookedRanges.map((range) => (
                                    <li
                                        key={range}
                                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                                    >
                                        {range}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Booking card */}
                <div
                    id="booking-card"
                    className="overflow-hidden rounded-2xl border bg-card shadow-lift"
                >
                    <div className="flex items-end justify-between gap-3 border-b bg-hero-gradient px-6 py-5">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Book this car
                            </p>
                            <p className="mt-0.5 text-2xl font-bold tracking-tight">
                                {ringgitShort(vehicle.price_per_day)}
                                <span className="text-sm font-medium text-muted-foreground">
                                    {' '}
                                    / day
                                </span>
                            </p>
                        </div>
                        <ShieldCheck
                            className="size-6 text-brand"
                            aria-hidden
                        />
                    </div>

                    <div className="p-5 sm:p-6">
                        {!profileComplete && (
                            <Alert className="mb-5 border-warning/30 bg-warning-tint">
                                <CircleAlert className="text-warning!" />
                                <AlertTitle>
                                    Complete your profile first
                                </AlertTitle>
                                <AlertDescription>
                                    <p>
                                        We need your phone, IC and a valid
                                        driving license before you can book.{' '}
                                        <Link
                                            href={profileEdit()}
                                            className="font-semibold text-tint-foreground underline underline-offset-2"
                                        >
                                            Update profile
                                        </Link>
                                    </p>
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="mb-6 rounded-xl bg-muted/50 px-3 pt-3 pb-1">
                            <StepIndicator steps={steps} />
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            {/* Step 1: dates */}
                            <Step
                                number={1}
                                title="Select dates"
                                action={
                                    data.pickup_date && (
                                        <button
                                            type="button"
                                            onClick={() => changeDates('', '')}
                                            className="rounded-sm text-xs font-semibold text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                                        >
                                            Clear
                                        </button>
                                    )
                                }
                            >
                                {/* Pickup → Return summary */}
                                <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                    <DateTile
                                        label="Pickup"
                                        value={
                                            data.pickup_date
                                                ? dayAndDate(data.pickup_date)
                                                : 'Pick a day'
                                        }
                                        active={!data.pickup_date}
                                    />
                                    <ArrowRight
                                        className="size-4 text-muted-foreground"
                                        aria-hidden
                                    />
                                    <DateTile
                                        label="Return"
                                        value={
                                            data.return_date
                                                ? dayAndDate(data.return_date)
                                                : '—'
                                        }
                                        active={isOneDay}
                                    />
                                </div>

                                <div className="rounded-xl border bg-card p-3">
                                    <BookingCalendar
                                        pickupDate={data.pickup_date}
                                        returnDate={data.return_date}
                                        onChange={changeDates}
                                        today={today}
                                        bookedDates={bookedDates}
                                        maxDays={maxDays}
                                    />
                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <span className="size-2.5 rounded-sm bg-foreground" />{' '}
                                            Selected
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="size-2.5 rounded-sm bg-primary ring-1 ring-primary-border" />{' '}
                                            Your trip
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="line-through decoration-danger/60">
                                                12
                                            </span>{' '}
                                            Booked
                                        </span>
                                    </div>
                                </div>

                                <p className="mt-2 text-xs text-muted-foreground">
                                    {isOneDay
                                        ? 'Tap another day to set your return date.'
                                        : `Up to ${maxDays} days. Pickup and return days are both charged.`}
                                </p>
                                <InputError
                                    className="mt-2"
                                    message={dateError}
                                />
                            </Step>

                            {/* Step 2: pickup time */}
                            <Step number={2} title="Pickup time" icon={Clock}>
                                <ChoiceChips
                                    label="Pickup time"
                                    value={data.pickup_time}
                                    onChange={(time) =>
                                        setData('pickup_time', time)
                                    }
                                    options={pickupTimes.map((time) => ({
                                        value: time,
                                        label: time,
                                        disabled: isPastSlot(
                                            data.pickup_date,
                                            time,
                                        ),
                                    }))}
                                    className="grid-cols-4 sm:grid-cols-5"
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.pickup_time}
                                />
                            </Step>

                            {/* Live availability + price breakdown */}
                            <div aria-live="polite">
                                {availability.processing && (
                                    <div className="flex h-14 animate-fade-in items-center gap-2 rounded-xl bg-muted px-4 text-sm text-muted-foreground">
                                        <Spinner /> Checking availability…
                                    </div>
                                )}

                                {result && (
                                    <Reveal className="space-y-3">
                                        <div
                                            className={cn(
                                                'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold',
                                                result.available
                                                    ? 'bg-success-tint text-success'
                                                    : 'bg-danger-tint text-danger',
                                            )}
                                        >
                                            {result.available ? (
                                                <CircleCheck className="size-4.5 shrink-0" />
                                            ) : (
                                                <CircleAlert className="size-4.5 shrink-0" />
                                            )}
                                            {result.message}
                                        </div>

                                        {result.available && (
                                            <dl className="space-y-2 rounded-xl bg-muted/60 p-4 text-sm">
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">
                                                        {ringgit(
                                                            vehicle.price_per_day,
                                                        )}{' '}
                                                        × {result.total_days}{' '}
                                                        day
                                                        {result.total_days === 1
                                                            ? ''
                                                            : 's'}
                                                    </dt>
                                                    <dd>
                                                        <AnimatedNumber
                                                            value={
                                                                result.total_amount
                                                            }
                                                            format={ringgit}
                                                        />
                                                    </dd>
                                                </div>
                                                <div className="flex justify-between border-t border-dashed pt-2 text-base font-bold">
                                                    <dt>Total</dt>
                                                    <dd>
                                                        <AnimatedNumber
                                                            value={
                                                                result.total_amount
                                                            }
                                                            format={ringgit}
                                                        />
                                                    </dd>
                                                </div>
                                            </dl>
                                        )}
                                    </Reveal>
                                )}
                            </div>

                            {/* Step 3: where and how to pay */}
                            <Step
                                number={3}
                                title="Pickup location"
                                icon={MapPin}
                            >
                                <ChoiceChips
                                    label="Pickup location"
                                    value={data.pickup_location}
                                    onChange={(location) =>
                                        setData('pickup_location', location)
                                    }
                                    options={pickupLocations.map(
                                        (location) => ({
                                            value: location,
                                            label: location,
                                        }),
                                    )}
                                    className="grid-cols-1 sm:grid-cols-3 [&>button]:text-xs"
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.pickup_location}
                                />
                            </Step>

                            <Step number={4} title="Payment method">
                                <ChoiceChips
                                    label="Payment method"
                                    value={data.payment_method}
                                    onChange={(method) =>
                                        setData('payment_method', method)
                                    }
                                    options={paymentMethods.map((method) => ({
                                        value: method,
                                        label: method,
                                        icon: paymentIcons[method],
                                    }))}
                                    className="grid-cols-2 [&>button]:justify-start [&>button]:px-3 [&>button]:text-xs"
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.payment_method}
                                />
                            </Step>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">
                                    Notes{' '}
                                    <span className="font-normal text-muted-foreground">
                                        (optional)
                                    </span>
                                </Label>
                                <Input
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData('notes', e.target.value)
                                    }
                                    placeholder="e.g. flight arrives at 9am"
                                    maxLength={255}
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <InputError message={profileError} />

                            <div className="space-y-2" ref={bookButtonRef}>
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full"
                                    disabled={!canBook}
                                >
                                    {processing && <Spinner />}
                                    Book now
                                    {result?.available && data.pickup_time && (
                                        <>
                                            {' · '}
                                            <AnimatedNumber
                                                value={result.total_amount}
                                                format={ringgit}
                                            />
                                        </>
                                    )}
                                </Button>
                                {bookingHint && (
                                    <p className="text-center text-xs text-muted-foreground">
                                        {bookingHint}
                                    </p>
                                )}
                            </div>

                            <p className="flex items-start gap-2 rounded-xl bg-tint/60 p-3 text-xs text-tint-foreground">
                                <ShieldCheck className="size-4 shrink-0" />
                                Free cancellation until the day before pickup.
                                Pay at pickup or by transfer.
                            </p>
                        </form>
                    </div>
                </div>
            </div>

            {/* Phones: total + Book button stuck to the bottom of the screen */}
            <AnimatePresence>
                {!isBookButtonVisible && (
                    <motion.div
                        key="booking-bar"
                        initial={{ y: 24, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 24, opacity: 0 }}
                        transition={baseTransition}
                        className="fixed inset-x-3 bottom-3 z-30 flex items-center gap-3 rounded-2xl border bg-card/95 p-3 shadow-lift backdrop-blur lg:hidden"
                    >
                        <div className="min-w-0 flex-1">
                            <div className="text-caption text-muted-foreground">
                                {result?.available ? 'Total' : 'From'}
                            </div>
                            <div className="text-h3 font-bold">
                                {result?.available ? (
                                    <AnimatedNumber
                                        value={result.total_amount}
                                        format={ringgit}
                                    />
                                ) : (
                                    `${ringgitShort(vehicle.price_per_day)} / day`
                                )}
                            </div>
                        </div>
                        <Button
                            onClick={() =>
                                canBook
                                    ? setIsReviewOpen(true)
                                    : goToBookButton()
                            }
                        >
                            {canBook ? 'Book now' : 'Choose dates'}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Room so the bar never covers the end of the page */}
            <div className="h-20 lg:hidden" aria-hidden />

            {/* Review before confirming */}
            <Dialog
                open={isReviewOpen}
                onOpenChange={(open) => !processing && setIsReviewOpen(open)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Review your booking</DialogTitle>
                        <DialogDescription>
                            Please check the details. You can still cancel
                            later, until the day before pickup.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center gap-3 rounded-xl bg-surface-gradient p-3">
                        <div className="h-14 w-20 shrink-0">
                            <CarImage
                                src={vehicle.image_url}
                                alt={vehicle.name}
                            />
                        </div>
                        <div>
                            <div className="font-semibold">{vehicle.name}</div>
                            <div className="text-caption text-muted-foreground">
                                {vehicle.category} ·{' '}
                                {vehicle.transmission === 'Auto'
                                    ? 'Automatic'
                                    : 'Manual'}
                            </div>
                        </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm">
                        <ReviewItem label="Pickup">
                            {data.pickup_date && dayAndDate(data.pickup_date)}
                            {data.pickup_time && `, ${data.pickup_time}`}
                        </ReviewItem>
                        <ReviewItem label="Return">
                            {data.return_date && dayAndDate(data.return_date)}
                        </ReviewItem>
                        <ReviewItem label="Pickup location">
                            {data.pickup_location}
                        </ReviewItem>
                        <ReviewItem label="Payment">
                            {data.payment_method}
                        </ReviewItem>
                        {data.notes && (
                            <div className="col-span-2">
                                <ReviewItem label="Notes">
                                    {data.notes}
                                </ReviewItem>
                            </div>
                        )}
                    </dl>

                    {result?.available && (
                        <div className="space-y-2 rounded-xl bg-muted/60 p-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    {ringgit(vehicle.price_per_day)} ×{' '}
                                    {result.total_days} day
                                    {result.total_days === 1 ? '' : 's'}
                                </span>
                                <span>{ringgit(result.total_amount)}</span>
                            </div>
                            <div className="flex justify-between border-t border-dashed pt-2 text-base font-bold">
                                <span>Total</span>
                                <span>{ringgit(result.total_amount)}</span>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" disabled={processing}>
                                Edit details
                            </Button>
                        </DialogClose>
                        <Button onClick={confirmBooking} disabled={processing}>
                            {processing && <Spinner />}
                            {processing ? 'Booking…' : 'Confirm booking'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ReviewItem({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="min-w-0 rounded-lg border px-3 py-2">
            <dt className="text-caption text-muted-foreground">{label}</dt>
            <dd className="font-semibold">{children}</dd>
        </div>
    );
}

/** A numbered step heading ("1 Select dates") with optional icon and action. */
function Step({
    number,
    title,
    icon: Icon,
    action,
    children,
}: {
    number: number;
    title: string;
    icon?: LucideIcon;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section>
            <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground ring-1 ring-primary-border">
                        {number}
                    </span>
                    {title}
                    {Icon && <Icon className="size-4 text-muted-foreground" />}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}

/** "Pickup / Tue, 20 Oct" summary tile; the one being chosen next gets a blue outline. */
function DateTile({
    label,
    value,
    active,
}: {
    label: string;
    value: string;
    active: boolean;
}) {
    return (
        <div
            className={cn(
                'rounded-xl border px-3 py-2 transition-[border-color,background-color,box-shadow] duration-200',
                active
                    ? 'border-brand/50 bg-primary/50 ring-[3px] ring-brand/10'
                    : 'bg-muted/40',
            )}
        >
            <div className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </div>
            <div className="text-sm font-semibold">{value}</div>
        </div>
    );
}

CarShow.layout = {
    breadcrumbs: [
        { title: 'Browse cars', href: CarController.index() },
        // The last breadcrumb is shown as plain text, so its href is never used.
        { title: 'Book a car', href: '#' },
    ],
};
