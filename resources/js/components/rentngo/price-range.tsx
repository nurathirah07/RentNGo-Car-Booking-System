import { cn } from '@/lib/utils';
import type { PriceStats } from '@/types';

type PriceRangeProps = {
    stats: PriceStats;
    /** Selected [min, max] in RM per day */
    value: [number, number];
    onChange: (value: [number, number]) => void;
};

/**
 * "Price range per day": a small bar chart of how many cars sit at each price,
 * a two-handle slider underneath, and two boxes to type exact amounts.
 *
 * The slider is two native <input type="range"> laid on top of each other, so
 * it works with the keyboard (arrow keys) and screen readers out of the box.
 */
export default function PriceRange({
    stats,
    value,
    onChange,
}: PriceRangeProps) {
    const [low, high] = value;
    const span = Math.max(stats.max - stats.min, 1);
    const tallest = Math.max(...stats.histogram, 1);
    const bucketWidth = span / Math.max(stats.histogram.length, 1);

    // Position of each handle as a percentage of the track, for the blue fill.
    const lowPercent = ((low - stats.min) / span) * 100;
    const highPercent = ((high - stats.min) / span) * 100;

    function setLow(next: number) {
        onChange([Math.min(next, high), high]); // the handles can't cross
    }

    function setHigh(next: number) {
        onChange([low, Math.max(next, low)]);
    }

    return (
        <div className="space-y-3">
            {/* Histogram: bars inside the selected range are blue */}
            <div className="flex h-12 items-end gap-[3px]" aria-hidden>
                {stats.histogram.map((count, index) => {
                    const bucketStart = stats.min + index * bucketWidth;
                    const bucketEnd = bucketStart + bucketWidth;
                    const inRange = bucketEnd > low && bucketStart < high;

                    return (
                        <div
                            key={index}
                            className={cn(
                                'flex-1 rounded-t-[3px] transition-colors duration-150',
                                inRange ? 'bg-brand/45' : 'bg-muted',
                            )}
                            style={{
                                height: `${count === 0 ? 6 : 18 + (count / tallest) * 82}%`,
                            }}
                        />
                    );
                })}
            </div>

            {/* Dual-handle slider */}
            <div className="relative h-5">
                <div className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-muted" />
                <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand"
                    style={{
                        left: `${lowPercent}%`,
                        right: `${100 - highPercent}%`,
                    }}
                />
                <input
                    type="range"
                    min={stats.min}
                    max={stats.max}
                    step={10}
                    value={low}
                    onChange={(e) => setLow(Number(e.target.value))}
                    aria-label="Minimum price per day"
                    aria-valuetext={`RM ${low}`}
                    className="range-thumb absolute inset-0"
                />
                <input
                    type="range"
                    min={stats.min}
                    max={stats.max}
                    step={10}
                    value={high}
                    onChange={(e) => setHigh(Number(e.target.value))}
                    aria-label="Maximum price per day"
                    aria-valuetext={`RM ${high}`}
                    className="range-thumb absolute inset-0"
                />
            </div>

            {/* Exact amounts */}
            <div className="grid grid-cols-2 gap-3">
                <PriceBox
                    label="Min"
                    value={low}
                    onChange={(next) => setLow(Math.max(next, stats.min))}
                />
                <PriceBox
                    label="Max"
                    value={high}
                    onChange={(next) => setHigh(Math.min(next, stats.max))}
                />
            </div>
        </div>
    );
}

function PriceBox({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <label className="flex h-10 items-center gap-1.5 rounded-md border bg-card px-3 text-sm focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-muted-foreground">RM</span>
            <input
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full min-w-0 [appearance:textfield] bg-transparent font-semibold outline-none [&::-webkit-inner-spin-button]:appearance-none"
            />
        </label>
    );
}
