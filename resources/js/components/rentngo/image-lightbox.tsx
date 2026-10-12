import { Expand } from 'lucide-react';
import type { ReactNode } from 'react';
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
 * the close button or a click outside. Without a photo there is nothing to
 * enlarge, so the children are shown as they are.
 */
export default function ImageLightbox({
    src,
    alt,
    children,
}: {
    src: string | null;
    alt: string;
    children: ReactNode;
}) {
    if (!src) {
        return <>{children}</>;
    }

    return (
        <Dialog>
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
            <DialogContent className="max-w-[min(64rem,calc(100vw-2rem))] bg-hero-gradient p-4 sm:max-w-[min(64rem,calc(100vw-2rem))] sm:p-8">
                <DialogTitle className="sr-only">{alt}</DialogTitle>
                <DialogDescription className="sr-only">
                    Larger photo of the {alt}
                </DialogDescription>
                <div className="aspect-16/9 w-full">
                    <CarImage src={src} alt={alt} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
