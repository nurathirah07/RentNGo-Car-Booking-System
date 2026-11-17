<?php

namespace App\Models;

use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $booking_ref
 * @property int $user_id
 * @property int $vehicle_id
 * @property Carbon $pickup_date
 * @property string|null $pickup_time
 * @property Carbon $return_date
 * @property string $pickup_location
 * @property int $total_days
 * @property string $price_per_day
 * @property string $subtotal_amount
 * @property string $discount_amount
 * @property string $total_amount
 * @property string $deposit_amount
 * @property int $late_days
 * @property string $late_fee
 * @property 'pending'|'confirmed'|'cancelled'|'completed' $status
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Vehicle $vehicle
 * @property-read Payment|null $payment
 * @property-read Review|null $review
 */
class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'booking_ref',
        'user_id',
        'vehicle_id',
        'pickup_date',
        'pickup_time',
        'return_date',
        'pickup_location',
        'total_days',
        'price_per_day',
        'subtotal_amount',
        'discount_amount',
        'total_amount',
        'deposit_amount',
        'late_days',
        'late_fee',
        'status',
        'notes',
    ];

    /** Statuses that block a car from being booked by someone else. */
    public const ACTIVE_STATUSES = ['pending', 'confirmed'];

    public const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

    public const PICKUP_LOCATIONS = ['RentNGo HQ, Shah Alam', 'KLIA Terminal 1', 'KL Sentral'];

    /** Pickup time slots shown on the booking page (our counters are open 9am to 6pm). */
    public const PICKUP_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

    /** Longest rental a customer can book online, in days. */
    public const MAX_DAYS = 30;

    /**
     * Which status changes the admin is allowed to make.
     * e.g. a cancelled or completed booking is final and can't change again.
     *
     * @var array<string, list<string>>
     */
    public const STATUS_TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['completed', 'cancelled'],
        'cancelled' => [],
        'completed' => [],
    ];

    protected function casts(): array
    {
        return [
            'pickup_date' => 'date',
            'return_date' => 'date',
            'price_per_day' => 'decimal:2',
            'subtotal_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'late_fee' => 'decimal:2',
            'late_days' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /** @return HasOne<Payment, $this> */
    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    /** @return HasOne<Review, $this> */
    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    /**
     * Only bookings that still hold the car.
     *
     * @param  Builder<Booking>  $query
     * @return Builder<Booking>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', self::ACTIVE_STATUSES);
    }

    /**
     * Two date ranges overlap when:
     * new pickup <= existing return  AND  new return >= existing pickup
     *
     * @param  Builder<Booking>  $query
     * @return Builder<Booking>
     */
    public function scopeOverlapping(Builder $query, string $pickupDate, string $returnDate): Builder
    {
        return $query->whereDate('pickup_date', '<=', $returnDate)
            ->whereDate('return_date', '>=', $pickupDate);
    }

    /** "10:00" (the database stores "10:00:00"), or null for older bookings. */
    public function pickupTimeLabel(): ?string
    {
        return $this->pickup_time ? substr($this->pickup_time, 0, 5) : null;
    }

    public function canChangeStatusTo(string $status): bool
    {
        return in_array($status, self::STATUS_TRANSITIONS[$this->status], true);
    }

    /** Customers may cancel their own booking until the pickup day. */
    public function isCancellableByCustomer(): bool
    {
        return in_array($this->status, self::ACTIVE_STATUSES, true)
            && $this->pickup_date->isAfter(today());
    }

    /**
     * Cancel the booking. A payment that was already made is marked "refunded"
     * (the actual refund is handled by staff outside the system).
     */
    public function cancel(): void
    {
        $this->update(['status' => 'cancelled']);

        if ($this->payment?->status === 'paid') {
            $this->payment->update(['status' => 'refunded']);
        }
    }

    /** Inclusive day count: 12 Oct to 14 Oct = 3 days. */
    public static function countDays(string $pickupDate, string $returnDate): int
    {
        return (int) Carbon::parse($pickupDate)->diffInDays(Carbon::parse($returnDate)) + 1;
    }

    /** A unique placeholder reference, replaced by assignRef() once the booking has an id. */
    public static function temporaryRef(): string
    {
        return 'TMP-'.Str::upper(Str::random(16));
    }

    /**
     * Give the booking its real reference, e.g. RNG-20261012-0004, built from its own id.
     *
     * Using the id (unique by definition) instead of "highest id + 1" means two
     * customers booking at the same moment can never get the same reference.
     */
    public function assignRef(): void
    {
        $this->update([
            'booking_ref' => 'RNG-'.$this->pickup_date->format('Ymd').'-'.str_pad((string) $this->id, 4, '0', STR_PAD_LEFT),
        ]);
    }
}
