<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Receipt {{ $booking->booking_ref }}</title>
    <style>
        /* dompdf supports CSS 2.1 only: no flexbox or grid, so the layout uses tables. */
        * { font-family: DejaVu Sans, sans-serif; }
        body { margin: 0; color: #0f172a; font-size: 12px; }
        .header { background: #3d6af2; color: #ffffff; padding: 28px 36px; }
        .brand { font-size: 22px; font-weight: bold; letter-spacing: 0.5px; }
        .muted { color: #64748b; }
        .header .muted { color: #dbe4ff; }
        .content { padding: 28px 36px; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #2450cf; margin: 24px 0 8px; }
        table { width: 100%; border-collapse: collapse; }
        .details td { padding: 4px 0; vertical-align: top; }
        .details td.label { width: 35%; color: #64748b; }
        .lines td { padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .lines td.amount { text-align: right; }
        .total td { padding-top: 12px; font-size: 15px; font-weight: bold; }
        .total td.amount { text-align: right; color: #2450cf; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: bold; }
        .paid { background: #dcfce7; color: #166534; }
        .pending { background: #fef3c7; color: #92400e; }
        .refunded { background: #fee2e2; color: #991b1b; }
        .footer { margin-top: 36px; font-size: 10px; color: #64748b; }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                <td>
                    <div class="brand">RentNGo</div>
                    <div class="muted">Car rental · Shah Alam, Selangor</div>
                </td>
                <td style="text-align: right;">
                    <div style="font-size: 16px; font-weight: bold;">Receipt</div>
                    <div class="muted">{{ $booking->booking_ref }}</div>
                    <div class="muted">Issued {{ now()->format('d M Y') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="content">
        <table>
            <tr>
                <td style="width: 50%; vertical-align: top;">
                    <h2>Billed to</h2>
                    <div><strong>{{ $booking->user->name }}</strong></div>
                    <div class="muted">{{ $booking->user->email }}</div>
                    @if ($booking->user->phone)
                        <div class="muted">{{ $booking->user->phone }}</div>
                    @endif
                </td>
                <td style="width: 50%; vertical-align: top;">
                    <h2>Payment</h2>
                    @php($paymentStatus = $booking->payment?->status ?? 'pending')
                    <span class="badge {{ $paymentStatus }}">{{ ucfirst($paymentStatus) }}</span>
                    <div class="muted" style="margin-top: 6px;">{{ $booking->payment?->method ?? 'Not chosen' }}</div>
                    @if ($booking->payment?->paid_at)
                        <div class="muted">Paid {{ $booking->payment->paid_at->format('d M Y, g:i A') }}</div>
                    @endif
                    @if ($booking->payment?->transaction_ref)
                        <div class="muted">Ref {{ $booking->payment->transaction_ref }}</div>
                    @endif
                </td>
            </tr>
        </table>

        <h2>Rental</h2>
        <table class="details">
            <tr><td class="label">Car</td><td>{{ $booking->vehicle->full_name }} ({{ $booking->vehicle->year }}) · {{ $booking->vehicle->plate_number }}</td></tr>
            <tr><td class="label">Pickup</td><td>{{ $booking->pickup_date->format('D, d M Y') }}{{ $booking->pickupTimeLabel() ? ' at '.$booking->pickupTimeLabel() : '' }}</td></tr>
            <tr><td class="label">Return</td><td>{{ $booking->return_date->format('D, d M Y') }}</td></tr>
            <tr><td class="label">Location</td><td>{{ $booking->pickup_location }}</td></tr>
            <tr><td class="label">Status</td><td>{{ ucfirst($booking->status) }}</td></tr>
        </table>

        <h2>Charges</h2>
        <table class="lines">
            <tr>
                <td>RM {{ number_format((float) $booking->price_per_day, 2) }} × {{ $booking->total_days }} day(s)</td>
                <td class="amount">RM {{ number_format((float) ($booking->subtotal_amount ?: $booking->total_amount), 2) }}</td>
            </tr>
            @if ((float) $booking->discount_amount > 0)
                <tr>
                    <td>Weekly discount (10%)</td>
                    <td class="amount">− RM {{ number_format((float) $booking->discount_amount, 2) }}</td>
                </tr>
            @endif
            @if ((float) $booking->late_fee > 0)
                <tr>
                    <td>Late return ({{ $booking->late_days }} day(s), charged separately)</td>
                    <td class="amount">RM {{ number_format((float) $booking->late_fee, 2) }}</td>
                </tr>
            @endif
        </table>
        <table class="total">
            <tr>
                <td>Rental total</td>
                <td class="amount">RM {{ number_format((float) $booking->total_amount, 2) }}</td>
            </tr>
        </table>

        @if ((float) $booking->deposit_amount > 0)
            <p class="muted" style="margin-top: 14px;">
                A refundable security deposit of <strong>RM {{ number_format((float) $booking->deposit_amount, 2) }}</strong>
                is collected at pickup and returned when the car comes back in good condition.
            </p>
        @endif

        <div class="footer">
            Thank you for renting with RentNGo. Questions about this receipt? Reply to your booking email
            and quote {{ $booking->booking_ref }}.
        </div>
    </div>
</body>
</html>
