import { CarFront } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * RentNGo logo: a round blue-gradient badge with a car + the bold wordmark.
 * `tone="light"` is for dark backgrounds, `tone="dark"` for light ones.
 */
export default function Logo({
    tone = 'dark',
    showWordmark = true,
    className,
}: {
    tone?: 'light' | 'dark';
    showWordmark?: boolean;
    className?: string;
}) {
    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary-border bg-primary text-brand">
                <CarFront className="size-4.5" aria-hidden />
            </span>
            {showWordmark && (
                <span
                    className={cn(
                        'text-lg font-extrabold tracking-tight',
                        tone === 'light' ? 'text-white' : 'text-foreground',
                    )}
                >
                    Rent
                    <span
                        className={
                            tone === 'light' ? 'text-[#b8c8ff]' : 'text-brand'
                        }
                    >
                        N
                    </span>
                    Go
                </span>
            )}
        </span>
    );
}
