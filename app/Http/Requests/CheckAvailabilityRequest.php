<?php

namespace App\Http\Requests;

use App\Models\Booking;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * The pickup/return date rules. Used on its own by the live availability check,
 * and extended by StoreBookingRequest so both always validate dates the same way.
 */
class CheckAvailabilityRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'pickup_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'return_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:pickup_date'],
        ];
    }

    /**
     * Extra checks that need more than one field: the rental length limit.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                // Skip if the dates themselves are already invalid.
                if ($validator->errors()->hasAny(['pickup_date', 'return_date'])) {
                    return;
                }

                if (Booking::countDays($this->input('pickup_date'), $this->input('return_date')) > Booking::MAX_DAYS) {
                    $validator->errors()->add('return_date', 'You can book a car for up to '.Booking::MAX_DAYS.' days at a time.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'pickup_date.after_or_equal' => 'The pickup date cannot be in the past.',
            'return_date.after_or_equal' => 'The return date must be on or after the pickup date.',
        ];
    }
}
