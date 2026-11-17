import { Link, router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import NotificationController from '@/actions/App/Http/Controllers/NotificationController';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * The bell: unread count badge and the latest few notifications.
 * Opening one marks it read and goes to its page (NotificationController@open).
 */
export default function NotificationBell({
    className,
}: {
    className?: string;
}) {
    const { notifications } = usePage().props;

    if (!notifications) {
        return null;
    }

    const { unread, items } = notifications;

    function markAllRead() {
        router.post(
            NotificationController.readAll.url(),
            {},
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'relative flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                        className,
                    )}
                    aria-label={
                        unread > 0
                            ? `Notifications, ${unread} unread`
                            : 'Notifications'
                    }
                >
                    <Bell className="size-4.5" />
                    <AnimatePresence>
                        {unread > 0 && (
                            <motion.span
                                key="badge"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute top-1 right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-none font-bold text-white ring-2 ring-card"
                            >
                                {unread > 9 ? '9+' : unread}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-3 py-2.5">
                    <DropdownMenuLabel className="p-0 text-sm font-semibold">
                        Notifications
                    </DropdownMenuLabel>
                    {unread > 0 && (
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-tint-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                        >
                            <CheckCheck className="size-3.5" />
                            Mark all read
                        </button>
                    )}
                </div>
                <DropdownMenuSeparator className="m-0" />
                {items.length === 0 ? (
                    <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                        You're all caught up.
                    </p>
                ) : (
                    <div className="max-h-96 overflow-y-auto p-1">
                        {items.map((item) => (
                            <DropdownMenuItem
                                key={item.id}
                                asChild
                                className="items-start gap-3 rounded-md px-2.5 py-2.5"
                            >
                                <Link
                                    href={NotificationController.open.url(
                                        item.id,
                                    )}
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'mt-1.5 size-2 shrink-0 rounded-full',
                                            item.read
                                                ? 'bg-transparent'
                                                : 'bg-brand',
                                        )}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span
                                            className={cn(
                                                'block text-sm',
                                                item.read
                                                    ? 'font-medium text-muted-foreground'
                                                    : 'font-semibold text-foreground',
                                            )}
                                        >
                                            {item.title}
                                            {!item.read && (
                                                <span className="sr-only">
                                                    {' '}
                                                    (unread)
                                                </span>
                                            )}
                                        </span>
                                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                                            {item.message}
                                        </span>
                                        {item.time && (
                                            <span className="mt-1 block text-[11px] text-muted-foreground/80">
                                                {item.time}
                                            </span>
                                        )}
                                    </span>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
