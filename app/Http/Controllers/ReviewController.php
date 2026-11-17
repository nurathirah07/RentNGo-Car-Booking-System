<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReviewRequest;
use App\Models\ActivityLog;
use App\Models\Booking;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

/**
 * Star ratings customers leave after a completed trip.
 */
class ReviewController extends Controller
{
    public function store(StoreReviewRequest $request, Booking $booking): RedirectResponse
    {
        Gate::authorize('review', $booking);

        $review = $booking->review()->create([
            'user_id' => $request->user()->id,
            'vehicle_id' => $booking->vehicle_id,
            'rating' => $request->validated('rating'),
            'comment' => $request->validated('comment'),
        ]);

        ActivityLog::record('review.created', "{$request->user()->name} rated {$booking->booking_ref} {$review->rating}/5.", $review);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Thanks for your review!']);

        return back();
    }
}
