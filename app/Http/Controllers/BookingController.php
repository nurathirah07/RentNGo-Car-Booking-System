<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Vehicle;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A customer's own bookings: list, create and cancel.
 */
class BookingController extends Controller
{
    private const ALREADY_BOOKED = 'Sorry, this car has just been booked for some of these dates. Please choose different dates.';

    public function index(Request $request): Response
    {
        $bookings = $request->user()->bookings() // only this customer's bookings
            ->with(['vehicle', 'payment'])
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
                'total_amount' => (float) $booking->total_amount,
                'pickup_location' => $booking->pickup_location,
                'status' => $booking->status,
                'payment_method' => $booking->payment?->method,
                'payment_status' => $booking->payment?->status,
                'can_cancel' => $booking->isCancellableByCustomer(),
            ]);

        return Inertia::render('bookings/index', [
            'bookings' => $bookings,
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

                $totalDays = Booking::countDays($data['pickup_date'], $data['return_date']);

                $booking = Booking::create([
                    'booking_ref' => Booking::generateRef($data['pickup_date']),
                    'user_id' => $request->user()->id,
                    'vehicle_id' => $vehicle->id,
                    'pickup_date' => $data['pickup_date'],
                    'pickup_time' => $data['pickup_time'],
                    'return_date' => $data['return_date'],
                    'pickup_location' => $data['pickup_location'],
                    'total_days' => $totalDays,
                    // The price is copied into the booking, so a later price change
                    // doesn't change what this customer pays.
                    'price_per_day' => $vehicle->price_per_day,
                    'total_amount' => $totalDays * $vehicle->price_per_day,
                    'status' => 'pending', // an admin confirms it
                    'notes' => $data['notes'] ?? null,
                ]);

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

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Booking {$booking->booking_ref} received! We'll confirm it shortly.",
        ]);

        return to_route('bookings.index');
    }

    public function cancel(Request $request, Booking $booking): RedirectResponse
    {
        // Customers may only touch their own bookings. 404 (not 403) so nobody can
        // find out which booking IDs exist by guessing URLs.
        abort_unless($booking->user_id === $request->user()->id, 404);

        if (! $booking->isCancellableByCustomer()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'This booking can no longer be cancelled. Please contact RentNGo.']);

            return back();
        }

        $booking->cancel();

        Inertia::flash('toast', ['type' => 'success', 'message' => "Booking {$booking->booking_ref} was cancelled."]);

        return back();
    }
}
