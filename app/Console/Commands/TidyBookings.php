<?php

namespace App\Console\Commands;

use App\Actions\Bookings\ChangeBookingStatus;
use App\Models\Booking;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Runs every hour (see routes/console.php):
 *  1. Cancels pending bookings that nobody confirmed within 24 hours, or whose
 *     pickup day has already passed, so the car is freed for other customers.
 *  2. Marks confirmed bookings as completed once their return date is over.
 * Each change is logged and the customer is notified (ChangeBookingStatus).
 */
#[Signature('bookings:tidy')]
#[Description('Cancel expired pending bookings and complete finished trips')]
class TidyBookings extends Command
{
    /** How long a booking may wait for an admin to confirm it. */
    public const PENDING_EXPIRY_HOURS = 24;

    public function handle(ChangeBookingStatus $changeStatus): int
    {
        $expired = Booking::query()
            ->where('status', 'pending')
            ->where(function ($query) {
                $query->where('created_at', '<=', now()->subHours(self::PENDING_EXPIRY_HOURS))
                    ->orWhereDate('pickup_date', '<', today());
            })
            ->with('user')
            ->get();

        foreach ($expired as $booking) {
            $changeStatus->handle(
                $booking,
                'cancelled',
                reason: 'It was not confirmed in time, so the car has been released.',
            );
        }

        $finished = Booking::query()
            ->where('status', 'confirmed')
            ->whereDate('return_date', '<', today())
            ->with('user')
            ->get();

        foreach ($finished as $booking) {
            $changeStatus->handle($booking, 'completed');
        }

        $this->info("Cancelled {$expired->count()} expired booking(s), completed {$finished->count()} trip(s).");

        return self::SUCCESS;
    }
}
