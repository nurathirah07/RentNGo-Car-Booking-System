import { createInertiaApp } from '@inertiajs/react';
import { MotionConfig } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            // reducedMotion="user": when the OS asks for reduced motion, Framer Motion
            // skips movement (fades only) everywhere in the app.
            <MotionConfig reducedMotion="user">
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </MotionConfig>
        );
    },
    progress: {
        color: '#3D6AF2', // RentNGo blue loading bar at the top of the page
        delay: 150,
    },
});

// RentNGo is light-only: clear any old dark-mode setting on load.
initializeTheme();
