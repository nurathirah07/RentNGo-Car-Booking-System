<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Vehicle;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Business reports: revenue per month, most booked cars, fleet utilisation, and a CSV export.
 *
 * Totals are grouped in PHP rather than with SQL date functions, so the same code
 * runs on MySQL (the app) and SQLite (the tests). The data set of a rental shop is small.
 */
class ReportController extends Controller
{
    /** How many days back the utilisation figure looks. */
    public const UTILISATION_DAYS = 30;

    public function index(): Response
    {
        return Inertia::render('admin/reports', [
            'monthlyRevenue' => $this->monthlyRevenue(),
            'topCars' => $this->topCars(),
            'utilisation' => $this->utilisation(),
            'summary' => [
                'revenueThisMonth' => (float) Payment::where('status', 'paid')
                    ->where('paid_at', '>=', now()->startOfMonth())
                    ->sum('amount'),
                'bookingsThisMonth' => Booking::where('created_at', '>=', now()->startOfMonth())->count(),
                'cancellationRate' => $this->cancellationRate(),
                'averageRentalDays' => round((float) Booking::where('status', '!=', 'cancelled')->avg('total_days'), 1),
            ],
        ]);
    }

    /** Every booking as a spreadsheet (opens in Excel or Google Sheets). */
    public function export(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');

            if ($out === false) {
                return;
            }

            fputcsv($out, ['Reference', 'Customer', 'Email', 'Car', 'Plate', 'Pickup', 'Return', 'Days', 'Subtotal (RM)', 'Discount (RM)', 'Total (RM)', 'Deposit (RM)', 'Late fee (RM)', 'Status', 'Payment', 'Paid at', 'Booked at']);

            Booking::with(['user:id,name,email', 'vehicle:id,brand,model,plate_number', 'payment'])
                ->orderBy('id')
                ->chunk(200, function ($bookings) use ($out) {
                    foreach ($bookings as $booking) {
                        fputcsv($out, [
                            $booking->booking_ref,
                            $booking->user->name,
                            $booking->user->email,
                            $booking->vehicle->full_name,
                            $booking->vehicle->plate_number,
                            $booking->pickup_date->toDateString(),
                            $booking->return_date->toDateString(),
                            $booking->total_days,
                            $booking->subtotal_amount,
                            $booking->discount_amount,
                            $booking->total_amount,
                            $booking->deposit_amount,
                            $booking->late_fee,
                            $booking->status,
                            $booking->payment?->status,
                            $booking->payment?->paid_at?->toDateTimeString(),
                            $booking->created_at?->toDateTimeString(),
                        ]);
                    }
                });

            fclose($out);
        }, 'rentngo-bookings-'.today()->toDateString().'.csv', ['Content-Type' => 'text/csv']);
    }

    /**
     * Paid revenue for each of the last 12 months, oldest first.
     *
     * @return array<int, array{month: string, label: string, revenue: float}>
     */
    private function monthlyRevenue(): array
    {
        $start = now()->startOfMonth()->subMonths(11);

        $totals = Payment::where('status', 'paid')
            ->where('paid_at', '>=', $start)
            ->get(['amount', 'paid_at'])
            ->groupBy(fn (Payment $payment): string => $payment->paid_at?->format('Y-m') ?? '')
            ->map(fn ($payments) => (float) $payments->sum('amount'));

        return collect(range(0, 11))
            ->map(function (int $offset) use ($start, $totals) {
                $month = $start->copy()->addMonths($offset);

                return [
                    'month' => $month->format('Y-m'),
                    'label' => $month->format('M'),
                    'revenue' => round($totals->get($month->format('Y-m'), 0.0), 2),
                ];
            })
            ->all();
    }

    /**
     * The five cars with the most (non-cancelled) bookings.
     *
     * @return array<int, array{id: int, name: string, plate: string, bookings: int, revenue: float}>
     */
    private function topCars(): array
    {
        $kept = fn ($query) => $query->where('status', '!=', 'cancelled');

        return Vehicle::query()
            ->withCount(['bookings' => $kept])
            ->withSum(['bookings' => $kept], 'total_amount')
            ->orderByDesc('bookings_count')
            ->take(5)
            ->get()
            ->filter(fn (Vehicle $vehicle) => $vehicle->getAttribute('bookings_count') > 0)
            ->map(fn (Vehicle $vehicle) => [
                'id' => $vehicle->id,
                'name' => $vehicle->full_name,
                'plate' => $vehicle->plate_number,
                'bookings' => (int) $vehicle->getAttribute('bookings_count'),
                'revenue' => (float) $vehicle->getAttribute('bookings_sum_total_amount'),
            ])
            ->values()
            ->all();
    }

    /**
     * Share of car-days that were rented over the last 30 days:
     * booked days of confirmed/completed bookings ÷ (cars in service × 30).
     *
     * @return array{percent: float, bookedDays: int, availableDays: int, days: int}
     */
    private function utilisation(): array
    {
        $from = today()->subDays(self::UTILISATION_DAYS - 1);
        $to = today();

        $bookedDays = Booking::whereIn('status', ['confirmed', 'completed'])
            ->overlapping($from->toDateString(), $to->toDateString())
            ->get(['pickup_date', 'return_date'])
            ->sum(function (Booking $booking) use ($from, $to) {
                // Only count the part of the booking that falls inside the window.
                $start = $booking->pickup_date->max($from);
                $end = $booking->return_date->min($to);

                return (int) Carbon::parse($start)->diffInDays(Carbon::parse($end)) + 1;
            });

        $availableDays = Vehicle::where('status', '!=', 'inactive')->count() * self::UTILISATION_DAYS;

        return [
            'percent' => $availableDays > 0 ? round($bookedDays / $availableDays * 100, 1) : 0.0,
            'bookedDays' => $bookedDays,
            'availableDays' => $availableDays,
            'days' => self::UTILISATION_DAYS,
        ];
    }

    private function cancellationRate(): float
    {
        $total = Booking::count();

        return $total > 0 ? round(Booking::where('status', 'cancelled')->count() / $total * 100, 1) : 0.0;
    }
}
