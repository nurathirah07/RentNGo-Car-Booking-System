import type { Auth } from '@/types/auth';
import type { SharedNotifications } from '@/types/notification';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            /** The bell menu; null when logged out. */
            notifications: SharedNotifications | null;
            /** Cars the logged-in customer saved (empty for admins and guests). */
            savedCarIds: number[];
            [key: string]: unknown;
        };
    }
}
