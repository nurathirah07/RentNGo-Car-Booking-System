import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

/**
 * Shows the server's flash messages ("Booking received!", "Vehicle deleted")
 * as toasts, and a toast when a request can't reach the server at all.
 */
export function useFlashToast(): void {
    useEffect(() => {
        const stopFlash = router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            toast[data.type](data.message);
        });

        const stopNetworkError = router.on('networkError', () => {
            toast.error(
                "Can't reach RentNGo right now. Check your connection and try again.",
            );
        });

        return () => {
            stopFlash();
            stopNetworkError();
        };
    }, []);
}
