<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

/**
 * A printable PDF receipt of a booking, for the customer who made it or an admin.
 */
class ReceiptController extends Controller
{
    public function __invoke(Booking $booking): Response
    {
        Gate::authorize('view', $booking);

        $booking->load(['user', 'vehicle', 'payment']);

        return Pdf::loadView('pdf.receipt', ['booking' => $booking])
            ->setPaper('a4')
            ->download("RentNGo-{$booking->booking_ref}.pdf");
    }
}
