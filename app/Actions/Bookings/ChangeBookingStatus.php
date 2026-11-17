<?php

namespace App\Actions\Bookings;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingStatusChanged;
use App\Services\BookingPricing;

/**
 * The one place a booking's status changes (admin screen or the scheduled clean-up):
 * update it, record it in the audit log and tell the customer.
 */
class ChangeBookingStatus
{
    /**
     * @param  User|null  $actor  null when the system does it by itself
     * @param  int  $lateDays  only for "completed": how many days late the car came back
     */
    public function handle(Booking $booking, string $status, ?User $actor = null, ?string $reason = null, int $lateDays = 0): void
    {
        if ($status === 'cancelled') {
            $booking->cancel(); // also marks a paid payment as refunded
        } elseif ($status === 'completed') {
            $booking->update([
                'status' => 'completed',
                'late_days' => $lateDays,
                'late_fee' => BookingPricing::lateFee($booking, $lateDays),
            ]);
        } else {
            $booking->update(['status' => $status]);
        }

        $who = $actor->name ?? 'System';
        $extra = $status === 'completed' && $lateDays > 0
            ? " ({$lateDays} day".($lateDays === 1 ? '' : 's').' late, fee RM '.number_format((float) $booking->late_fee, 2).')'
            : '';
        ActivityLog::record("booking.{$status}", "{$who} marked booking {$booking->booking_ref} as {$status}{$extra}.", $booking, $actor);

        $booking->user->notify(new BookingStatusChanged($booking, $reason));
    }
}
