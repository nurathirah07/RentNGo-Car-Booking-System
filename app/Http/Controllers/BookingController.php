<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingRequest;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\Vehicle;
use App\Notifications\BookingReceived;
use App\Notifications\NewBookingForAdmin;
use App\Services\BookingPricing;
use App\Services\ToyyibPay;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A customer's own bookings: list, create and cancel.
 */
class BookingController extends Controller
{
    private const ALREADY_BOOKED = 'Sorry, this car has just been booked for some of these dates. Please choose different dates.';

    public function index(Request $request, ToyyibPay $toyyibPay): Response
    {
        $bookings = $request->user()->bookings() // only this customer's bookings
            ->with(['vehicle', 'payment', 'review'])
            ->latest('id')
            ->paginate(10)
            ->through(fn (Booking $booking) => [
                'id' => $booking->id,
                'ref' => $booking->booking_ref,
                'vehicle' => $booking->vehicle->full_name,
                'plate' => $booking->vehicle->plate_number,
                'image_url' => $booking->vehicle->image_url,
                'pickup' => $booking->pickup_date->format('d M Y'),
                'pickup_time' => $booking->pickupTimeLabel(),
                'return' => $booking->return_date->format('d M Y'),
                'total_days' => $booking->total_days,
                'price_per_day' => (float) $booking->price_per_day,
                'subtotal_amount' => (float) $booking->subtotal_amount,
                'discount_amount' => (float) $booking->discount_amount,
                'total_amount' => (float) $booking->total_amount,
                'deposit_amount' => (float) $booking->deposit_amount,
                'late_fee' => (float) $booking->late_fee,
                'pickup_location' => $booking->pickup_location,
                'status' => $booking->status,
                'payment_method' => $booking->payment?->method,
                'payment_status' => $booking->payment?->status,
                'can_cancel' => $booking->isCancellableByCustomer(),
                'can_pay' => in_array($booking->status, Booking::ACTIVE_STATUSES, true) && $booking->payment?->status === 'pending',
                'can_review' => $booking->status === 'completed' && $booking->review === null,
                'my_rating' => $booking->review?->rating,
            ]);

        return Inertia::render('bookings/index', [
            'bookings' => $bookings,
            // The "Pay online" button only shows once ToyyibPay keys are set in .env.
            'onlinePaymentEnabled' => $toyyibPay->isConfigured(),
        ]);
    }

    /**
     * Create a booking without ever double-booking a car.
     *
     * The problem: two customers submit the same car and dates at the same moment.
     * Both availability checks run before either booking is saved, so both pass.
     *
     * The fix:
     *  1. A database transaction: the booking and its payment are saved together, or not at all.
     *  2. lockForUpdate() locks the car's row. A second request for the SAME car waits
     *     here until the first one commits, then re-checks and sees the new booking.
     *  3. The MySQL trigger (see the add_booking_overlap_triggers migration) is a last
     *     safety net inside the database itself.
     */
    public function store(StoreBookingRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            $booking = DB::transaction(function () use ($data, $request) {
                $vehicle = Vehicle::whereKey($data['vehicle_id'])->lockForUpdate()->firstOrFail();

                if (! $vehicle->isAvailableBetween($data['pickup_date'], $data['return_date'])) {
                    throw ValidationException::withMessages(['pickup_date' => self::ALREADY_BOOKED]);
                }

                $price = BookingPricing::quote($vehicle, $data['pickup_date'], $data['return_date']);

                $booking = Booking::create([
                    'booking_ref' => Booking::temporaryRef(),
                    'user_id' => $request->user()->id,
                    'vehicle_id' => $vehicle->id,
                    'pickup_date' => $data['pickup_date'],
                    'pickup_time' => $data['pickup_time'],
                    'return_date' => $data['return_date'],
                    'pickup_location' => $data['pickup_location'],
                    'total_days' => $price['days'],
                    // The price is copied into the booking, so a later price change
                    // doesn't change what this customer pays.
                    'price_per_day' => $vehicle->price_per_day,
                    'subtotal_amount' => $price['subtotal'],
                    'discount_amount' => $price['discount'],
                    'total_amount' => $price['total'],
                    'deposit_amount' => $price['deposit'],
                    'status' => 'pending', // an admin confirms it
                    'notes' => $data['notes'] ?? null,
                ]);

                // The real reference is built from the id, so it can never clash.
                $booking->assignRef();

                Payment::create([
                    'booking_id' => $booking->id,
                    'amount' => $booking->total_amount,
                    'method' => $data['payment_method'],
                    'status' => 'pending', // marked paid by an admin when the money arrives
                ]);

                return $booking;
            });
        } catch (QueryException $exception) {
            // SQLSTATE 45000 is the error our overlap trigger raises.
            if ($exception->getCode() === '45000') {
                throw ValidationException::withMessages(['pickup_date' => self::ALREADY_BOOKED]);
            }

            throw $exception;
        }

        ActivityLog::record('booking.created', "{$request->user()->name} booked {$booking->booking_ref}.", $booking);
        $request->user()->notify(new BookingReceived($booking));
        Notification::send(User::where('role', 'admin')->get(), new NewBookingForAdmin($booking));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Booking {$booking->booking_ref} received! We'll confirm it shortly.",
        ]);

        return to_route('bookings.index');
    }

    public function cancel(Request $request, Booking $booking): RedirectResponse
    {
        // Someone else's booking answers 404; a booking past its pickup day explains why.
        $decision = Gate::inspect('cancel', $booking);

        if ($decision->status() === 404) {
            abort(404);
        }

        if ($decision->denied()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $decision->message()]);

            return back();
        }

        $booking->cancel();
        ActivityLog::record('booking.cancelled', "{$request->user()->name} cancelled their booking {$booking->booking_ref}.", $booking);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Booking {$booking->booking_ref} was cancelled."]);

        return back();
    }
}
