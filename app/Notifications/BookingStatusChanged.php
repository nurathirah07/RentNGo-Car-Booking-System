<?php

namespace App\Notifications;

use App\Models\Booking;

/**
 * To the customer, when their booking is confirmed, cancelled or completed
 * (by an admin, or automatically by the scheduled clean-up).
 */
class BookingStatusChanged extends BookingNotification
{
    public function __construct(Booking $booking, public ?string $reason = null)
    {
        parent::__construct($booking);
    }

    protected function title(): string
    {
        return match ($this->booking->status) {
            'confirmed' => 'Booking confirmed',
            'cancelled' => 'Booking cancelled',
            'completed' => 'Trip completed',
            default => 'Booking updated',
        };
    }

    protected function message(): string
    {
        $ref = $this->booking->booking_ref;

        $message = match ($this->booking->status) {
            'confirmed' => "Your booking {$ref} is confirmed. See you at pickup!",
            'cancelled' => "Your booking {$ref} has been cancelled.",
            'completed' => "Thanks for driving with RentNGo! Booking {$ref} is complete. You can now leave a review.",
            default => "Booking {$ref} was updated.",
        };

        return $this->reason ? "{$message} {$this->reason}" : $message;
    }
}
