import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const STARS = [1, 2, 3, 4, 5];

const LABELS: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very good',
    5: 'Excellent',
};

/** Read-only stars, e.g. ★★★★☆ for 4.2 (rounded to the nearest whole star). */
export function StarRating({
    rating,
    className,
}: {
    rating: number;
    className?: string;
}) {
    const filled = Math.round(rating);

    return (
        <span
            className={cn('inline-flex items-center gap-0.5', className)}
            role="img"
            aria-label={`${rating} out of 5 stars`}
        >
            {STARS.map((star) => (
                <Star
                    key={star}
                    aria-hidden
                    className={cn(
                        'size-4',
                        star <= filled
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-muted text-muted-foreground/30',
                    )}
                />
            ))}
        </span>
    );
}

/**
 * Pick 1-5 stars. A radio group underneath, so it works with the keyboard
 * (arrow keys) and screen readers; hovering previews the choice.
 */
export function StarInput({
    value,
    onChange,
    name = 'rating',
}: {
    value: number;
    onChange: (rating: number) => void;
    name?: string;
}) {
    const [hovered, setHovered] = useState(0);
    const shown = hovered || value;

    return (
        <div className="flex items-center gap-3">
            <div
                role="radiogroup"
                aria-label="Your rating"
                className="flex"
                onMouseLeave={() => setHovered(0)}
            >
                {STARS.map((star) => (
                    <label
                        key={star}
                        onMouseEnter={() => setHovered(star)}
                        className="cursor-pointer rounded-md p-1 transition-transform duration-150 hover:scale-110 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
                    >
                        <input
                            type="radio"
                            name={name}
                            value={star}
                            checked={value === star}
                            onChange={() => onChange(star)}
                            className="sr-only"
                            aria-label={`${star} star${star === 1 ? '' : 's'}, ${LABELS[star]}`}
                        />
                        <Star
                            aria-hidden
                            className={cn(
                                'size-8 transition-colors',
                                star <= shown
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-muted text-muted-foreground/30',
                            )}
                        />
                    </label>
                ))}
            </div>
            <span
                className="text-sm font-semibold text-muted-foreground"
                aria-live="polite"
            >
                {shown ? LABELS[shown] : 'Tap a star'}
            </span>
        </div>
    );
}
