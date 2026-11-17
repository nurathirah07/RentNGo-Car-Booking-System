<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            // The bell menu: unread count + the latest few (only loaded when logged in).
            'notifications' => fn () => $request->user() ? [
                'unread' => $request->user()->unreadNotifications()->count(),
                'items' => $request->user()->notifications()->latest()->take(6)->get()
                    ->map(fn (DatabaseNotification $notification) => [
                        'id' => $notification->id,
                        'title' => $notification->data['title'] ?? 'Update',
                        'message' => $notification->data['message'] ?? '',
                        'read' => $notification->read_at !== null,
                        'time' => $notification->created_at?->diffForHumans(),
                    ]),
            ] : null,
            // IDs of the cars this customer saved, so every heart icon knows its state.
            'savedCarIds' => fn () => $request->user() && ! $request->user()->isAdmin()
                ? $request->user()->favourites()->pluck('vehicles.id')
                : [],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
