<?php

namespace App\Models;

use Database\Factories\VehicleFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Vehicle extends Model
{
    /** @use HasFactory<VehicleFactory> */
    use HasFactory;

    /** Allowed values for the enum columns (must match the vehicles migration). */
    public const TRANSMISSIONS = ['Auto', 'Manual'];

    public const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];

    public const STATUSES = ['available', 'maintenance', 'inactive'];

    /** @var list<string> */
    protected $fillable = [
        'category_id',
        'brand',
        'model',
        'year',
        'plate_number',
        'color',
        'transmission',
        'fuel_type',
        'seats',
        'price_per_day',
        'image',
        'description',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'price_per_day' => 'decimal:2',
            'year' => 'integer',
            'seats' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /** e.g. "Perodua Myvi" */
    public function getFullNameAttribute(): string
    {
        return "{$this->brand} {$this->model}";
    }

    /**
     * Full URL of the photo, e.g. http://localhost:8000/storage/vehicles/abc.jpg
     * (needs `php artisan storage:link`). Use as $vehicle->image_url.
     */
    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? Storage::disk('public')->url($this->image) : null;
    }

    /**
     * Cars that can be rented for the given dates:
     * status is "available" AND no active booking overlaps the dates.
     *
     * Usage: Vehicle::availableBetween('2026-10-12', '2026-10-15')->get();
     */
    public function scopeAvailableBetween(Builder $query, string $pickupDate, string $returnDate): Builder
    {
        return $query->where('status', 'available')
            ->whereDoesntHave('bookings', function (Builder $bookings) use ($pickupDate, $returnDate) {
                $bookings->active()->overlapping($pickupDate, $returnDate);
            });
    }

    /** Check a single car, e.g. $vehicle->isAvailableBetween($pickup, $return) */
    public function isAvailableBetween(string $pickupDate, string $returnDate, ?int $ignoreBookingId = null): bool
    {
        return $this->status === 'available'
            && ! $this->bookings()
                ->active()
                ->overlapping($pickupDate, $returnDate)
                ->when($ignoreBookingId, fn ($q) => $q->where('id', '!=', $ignoreBookingId))
                ->exists();
    }
}
