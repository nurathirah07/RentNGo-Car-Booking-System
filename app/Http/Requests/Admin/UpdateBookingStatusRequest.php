<?php

namespace App\Http\Requests\Admin;

use App\Models\Booking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookingStatusRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     * Whether the change is allowed from the CURRENT status is checked in the controller.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(Booking::STATUSES)],
            // Only when completing: how many days late the car was returned.
            'late_days' => ['nullable', 'integer', 'min:0', 'max:60'],
        ];
    }
}
