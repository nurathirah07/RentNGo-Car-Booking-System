<?php

namespace App\Actions\Bookings;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\PaymentReceived;

/**
 * Marks a booking's payment as paid (admin at the counter, or the online gateway),
 * logs it and emails the customer. Safe to call twice: a payment that is already
 * paid is left alone, so a repeated gateway callback can't double-record it.
 */
class RecordPayment
{
    /** @return bool true if the payment was recorded now, false if there was nothing to do */
    public function handle(Booking $booking, string $transactionRef, ?User $actor = null, ?string $method = null): bool
    {
        $payment = $booking->payment;

        if (! $payment || $payment->status !== 'pending' || $booking->status === 'cancelled') {
            return false;
        }

        $payment->update(array_filter([
            'status' => 'paid',
            'paid_at' => now(),
            'transaction_ref' => $transactionRef,
            'method' => $method,
        ]));

        $who = $actor->name ?? 'Online payment';
        ActivityLog::record('payment.recorded', "{$who} recorded payment {$transactionRef} for booking {$booking->booking_ref}.", $booking, $actor);

        $booking->user->notify(new PaymentReceived($booking));

        return true;
    }
}
