<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The audit trail: who did what and when (bookings, payments, cars, customers, reviews).
 */
class ActivityLogController extends Controller
{
    /** Filter chips: the first part of the action name, e.g. "booking" in "booking.confirmed". */
    public const AREAS = ['booking', 'payment', 'vehicle', 'customer', 'review'];

    public function __invoke(Request $request): Response
    {
        $filters = $request->validate([
            'area' => ['nullable', Rule::in(self::AREAS)],
        ]);

        $logs = ActivityLog::query()
            ->with('user:id,name,role')
            ->when($filters['area'] ?? null, fn ($query, string $area) => $query->where('action', 'like', $area.'.%'))
            ->latest('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (ActivityLog $log) => [
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'actor' => $log->user->name ?? 'System',
                'actor_role' => $log->user?->role,
                'time' => $log->created_at?->format('d M Y, g:i A'),
                'ago' => $log->created_at?->diffForHumans(),
            ]);

        return Inertia::render('admin/activity', [
            'logs' => $logs,
            'filters' => ['area' => $filters['area'] ?? ''],
            'areas' => self::AREAS,
        ]);
    }
}
