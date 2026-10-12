<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin customer management: search customers and block / unblock them.
 */
class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'status' => (string) $request->query('status', ''),
        ];

        $customers = User::query()
            ->where('role', 'customer') // admins are never listed or blocked here
            ->withCount('bookings') // adds bookings_count with one extra query, not one per row
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $term = '%'.$filters['search'].'%';

                $query->where(function (Builder $query) use ($term) {
                    $query->where('name', 'like', $term)
                        ->orWhere('email', 'like', $term)
                        ->orWhere('phone', 'like', $term)
                        ->orWhere('ic_number', 'like', $term);
                });
            })
            ->when(in_array($filters['status'], ['active', 'blocked'], true), fn (Builder $query) => $query->where('status', $filters['status']))
            ->latest('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $customer) => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'ic_number' => $customer->ic_number,
                'license_number' => $customer->license_number,
                'license_expiry' => $customer->license_expiry?->format('d M Y'),
                'license_valid' => $customer->license_expiry?->isFuture() ?? false,
                'status' => $customer->status,
                'bookings_count' => $customer->bookings_count,
                'joined' => $customer->created_at->format('d M Y'),
            ]);

        return Inertia::render('admin/customers/index', [
            'customers' => $customers,
            'filters' => $filters,
        ]);
    }

    public function updateStatus(Request $request, User $user): RedirectResponse
    {
        // Admin accounts can't be blocked from this screen.
        abort_if($user->isAdmin(), 404);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'blocked'])],
        ]);

        // "status" is not mass-assignable (so customers can't unblock themselves),
        // so it is set explicitly with forceFill.
        $user->forceFill(['status' => $validated['status']])->save();

        $message = $validated['status'] === 'blocked'
            ? "{$user->name} has been blocked and can no longer log in."
            : "{$user->name} has been unblocked.";

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
