<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

/**
 * Validates the "Edit vehicle" form.
 * Same rules as creating a vehicle, except the unique plate check
 * must skip the vehicle being edited (otherwise saving without changing
 * the plate would fail with "already taken").
 */
class UpdateVehicleRequest extends StoreVehicleRequest
{
    protected function uniquePlateRule(): Unique
    {
        // $this->route('vehicle') is the Vehicle model from route model binding.
        return Rule::unique('vehicles', 'plate_number')->ignore($this->route('vehicle'));
    }
}
