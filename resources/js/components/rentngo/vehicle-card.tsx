import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import CarImage from '@/components/rentngo/car-image';
import { Tag } from '@/components/rentngo/status-badge';
import { ringgitShort } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CarCard } from '@/types';

type VehicleCardProps = {
    car: CarCard;
    href: NonNullable<InertiaLinkProps['href']>;
    isSaved?: boolean;
    onToggleSave?: (carId: number) => void;
};

/** Picks the one tag shown at the bottom-left of the card. */
function cardTag(car: CarCard) {
    if (car.status === 'maintenance') {
        return <Tag tone="grey">Maintenance</Tag>;
    }

    if (car.is_popular) {
        return <Tag tone="red">Popular</Tag>;
    }

    if (car.year >= new Date().getFullYear() - 1) {
        return <Tag tone="green">New Arrival</Tag>;
    }

    return (
        <Tag tone="blue">
            {car.transmission === 'Auto' ? 'Automatic' : 'Manual'}
        </Tag>
    );
}

/**
 * The hero component of the Browse page: name + category, a big side-profile
 * photo, one tag and the daily price. The whole card is clickable (the name
 * link is stretched over it), while the heart button stays separately clickable.
 */
export default function VehicleCard({
    car,
    href,
    isSaved = false,
    onToggleSave,
}: VehicleCardProps) {
    const unavailable = car.status === 'maintenance';

    return (
        <article
            className={cn(
                'group relative flex card-hover flex-col rounded-xl border bg-card p-4 shadow-soft',
                'focus-within:ring-[3px] focus-within:ring-ring/40',
                unavailable && 'opacity-70',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold">
                        <Link
                            href={href}
                            className="outline-none after:absolute after:inset-0 after:rounded-xl"
                        >
                            {car.name}
                        </Link>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {car.category} · {car.year} · {car.seats} seats
                    </p>
                </div>
                {onToggleSave && (
                    <button
                        type="button"
                        onClick={() => onToggleSave(car.id)}
                        aria-pressed={isSaved}
                        aria-label={
                            isSaved
                                ? `Remove ${car.name} from saved`
                                : `Save ${car.name}`
                        }
                        className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-md bg-tint text-tint-foreground transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-tint/70 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none active:scale-95"
                    >
                        <Heart
                            className={cn(
                                'size-4.5',
                                isSaved && 'fill-current',
                            )}
                        />
                    </button>
                )}
            </div>

            {/* Soft gradient stage for the car; the photo zooms a touch on hover */}
            <div className="my-3 h-[150px] overflow-hidden rounded-lg bg-surface-gradient px-2 py-3">
                <CarImage
                    src={car.image_url}
                    alt={car.name}
                    className="transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                />
            </div>

            <div className="mt-auto flex items-end justify-between gap-2">
                {cardTag(car)}
                <p className="text-right whitespace-nowrap">
                    <span className="text-xl font-bold tracking-tight">
                        {ringgitShort(car.price_per_day)}
                    </span>
                    <span className="text-xs text-muted-foreground">/day</span>
                </p>
            </div>
        </article>
    );
}
