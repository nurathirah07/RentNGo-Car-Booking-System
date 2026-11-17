<?php

namespace App\Notifications;

/** To the customer, right after booking. */
class BookingReceived extends BookingNotification
{
    protected function title(): string
    {
        return 'Booking received';
    }

    protected function message(): string
    {
        return "We've received booking {$this->booking->booking_ref}. We'll confirm it shortly.";
    }
}
