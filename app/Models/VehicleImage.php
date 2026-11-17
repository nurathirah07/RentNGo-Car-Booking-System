<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * One extra gallery photo of a car.
 *
 * @property int $id
 * @property int $vehicle_id
 * @property string $path
 * @property int $position
 * @property-read string $url
 */
class VehicleImage extends Model
{
    /** @var list<string> */
    protected $fillable = ['vehicle_id', 'path', 'position'];

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->path);
    }
}
