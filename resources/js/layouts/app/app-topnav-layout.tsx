import type { ReactNode } from 'react';
import { PageTransition } from '@/components/rentngo/motion';
import TopNav from '@/components/rentngo/top-nav';

/**
 * Customer layout: the frosted top bar, then the page content on the same width.
 * The top bar stays put between visits; only the page below fades out and in.
 */
export default function AppTopNavLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen">
            <a
                href="#main-content"
                className="sr-only rounded-lg bg-card px-4 py-2 text-sm font-semibold shadow-lift focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:ring-[3px] focus:ring-ring/50"
            >
                Skip to content
            </a>
            <div className="mx-auto w-full max-w-330 px-3 pt-3 pb-16 sm:px-4 sm:pt-4">
                <TopNav />
                <main
                    id="main-content"
                    tabIndex={-1}
                    className="mt-5 min-w-0 outline-none sm:mt-7"
                >
                    <PageTransition>{children}</PageTransition>
                </main>
            </div>
        </div>
    );
}
