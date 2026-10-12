import {
    Car,
    CarFront,
    ChevronDown,
    Gem,
    Mountain,
    Users,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import PriceRange from '@/components/rentngo/price-range';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { BrowseFilters, Category, PriceStats } from '@/types';

type FilterSidebarProps = {
    filters: BrowseFilters;
    categories: Category[];
    priceStats: PriceStats;
    today: string;
    /** Apply some filter changes (the page reloads the car list from the server). */
    onApply: (changes: Partial<BrowseFilters>) => void;
    onReset: () => void;
    /** Keeps input IDs unique when the panel is rendered twice (desktop + mobile sheet). */
    idPrefix?: string;
    className?: string;
};

/** A small icon for each category; unknown categories get a plain car. */
const categoryIcons: Record<string, LucideIcon> = {
    Compact: Car,
    Sedan: CarFront,
    SUV: Mountain,
    MPV: Users,
    Luxury: Gem,
};

const seatOptions = [
    { value: '', label: 'Any' },
    { value: '5', label: '5+' },
    { value: '7', label: '7+' },
];

/**
 * The white filter panel on the left of the Browse page (and inside the
 * slide-in sheet on mobile). Most controls apply immediately; the dates wait
 * until both are picked and the price slider waits until you stop dragging.
 */
export default function FilterSidebar({
    filters,
    categories,
    priceStats,
    today,
    onApply,
    onReset,
    idPrefix = 'filter',
    className,
}: FilterSidebarProps) {
    const [pickupDate, setPickupDate] = useState(filters.pickup_date);
    const [returnDate, setReturnDate] = useState(filters.return_date);
    const [price, setPrice] = useState<[number, number]>([
        filters.min_price ? Number(filters.min_price) : priceStats.min,
        filters.max_price ? Number(filters.max_price) : priceStats.max,
    ]);
    const priceTimer = useRef<number | undefined>(undefined);

    const hasDates = filters.pickup_date !== '' && filters.return_date !== '';
    const selectedCategories =
        filters.category === '' ? [] : filters.category.split(',');

    function changeDates(nextPickup: string, nextReturn: string) {
        // Keep the return date on or after the pickup date.
        const fixedReturn =
            nextReturn && nextReturn < nextPickup ? nextPickup : nextReturn;

        setPickupDate(nextPickup);
        setReturnDate(fixedReturn);

        // The server needs both dates, so wait for the second one.
        if (nextPickup && fixedReturn) {
            onApply({ pickup_date: nextPickup, return_date: fixedReturn });
        }
    }

    function clearDates() {
        setPickupDate('');
        setReturnDate('');
        onApply({ pickup_date: '', return_date: '' });
    }

    function toggleCategory(categoryId: string, checked: boolean) {
        const next = checked
            ? [...selectedCategories, categoryId]
            : selectedCategories.filter((id) => id !== categoryId);

        onApply({ category: next.join(',') });
    }

    /** Wait until the slider stops moving for 400ms, then reload (debounce). */
    function changePrice(next: [number, number]) {
        setPrice(next);
        window.clearTimeout(priceTimer.current);
        priceTimer.current = window.setTimeout(() => {
            onApply({
                // The full range means "no price filter", so leave it out of the URL.
                min_price: next[0] > priceStats.min ? String(next[0]) : '',
                max_price: next[1] < priceStats.max ? String(next[1]) : '',
            });
        }, 400);
    }

    return (
        <aside
            className={cn(
                'rounded-xl border bg-card p-5 shadow-soft',
                className,
            )}
            aria-label="Filters"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Filter</h2>
                <button
                    type="button"
                    onClick={onReset}
                    className="rounded-sm text-sm font-semibold text-danger hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                    Reset
                </button>
            </div>

            <div className="mt-4 space-y-6">
                {/* Available only */}
                <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-3">
                    <div>
                        <Label
                            htmlFor={`${idPrefix}-available-only`}
                            className="font-semibold"
                        >
                            Available only
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            {hasDates
                                ? 'Always on when dates are chosen'
                                : 'Hide cars in the workshop'}
                        </p>
                    </div>
                    <Switch
                        id={`${idPrefix}-available-only`}
                        checked={
                            hasDates || filters.include_unavailable !== '1'
                        }
                        disabled={hasDates}
                        onChange={(checked) =>
                            onApply({ include_unavailable: checked ? '' : '1' })
                        }
                    />
                </div>

                {/* Rental dates */}
                <Section
                    title="Rental dates"
                    action={
                        hasDates && (
                            <button
                                type="button"
                                onClick={clearDates}
                                className="flex items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                            >
                                <X className="size-3.5" />
                                Clear
                            </button>
                        )
                    }
                >
                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor={`${idPrefix}-pickup-date`}
                                className="text-xs text-muted-foreground"
                            >
                                Pickup
                            </Label>
                            <Input
                                id={`${idPrefix}-pickup-date`}
                                type="date"
                                min={today}
                                value={pickupDate}
                                onChange={(e) =>
                                    changeDates(e.target.value, returnDate)
                                }
                                className="px-2 text-sm"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label
                                htmlFor={`${idPrefix}-return-date`}
                                className="text-xs text-muted-foreground"
                            >
                                Return
                            </Label>
                            <Input
                                id={`${idPrefix}-return-date`}
                                type="date"
                                min={pickupDate || today}
                                value={returnDate}
                                onChange={(e) =>
                                    changeDates(pickupDate, e.target.value)
                                }
                                className="px-2 text-sm"
                            />
                        </div>
                    </div>
                </Section>

                {/* Type of car: automatic or manual */}
                <Section title="Type of car">
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: 'Auto', label: 'Automatic' },
                            { value: 'Manual', label: 'Manual' },
                        ].map((option) => {
                            const isActive =
                                filters.transmission === option.value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() =>
                                        onApply({
                                            transmission: isActive
                                                ? ''
                                                : option.value,
                                        })
                                    }
                                    className={cn(
                                        'h-10 rounded-md border text-sm font-semibold transition-colors duration-150',
                                        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                                        isActive
                                            ? 'border-primary-border bg-primary text-primary-foreground'
                                            : 'bg-card text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </Section>

                {/* Categories */}
                <Section title="Category">
                    <ul className="space-y-1">
                        {categories.map((category) => {
                            const id = String(category.id);
                            const Icon = categoryIcons[category.name] ?? Car;
                            const checkboxId = `${idPrefix}-category-${id}`;

                            return (
                                <li key={id}>
                                    <label
                                        htmlFor={checkboxId}
                                        className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 text-sm hover:bg-muted"
                                    >
                                        <Checkbox
                                            id={checkboxId}
                                            checked={selectedCategories.includes(
                                                id,
                                            )}
                                            onCheckedChange={(checked) =>
                                                toggleCategory(
                                                    id,
                                                    checked === true,
                                                )
                                            }
                                        />
                                        <Icon className="size-4 text-muted-foreground" />
                                        <span className="font-medium">
                                            {category.name}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </Section>

                {/* Price range */}
                {priceStats.histogram.length > 0 && (
                    <Section title="Price range per day">
                        <PriceRange
                            stats={priceStats}
                            value={price}
                            onChange={changePrice}
                        />
                    </Section>
                )}

                {/* More: less common filters */}
                <Collapsible defaultOpen={filters.seats !== ''}>
                    <CollapsibleTrigger className="group flex items-center gap-1 rounded-sm text-sm font-semibold text-tint-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                        More
                        <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden pt-4 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                        <Section title="Seats">
                            <div className="flex gap-2">
                                {seatOptions.map((option) => {
                                    const isActive =
                                        filters.seats === option.value;

                                    return (
                                        <button
                                            key={option.label}
                                            type="button"
                                            aria-pressed={isActive}
                                            onClick={() =>
                                                onApply({ seats: option.value })
                                            }
                                            className={cn(
                                                'h-8 rounded-full border px-4 text-sm font-semibold transition-colors duration-150',
                                                'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                                                isActive
                                                    ? 'border-primary-border bg-primary text-primary-foreground'
                                                    : 'bg-card text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </Section>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </aside>
    );
}

function Section({
    title,
    action,
    children,
}: {
    title: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section>
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{title}</h3>
                {action}
            </div>
            {children}
        </section>
    );
}

/** Blue on/off switch (role="switch" so screen readers announce it as one). */
function Switch({
    id,
    checked,
    disabled = false,
    onChange,
}: {
    id: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <button
            id={id}
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150',
                'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
                checked ? 'bg-brand' : 'bg-border',
            )}
        >
            <span
                className={cn(
                    'inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-150',
                    checked ? 'translate-x-[22px]' : 'translate-x-0.5',
                )}
            />
        </button>
    );
}
