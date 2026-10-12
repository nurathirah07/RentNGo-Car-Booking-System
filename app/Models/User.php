<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $role
 * @property string|null $phone
 * @property string|null $ic_number
 * @property string|null $license_number
 * @property Carbon|null $license_expiry
 * @property string|null $address
 * @property string $status
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
// "role" and "status" are deliberately NOT fillable, so nobody can make
// themselves an admin by adding role=admin to the register form.
#[Fillable(['name', 'email', 'password', 'phone', 'ic_number', 'license_number', 'license_expiry', 'address'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'license_expiry' => 'date:Y-m-d', // sent to the browser as 2029-01-01 (no time or timezone shift)
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isBlocked(): bool
    {
        return $this->status === 'blocked';
    }

    /** True when the customer has filled in everything needed to rent a car. */
    public function hasCompleteProfile(): bool
    {
        return filled($this->phone)
            && filled($this->ic_number)
            && filled($this->license_number)
            && $this->license_expiry !== null
            && $this->license_expiry->isFuture();
    }
}
