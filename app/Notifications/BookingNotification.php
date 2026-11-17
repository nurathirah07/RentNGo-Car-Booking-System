<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Base for every booking-related notification. Each one is:
 *  - saved in the database, so it shows in the bell menu, and
 *  - emailed (queued, so the page doesn't wait for the mail server).
 *
 * Children only say what the title, message and link are.
 */
abstract class BookingNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Booking $booking) {}

    abstract protected function title(): string;

    abstract protected function message(): string;

    /** Where the notification leads when clicked. */
    protected function url(): string
    {
        return route('bookings.index');
    }

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $booking = $this->booking->loadMissing('vehicle');

        return (new MailMessage)
            ->subject($this->title().' · '.$booking->booking_ref)
            ->greeting('Hi '.str($notifiable->name ?? '')->before(' ').',')
            ->line($this->message())
            ->line("**{$booking->vehicle->full_name}** · {$booking->pickup_date->format('d M Y')} – {$booking->return_date->format('d M Y')}")
            ->action('View booking', $this->url())
            ->salutation('RentNGo');
    }

    /**
     * What the bell menu shows.
     *
     * @return array{title: string, message: string, url: string, booking_ref: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title(),
            'message' => $this->message(),
            'url' => $this->url(),
            'booking_ref' => $this->booking->booking_ref,
        ];
    }
}
