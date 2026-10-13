import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge removes conflicting classes (e.g. "p-2 p-4" -> "p-4").
 * It doesn't know our custom utilities from app.css, and would otherwise
 * treat "text-caption" as a text COLOUR and drop it next to "text-foreground".
 * So we tell it which group each custom class belongs to.
 */
const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            'font-size': [
                {
                    text: [
                        'display',
                        'h1',
                        'h2',
                        'h3',
                        'body',
                        'caption',
                        'eyebrow',
                    ],
                },
            ],
            shadow: [{ shadow: ['soft', 'lift', 'glow'] }],
            'bg-image': [
                { bg: ['brand-gradient', 'hero-gradient', 'surface-gradient'] },
            ],
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}
