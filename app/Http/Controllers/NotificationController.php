<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * The bell menu: open a notification (marks it read and goes to its page),
 * or mark everything as read.
 */
class NotificationController extends Controller
{
    public function open(Request $request, string $notification): RedirectResponse
    {
        // Only the signed-in user's own notifications can be found here.
        $item = $request->user()->notifications()->findOrFail($notification);
        $item->markAsRead();

        $url = $item->data['url'] ?? route('dashboard');

        // Never follow a link that points to another website.
        return redirect()->to(str_starts_with($url, url('/')) ? $url : route('dashboard'));
    }

    public function readAll(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    }
}
