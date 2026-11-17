import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import CarImage from '@/components/rentngo/car-image';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Click the car photo to see it large in a dialog. The dialog closes with Esc,
 * the close button or a click outside. Pass `images` to page through a gallery
 * (arrow buttons or ← → keys), starting at `startIndex`. Without a photo there
 * is nothing to enlarge, so the children are shown as they are.
 */
export default function ImageLightbox({
    src,
    alt,
    images,
    startIndex = 0,
    children,
}: {
    src: string | null;
    alt: string;
    images?: string[];
    startIndex?: number;
    children: ReactNode;
}) {
    const photos = images && images.length > 0 ? images : src ? [src] : [];
    const [index, setIndex] = useState(startIndex);

    if (photos.length === 0) {
        return <>{children}</>;
    }

    const hasMany = photos.length > 1;
    const current = photos[Math.min(index, photos.length - 1)];

    function step(by: number) {
        setIndex((i) => (i + by + photos.length) % photos.length);
    }

    function handleKey(event: KeyboardEvent) {
        if (!hasMany) {
            return;
        }

        if (event.key === 'ArrowRight') {
            step(1);
        } else if (event.key === 'ArrowLeft') {
            step(-1);
        }
    }

    return (
        <Dialog onOpenChange={(open) => open && setIndex(startIndex)}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="group relative block w-full cursor-zoom-in rounded-2xl text-left focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    aria-label={`View a larger photo of the ${alt}`}
                >
                    {children}
                    <span className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full border bg-card/90 px-3 py-1.5 text-xs font-semibold opacity-0 shadow-soft backdrop-blur transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                        <Expand className="size-3.5" />
                        View larger
                    </span>
                </button>
            </DialogTrigger>
            <DialogContent
                onKeyDown={handleKey}
                className="max-w-[min(64rem,calc(100vw-2rem))] bg-hero-gradient p-4 sm:max-w-[min(64rem,calc(100vw-2rem))] sm:p-8"
            >
                <DialogTitle className="sr-only">{alt}</DialogTitle>
                <DialogDescription className="sr-only">
                    {hasMany
                        ? `Photo ${index + 1} of ${photos.length} of the ${alt}. Use the arrow keys to see the others.`
                        : `Larger photo of the ${alt}`}
                </DialogDescription>
                <div className="relative aspect-16/9 w-full">
                    <CarImage
                        key={current}
                        src={current}
                        alt={alt}
                        className="animate-in duration-300 fade-in"
                    />
                    {hasMany && (
                        <>
                            <LightboxArrow
                                side="left"
                                onClick={() => step(-1)}
                            />
                            <LightboxArrow
                                side="right"
                                onClick={() => step(1)}
                            />
                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold shadow-soft">
                                {index + 1} / {photos.length}
                            </span>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function LightboxArrow({
    side,
    onClick,
}: {
    side: 'left' | 'right';
    onClick: () => void;
}) {
    const Icon = side === 'left' ? ChevronLeft : ChevronRight;

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
            className={`absolute top-1/2 ${side === 'left' ? 'left-0' : 'right-0'} flex size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-card/90 shadow-soft transition-transform hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none`}
        >
            <Icon className="size-5" />
        </button>
    );
}
