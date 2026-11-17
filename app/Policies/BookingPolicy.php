<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Who may do what with a booking.
 *
 * Someone else's booking answers 404 (not 403), so nobody can find out
 * which booking IDs exist by guessing URLs.
 */
class BookingPolicy
{
    /** Download the PDF receipt: the customer who booked it, or an admin. */
    public function view(User $user, Booking $booking): Response
    {
        return $user->isAdmin() || $this->owns($user, $booking)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    public function cancel(User $user, Booking $booking): Response
    {
        if (! $this->owns($user, $booking)) {
            return Response::denyAsNotFound();
        }

        return $booking->isCancellableByCustomer()
            ? Response::allow()
            : Response::deny('This booking can no longer be cancelled. Please contact RentNGo.');
    }

    /** Pay online: own booking, still active, payment not yet made. */
    public function pay(User $user, Booking $booking): Response
    {
        if (! $this->owns($user, $booking)) {
            return Response::denyAsNotFound();
        }

        return in_array($booking->status, Booking::ACTIVE_STATUSES, true) && $booking->payment?->status === 'pending'
            ? Response::allow()
            : Response::deny('This booking does not need a payment.');
    }

    /** Review the car: own booking, trip completed, not reviewed yet. */
    public function review(User $user, Booking $booking): Response
    {
        if (! $this->owns($user, $booking)) {
            return Response::denyAsNotFound();
        }

        if ($booking->status !== 'completed') {
            return Response::deny('You can review a car after your trip is completed.');
        }

        return $booking->review()->exists()
            ? Response::deny('You have already reviewed this trip.')
            : Response::allow();
    }

    private function owns(User $user, Booking $booking): bool
    {
        return $booking->user_id === $user->id;
    }
}
