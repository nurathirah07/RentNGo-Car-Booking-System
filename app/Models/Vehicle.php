<?php

namespace App\Models;

use Database\Factories\VehicleFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property int $category_id
 * @property string $brand
 * @property string $model
 * @property int $year
 * @property string $plate_number
 * @property string|null $color
 * @property 'Auto'|'Manual' $transmission
 * @property 'Petrol'|'Diesel'|'Hybrid'|'Electric' $fuel_type
 * @property int $seats
 * @property string $price_per_day
 * @property string|null $image
 * @property string|null $description
 * @property 'available'|'maintenance'|'inactive' $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read string $full_name
 * @property-read string|null $image_url
 * @property-read Category $category
 */
class Vehicle extends Model
{
    /** @use HasFactory<VehicleFactory> */
    use HasFactory;

    /** Allowed values for the enum columns (must match the vehicles migration). */
    public const TRANSMISSIONS = ['Auto', 'Manual'];

    public const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];

    public const STATUSES = ['available', 'maintenance', 'inactive'];

    /** Most extra photos a car can have in its gallery. */
    public const MAX_GALLERY_IMAGES = 6;

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

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return HasMany<Booking, $this> */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Extra gallery photos, in display order.
     *
     * @return HasMany<VehicleImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(VehicleImage::class)->orderBy('position')->orderBy('id');
    }

    /** @return HasMany<Review, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
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
     *
     * @param  Builder<Vehicle>  $query
     * @return Builder<Vehicle>
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
