<?php

namespace App\Notifications;

/** To the customer, when their payment is recorded (online or by an admin). */
class PaymentReceived extends BookingNotification
{
    protected function title(): string
    {
        return 'Payment received';
    }

    protected function message(): string
    {
        $amount = number_format((float) $this->booking->total_amount, 2);

        return "We've received RM {$amount} for booking {$this->booking->booking_ref}. Your receipt is ready to download.";
    }
}
