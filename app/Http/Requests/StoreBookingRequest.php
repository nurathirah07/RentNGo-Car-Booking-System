<?php

namespace App\Http\Requests;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Validates the "Book this car" form. The date rules come from CheckAvailabilityRequest.
 * Whether the car is actually free is checked in BookingController@store,
 * inside a database transaction (see the comments there).
 */
class StoreBookingRequest extends CheckAvailabilityRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'vehicle_id' => ['required', 'integer', 'exists:vehicles,id'],
            'pickup_time' => ['required', Rule::in(Booking::PICKUP_TIMES)],
            'pickup_location' => ['required', Rule::in(Booking::PICKUP_LOCATIONS)],
            'payment_method' => ['required', Rule::in(Payment::METHODS)],
            'notes' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            ...parent::after(),
            // A pickup time earlier today is already over.
            function (Validator $validator) {
                if ($validator->errors()->hasAny(['pickup_date', 'pickup_time'])) {
                    return;
                }

                if ($this->input('pickup_date') === today()->toDateString() && $this->input('pickup_time') <= now()->format('H:i')) {
                    $validator->errors()->add('pickup_time', 'That pickup time has already passed today. Please choose a later time.');
                }
            },
            // A rental company must know who is driving: IC + valid license are required.
            function (Validator $validator) {
                if (! $this->user()->hasCompleteProfile()) {
                    $validator->errors()->add('profile', 'Please complete your phone, IC and driving license details in your profile before booking.');
                }
            },
        ];
    }
}
