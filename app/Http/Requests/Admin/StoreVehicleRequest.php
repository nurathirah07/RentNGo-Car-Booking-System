<?php

namespace App\Http\Requests\Admin;

use App\Models\Vehicle;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

/**
 * Validates the "Add vehicle" form.
 * Who may submit it is already checked by the EnsureUserIsAdmin middleware on the route group.
 */
class StoreVehicleRequest extends FormRequest
{
    /**
     * Clean the input before validating, so "wxa 1234 " and "WXA 1234" count as the same plate.
     */
    protected function prepareForValidation(): void
    {
        if ($this->filled('plate_number')) {
            $this->merge([
                'plate_number' => strtoupper(trim($this->input('plate_number'))),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'brand' => ['required', 'string', 'max:50'],
            'model' => ['required', 'string', 'max:50'],
            // Allow next year's models too (dealers sell them early).
            'year' => ['required', 'integer', 'between:2000,'.(now()->year + 1)],
            'plate_number' => ['required', 'string', 'max:15', $this->uniquePlateRule()],
            'color' => ['nullable', 'string', 'max:30'],
            // Rule::in() keeps the value inside the database enum, using the constants on the model.
            'transmission' => ['required', Rule::in(Vehicle::TRANSMISSIONS)],
            'fuel_type' => ['required', Rule::in(Vehicle::FUEL_TYPES)],
            'seats' => ['required', 'integer', 'between:2,15'],
            // decimal(8,2) column, so the biggest value it can hold is 999999.99.
            'price_per_day' => ['required', 'numeric', 'gt:0', 'max:999999.99'],
            'status' => ['required', Rule::in(Vehicle::STATUSES)],
            'description' => ['nullable', 'string', 'max:2000'],
            // Optional photo: only jpg/png/webp, max 2 MB (the max rule counts kilobytes for files).
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    /**
     * A new vehicle's plate must not exist yet. UpdateVehicleRequest overrides this.
     */
    protected function uniquePlateRule(): Unique
    {
        return Rule::unique('vehicles', 'plate_number');
    }

    /**
     * Friendlier messages for the rules admins hit most often.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'plate_number.unique' => 'Another vehicle already uses this plate number.',
            'category_id.required' => 'Please choose a category.',
            'image.max' => 'The image must not be larger than 2 MB.',
        ];
    }
}
