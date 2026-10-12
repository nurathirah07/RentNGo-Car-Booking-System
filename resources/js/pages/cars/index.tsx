import { Head, usePage } from '@inertiajs/react';
import {
    ArrowDownWideNarrow,
    CarFront,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import CarController from '@/actions/App/Http/Controllers/CarController';
import { Stagger } from '@/components/rentngo/motion';
import { CarGridSkeleton } from '@/components/rentngo/skeletons';
import InputError from '@/components/input-error';
import Pagination from '@/components/pagination';
import EmptyState from '@/components/rentngo/empty-state';
import FilterChip from '@/components/rentngo/filter-chip';
import FilterSidebar from '@/components/rentngo/filter-sidebar';
import SegmentedToggle from '@/components/rentngo/segmented-toggle';
import VehicleCard from '@/components/rentngo/vehicle-card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { useSavedCars } from '@/hooks/use-saved-cars';
import { shortDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    BrowseFilters,
    CarCard,
    Category,
    Paginated,
    PriceStats,
} from '@/types';

type CarsIndexProps = {
    vehicles: Paginated<CarCard>;
    filters: BrowseFilters;
    categories: Category[];
    sorts: Record<string, string>;
    priceStats: PriceStats;
    today: string;
};

type ActiveFilter = {
    key: string;
    label: string;
    remove: Partial<BrowseFilters>;
};

export default function CarsIndex({
    vehicles,
    filters,
    categories,
    sorts,
    priceStats,
    today,
}: CarsIndexProps) {
    // Validation errors for bad dates come back as page props.
    const { errors } = usePage().props;
    const {
        search,
        isLoading,
        applyFilters,
        handleSearchChange,
        clearFilters,
    } = useQueryFilters(CarController.index.url(), filters);
    const { isSaved, toggle } = useSavedCars();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // desktop column
    const [isSheetOpen, setIsSheetOpen] = useState(false); // mobile slide-in

    const hasDates = filters.pickup_date !== '' && filters.return_date !== '';
    const activeFilters = describeFilters(filters, categories, priceStats);
    const sortValue = filters.sort || 'recommended';

    /** The Filter button: a slide-in sheet on small screens, show/hide the column on large ones. */
    function openFilters() {
        if (window.matchMedia('(min-width: 1024px)').matches) {
            setIsSidebarOpen(!isSidebarOpen);
        } else {
            setIsSheetOpen(true);
        }
    }

    /** "Available on my dates" without dates yet: open the filters and jump to the date picker. */
    function askForDates() {
        const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

        if (isDesktop) {
            setIsSidebarOpen(true);
        } else {
            setIsSheetOpen(true);
        }

        window.setTimeout(() => {
            document
                .getElementById(
                    isDesktop ? 'filter-pickup-date' : 'sheet-pickup-date',
                )
                ?.focus();
        }, 100);
    }

    const sidebarProps = {
        filters,
        categories,
        priceStats,
        today,
        onApply: applyFilters,
        onReset: clearFilters,
    };

    // Remount the panel when the URL filters change, so its local
    // date/price inputs always match what is applied.
    const sidebarKey = [
        filters.pickup_date,
        filters.return_date,
        filters.min_price,
        filters.max_price,
    ].join('|');

    return (
        <>
            <Head title="Browse cars" />

            {/* Toolbar: what to show, search, filter and sort */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-soft">
                <SegmentedToggle
                    label="Which cars to show"
                    options={[
                        { value: 'all', label: 'All cars' },
                        { value: 'dates', label: 'Available on my dates' },
                    ]}
                    value={hasDates ? 'dates' : 'all'}
                    onChange={(value) =>
                        value === 'all'
                            ? applyFilters({ pickup_date: '', return_date: '' })
                            : askForDates()
                    }
                    className="max-sm:flex-1 max-sm:[&>button]:flex-1 max-sm:[&>button]:px-2 max-sm:[&>button]:text-xs"
                />

                <div className="relative order-first min-w-0 basis-full sm:order-none sm:flex-1 sm:basis-56">
                    <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search car, brand or plate..."
                        aria-label="Search cars"
                        className="h-11 rounded-md pl-10"
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="h-11 max-sm:px-3"
                        onClick={openFilters}
                        aria-expanded={isSidebarOpen}
                    >
                        <SlidersHorizontal />
                        <span className="max-sm:sr-only">Filter</span>
                        {activeFilters.length > 0 && (
                            <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground">
                                {activeFilters.length}
                            </span>
                        )}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-11 max-sm:px-3"
                            >
                                <ArrowDownWideNarrow />
                                <span className="text-muted-foreground max-md:hidden">
                                    Sort by:
                                </span>
                                <span className="max-sm:sr-only">
                                    {sorts[sortValue]}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                Sort by
                            </DropdownMenuLabel>
                            <DropdownMenuRadioGroup
                                value={sortValue}
                                onValueChange={(value) =>
                                    applyFilters({
                                        sort:
                                            value === 'recommended'
                                                ? ''
                                                : value,
                                    })
                                }
                            >
                                {Object.entries(sorts).map(([value, label]) => (
                                    <DropdownMenuRadioItem
                                        key={value}
                                        value={value}
                                    >
                                        {label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div
                className={cn(
                    'mt-5 grid gap-5',
                    isSidebarOpen && 'lg:grid-cols-[300px_minmax(0,1fr)]',
                )}
            >
                {/* Desktop filter column */}
                {isSidebarOpen && (
                    <FilterSidebar
                        key={sidebarKey}
                        {...sidebarProps}
                        className="hidden self-start lg:sticky lg:top-4 lg:block"
                    />
                )}

                <section aria-labelledby="results-heading" className="min-w-0">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <h1 id="results-heading" className="text-h1">
                                {vehicles.total}{' '}
                                {vehicles.total === 1 ? 'Car' : 'Cars'} Found
                            </h1>
                            <p className="text-body text-muted-foreground">
                                {hasDates
                                    ? `Free from ${shortDate(filters.pickup_date)} to ${shortDate(filters.return_date, true)}`
                                    : 'Prices are per day. Pick your dates to see what is free.'}
                            </p>
                        </div>
                    </div>

                    <InputError
                        className="mt-2"
                        message={errors.pickup_date ?? errors.return_date}
                    />

                    {/* Active filter chips */}
                    {activeFilters.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {activeFilters.map((filter) => (
                                <FilterChip
                                    key={filter.key}
                                    label={filter.label}
                                    onRemove={() => applyFilters(filter.remove)}
                                />
                            ))}
                            {activeFilters.length > 1 && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="rounded-sm px-1 text-sm font-semibold text-tint-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    )}

                    {/* Car grid: skeleton cards while new results load */}
                    {isLoading ? (
                        <CarGridSkeleton
                            className="mt-5"
                            count={Math.min(
                                Math.max(vehicles.data.length, 3),
                                6,
                            )}
                        />
                    ) : vehicles.data.length === 0 ? (
                        <EmptyState
                            className="mt-5"
                            icon={CarFront}
                            title="No cars match your search"
                            description={
                                hasDates
                                    ? 'Every matching car is booked on these dates. Try other dates or remove a filter.'
                                    : 'Try removing a filter or searching for something else.'
                            }
                            action={
                                <Button onClick={clearFilters}>
                                    Reset filters
                                </Button>
                            }
                        />
                    ) : (
                        <Stagger className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {vehicles.data.map((car) => (
                                <VehicleCard
                                    key={car.id}
                                    car={car}
                                    // Carry the chosen dates over to the booking form.
                                    href={CarController.show(car.id, {
                                        query: hasDates
                                            ? {
                                                  pickup_date:
                                                      filters.pickup_date,
                                                  return_date:
                                                      filters.return_date,
                                              }
                                            : {},
                                    })}
                                    isSaved={isSaved(car.id)}
                                    onToggleSave={toggle}
                                />
                            ))}
                        </Stagger>
                    )}

                    <div className="mt-6">
                        <Pagination paginator={vehicles} />
                    </div>
                </section>
            </div>

            {/* Mobile filter sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent
                    side="left"
                    className="w-85 max-w-[90vw] gap-0 overflow-y-auto bg-background p-3 pb-0"
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>Filters</SheetTitle>
                        <SheetDescription>
                            Narrow down the cars by date, type, category and
                            price.
                        </SheetDescription>
                    </SheetHeader>
                    <FilterSidebar
                        key={sidebarKey}
                        {...sidebarProps}
                        idPrefix="sheet"
                        className="shadow-none"
                    />
                    {/* Sticky footer: always reachable, however long the filters get */}
                    <div className="sticky bottom-0 -mx-3 mt-3 flex gap-2 border-t bg-background/95 p-3 backdrop-blur">
                        <Button variant="outline" onClick={clearFilters}>
                            Reset
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={() => setIsSheetOpen(false)}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Spinner /> Updating…
                                </>
                            ) : (
                                `Show ${vehicles.total} ${vehicles.total === 1 ? 'car' : 'cars'}`
                            )}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

/** Turns the URL filters into removable chips, e.g. "Automatic ×", "RM 100 - RM 300 ×". */
function describeFilters(
    filters: BrowseFilters,
    categories: Category[],
    priceStats: PriceStats,
): ActiveFilter[] {
    const chips: ActiveFilter[] = [];

    if (filters.pickup_date && filters.return_date) {
        chips.push({
            key: 'dates',
            label: `${shortDate(filters.pickup_date)} – ${shortDate(filters.return_date, true)}`,
            remove: { pickup_date: '', return_date: '' },
        });
    }

    if (filters.search) {
        chips.push({
            key: 'search',
            label: `“${filters.search}”`,
            remove: { search: '' },
        });
    }

    const selected = filters.category ? filters.category.split(',') : [];
    selected.forEach((id) => {
        const category = categories.find((c) => String(c.id) === id);

        if (category) {
            chips.push({
                key: `category-${id}`,
                label: category.name,
                remove: {
                    category: selected
                        .filter((other) => other !== id)
                        .join(','),
                },
            });
        }
    });

    if (filters.transmission) {
        chips.push({
            key: 'transmission',
            label: filters.transmission === 'Auto' ? 'Automatic' : 'Manual',
            remove: { transmission: '' },
        });
    }

    if (filters.seats) {
        chips.push({
            key: 'seats',
            label: `${filters.seats}+ seats`,
            remove: { seats: '' },
        });
    }

    if (filters.min_price || filters.max_price) {
        const low = filters.min_price || String(priceStats.min);
        const high = filters.max_price || String(priceStats.max);

        chips.push({
            key: 'price',
            label: `RM ${low} - RM ${high}`,
            remove: { min_price: '', max_price: '' },
        });
    }

    if (filters.include_unavailable === '1') {
        chips.push({
            key: 'unavailable',
            label: 'Incl. in maintenance',
            remove: { include_unavailable: '' },
        });
    }

    return chips;
}

CarsIndex.layout = {
    breadcrumbs: [{ title: 'Browse cars', href: CarController.index() }],
};
