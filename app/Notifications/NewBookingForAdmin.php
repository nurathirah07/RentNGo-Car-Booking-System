<?php

namespace App\Notifications;

/** To every admin, when a customer makes a booking that needs confirming. */
class NewBookingForAdmin extends BookingNotification
{
    protected function title(): string
    {
        return 'New booking to confirm';
    }

    protected function message(): string
    {
        $booking = $this->booking->loadMissing(['user', 'vehicle']);

        return "{$booking->user->name} booked the {$booking->vehicle->full_name} ({$booking->booking_ref}).";
    }

    protected function url(): string
    {
        return route('admin.bookings.index', ['status' => 'pending']);
    }
}
