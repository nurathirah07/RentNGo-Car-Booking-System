import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Side-profile car photo (transparent PNG/WebP works best), shown with
 * object-contain so the whole car is visible. When there is no photo, or it
 * fails to load, a neutral car silhouette is shown instead.
 */
export default function CarImage({
    src,
    alt,
    className,
}: {
    src: string | null;
    alt: string;
    className?: string;
}) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return <CarSilhouette className={className} label={alt} />;
    }

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            onError={() => setFailed(true)}
            // multiply blends a photo's white background into the light tile behind it
            className={cn(
                'h-full w-full object-contain mix-blend-multiply',
                className,
            )}
        />
    );
}

/** Neutral side-view car outline used as the "no photo yet" placeholder. */
export function CarSilhouette({
    className,
    label,
}: {
    className?: string;
    label?: string;
}) {
    return (
        <svg
            viewBox="0 0 240 100"
            role="img"
            aria-label={label ? `${label} (no photo yet)` : 'Car'}
            className={cn('h-full w-full text-muted-foreground/35', className)}
        >
            <path
                fill="currentColor"
                d="M28 70c-6 0-10-3-10-8v-9c0-4 2-7 6-8l30-7 24-17c5-3 10-5 16-5h52c7 0 13 3 18 7l20 16 26 5c6 1 10 5 10 11v7c0 5-4 8-9 8h-7a22 22 0 0 0-43 0H82a22 22 0 0 0-43 0z"
            />
            <path
                fill="var(--card)"
                d="M86 39l14-14c3-3 7-4 11-4h17v18zm50 0V21h20c5 0 9 2 12 5l13 13z"
            />
            <circle cx="60.5" cy="72" r="15" fill="currentColor" />
            <circle cx="60.5" cy="72" r="6" fill="var(--card)" />
            <circle cx="173.5" cy="72" r="15" fill="currentColor" />
            <circle cx="173.5" cy="72" r="6" fill="var(--card)" />
        </svg>
    );
}
