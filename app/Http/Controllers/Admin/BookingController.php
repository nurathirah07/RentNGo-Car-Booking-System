<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateBookingStatusRequest;
use App\Models\Booking;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin booking management: list/filter all bookings, move them through
 * pending → confirmed → completed (or cancelled), and record payments.
 */
class BookingController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'status' => (string) $request->query('status', ''),
        ];

        $bookings = Booking::query()
            ->with(['user:id,name,email,phone', 'vehicle:id,brand,model,plate_number', 'payment'])
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $term = '%'.$filters['search'].'%';

                // Match the booking ref, the customer or the car.
                $query->where(function (Builder $query) use ($term) {
                    $query->where('booking_ref', 'like', $term)
                        ->orWhereHas('user', fn (Builder $user) => $user->where('name', 'like', $term)->orWhere('email', 'like', $term))
                        ->orWhereHas('vehicle', fn (Builder $vehicle) => $vehicle->where('plate_number', 'like', $term)->orWhere('model', 'like', $term));
                });
            })
            ->when(in_array($filters['status'], Booking::STATUSES, true), fn (Builder $query) => $query->where('status', $filters['status']))
            ->latest('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Booking $booking) => [
                'id' => $booking->id,
                'ref' => $booking->booking_ref,
                'customer' => $booking->user->name,
                'customer_email' => $booking->user->email,
                'customer_phone' => $booking->user->phone,
                'vehicle' => $booking->vehicle->brand.' '.$booking->vehicle->model,
                'plate' => $booking->vehicle->plate_number,
                'pickup' => $booking->pickup_date->format('d M Y'),
                'pickup_time' => $booking->pickupTimeLabel(),
                'return' => $booking->return_date->format('d M Y'),
                'total_days' => $booking->total_days,
                'total_amount' => (float) $booking->total_amount,
                'pickup_location' => $booking->pickup_location,
                'notes' => $booking->notes,
                'status' => $booking->status,
                'payment_method' => $booking->payment?->method,
                'payment_status' => $booking->payment?->status,
                // The UI only offers the actions that are allowed right now.
                'next_statuses' => Booking::STATUS_TRANSITIONS[$booking->status],
                'can_mark_paid' => $booking->payment?->status === 'pending' && $booking->status !== 'cancelled',
            ]);

        return Inertia::render('admin/bookings/index', [
            'bookings' => $bookings,
            'filters' => $filters,
            'statuses' => Booking::STATUSES,
        ]);
    }

    public function updateStatus(UpdateBookingStatusRequest $request, Booking $booking): RedirectResponse
    {
        $newStatus = $request->validated('status');

        // e.g. a cancelled booking can't be confirmed again (see Booking::STATUS_TRANSITIONS).
        if (! $booking->canChangeStatusTo($newStatus)) {
            return $this->error("A {$booking->status} booking cannot be changed to {$newStatus}.");
        }

        if ($newStatus === 'completed' && $booking->pickup_date->isFuture()) {
            return $this->error('A booking cannot be completed before its pickup date.');
        }

        // cancel() also marks a paid payment as refunded.
        $newStatus === 'cancelled'
            ? $booking->cancel()
            : $booking->update(['status' => $newStatus]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Booking {$booking->booking_ref} is now {$newStatus}."]);

        return back();
    }

    /**
     * Record that the customer has paid (e.g. cash at the counter or a bank transfer was received).
     */
    public function markPaid(Booking $booking): RedirectResponse
    {
        $payment = $booking->payment;

        if (! $payment || $payment->status !== 'pending' || $booking->status === 'cancelled') {
            return $this->error('This booking has no pending payment.');
        }

        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
            'transaction_ref' => 'ADM'.now()->format('ymd').str_pad((string) $booking->id, 4, '0', STR_PAD_LEFT),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Payment for {$booking->booking_ref} recorded."]);

        return back();
    }

    private function error(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'error', 'message' => $message]);

        return back();
    }
}
