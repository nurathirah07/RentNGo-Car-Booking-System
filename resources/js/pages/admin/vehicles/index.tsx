import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import VehicleController from '@/actions/App/Http/Controllers/Admin/VehicleController';
import Pagination from '@/components/pagination';
import CarImage from '@/components/rentngo/car-image';
import {
    EmptyRow,
    TableCard,
    Td,
    Th,
    THead,
    Tr,
    MobileCard,
    MobileCards,
    MobileField,
} from '@/components/rentngo/data-table';
import PageHeader from '@/components/rentngo/page-header';
import {
    MobileCardsSkeleton,
    TableRowsSkeleton,
} from '@/components/rentngo/skeletons';
import StatusBadge from '@/components/rentngo/status-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { ringgit } from '@/lib/format';
import type {
    Category,
    Paginated,
    VehicleListItem,
    VehicleStatus,
} from '@/types';

type Filters = {
    search: string;
    category: string;
    status: string;
};

type VehiclesIndexProps = {
    vehicles: Paginated<VehicleListItem>;
    filters: Filters;
    categories: Category[];
    statuses: VehicleStatus[];
};

/** Select needs a non-empty value, so "all" stands for "no filter". */
const ALL = 'all';

export default function VehiclesIndex({
    vehicles,
    filters,
    categories,
    statuses,
}: VehiclesIndexProps) {
    const {
        search,
        hasFilters,
        isLoading,
        applyFilters,
        handleSearchChange,
        clearFilters,
    } = useQueryFilters(VehicleController.index.url(), filters);

    const [vehicleToDelete, setVehicleToDelete] =
        useState<VehicleListItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    function confirmDelete() {
        if (!vehicleToDelete) {
            return;
        }

        router.delete(VehicleController.destroy.url(vehicleToDelete.id), {
            preserveScroll: true,
            onStart: () => setIsDeleting(true),
            onFinish: () => {
                setIsDeleting(false);
                setVehicleToDelete(null);
            },
        });
    }

    return (
        <>
            <Head title="Vehicles" />

            <PageHeader
                eyebrow="Fleet"
                title="Vehicles"
                description={`${vehicles.total} vehicle${vehicles.total === 1 ? '' : 's'} in the fleet`}
                actions={
                    <Button asChild>
                        <Link href={VehicleController.create()}>
                            <Plus />
                            Add vehicle
                        </Link>
                    </Button>
                }
            />

            {/* Search + filters */}
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-soft">
                <div className="relative min-w-0 flex-1 basis-60">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search brand, model or plate..."
                        className="pl-9"
                        aria-label="Search vehicles"
                    />
                </div>

                <Select
                    value={filters.category || ALL}
                    onValueChange={(value) =>
                        applyFilters({ category: value === ALL ? '' : value })
                    }
                >
                    <SelectTrigger className="w-44" aria-label="Category">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>All categories</SelectItem>
                        {categories.map((category) => (
                            <SelectItem
                                key={category.id}
                                value={String(category.id)}
                            >
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.status || ALL}
                    onValueChange={(value) =>
                        applyFilters({ status: value === ALL ? '' : value })
                    }
                >
                    <SelectTrigger className="w-40" aria-label="Status">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>All statuses</SelectItem>
                        {statuses.map((status) => (
                            <SelectItem
                                key={status}
                                value={status}
                                className="capitalize"
                            >
                                {status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasFilters && (
                    <Button variant="ghost" onClick={clearFilters}>
                        <X />
                        Clear
                    </Button>
                )}
            </div>

            <TableCard className="mt-4 hidden md:block">
                <THead>
                    <Th>Vehicle</Th>
                    <Th>Plate</Th>
                    <Th>Category</Th>
                    <Th className="text-right">Price / day</Th>
                    <Th>Status</Th>
                    <Th className="text-right">
                        <span className="sr-only">Actions</span>
                    </Th>
                </THead>
                <tbody>
                    {isLoading ? (
                        <TableRowsSkeleton columns={6} />
                    ) : (
                        <>
                            {vehicles.data.length === 0 && (
                                <EmptyRow colSpan={6}>
                                    {hasFilters
                                        ? 'No vehicles match your filters.'
                                        : 'No vehicles yet. Add your first car.'}
                                </EmptyRow>
                            )}

                            {vehicles.data.map((vehicle) => (
                                <Tr key={vehicle.id}>
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <div className="h-11 w-16 shrink-0 rounded-sm bg-surface-gradient p-1">
                                                <CarImage
                                                    src={vehicle.image_url}
                                                    alt={`${vehicle.brand} ${vehicle.model}`}
                                                />
                                            </div>
                                            <div>
                                                <div className="font-semibold">
                                                    {vehicle.brand}{' '}
                                                    {vehicle.model}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {vehicle.year}
                                                </div>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td className="font-mono text-xs whitespace-nowrap">
                                        {vehicle.plate_number}
                                    </Td>
                                    <Td>{vehicle.category}</Td>
                                    <Td className="text-right font-semibold whitespace-nowrap">
                                        {ringgit(vehicle.price_per_day)}
                                    </Td>
                                    <Td>
                                        <StatusBadge status={vehicle.status} />
                                    </Td>
                                    <Td>
                                        <div className="flex justify-end gap-1.5">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="tint"
                                                        size="icon-sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={VehicleController.edit(
                                                                vehicle.id,
                                                            )}
                                                            aria-label={`Edit ${vehicle.brand} ${vehicle.model}`}
                                                        >
                                                            <Pencil />
                                                        </Link>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Edit
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="bg-danger-tint text-danger hover:bg-danger-tint/70 hover:text-danger"
                                                        onClick={() =>
                                                            setVehicleToDelete(
                                                                vehicle,
                                                            )
                                                        }
                                                        aria-label={`Delete ${vehicle.brand} ${vehicle.model}`}
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Delete
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </>
                    )}
                </tbody>
            </TableCard>

            {/* Phones: each row as a card */}
            <MobileCards className="mt-4 md:hidden">
                {isLoading ? (
                    <MobileCardsSkeleton />
                ) : vehicles.data.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        {hasFilters
                            ? 'No vehicles match your filters.'
                            : 'No vehicles yet. Add your first car.'}
                    </p>
                ) : (
                    vehicles.data.map((vehicle) => (
                        <MobileCard
                            key={vehicle.id}
                            title={`${vehicle.brand} ${vehicle.model}`}
                            subtitle={`${vehicle.plate_number} · ${vehicle.category}`}
                            badge={<StatusBadge status={vehicle.status} />}
                            actions={
                                <>
                                    <Button variant="tint" size="sm" asChild>
                                        <Link
                                            href={VehicleController.edit(
                                                vehicle.id,
                                            )}
                                        >
                                            <Pencil />
                                            Edit
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            setVehicleToDelete(vehicle)
                                        }
                                    >
                                        <Trash2 />
                                        Delete
                                    </Button>
                                </>
                            }
                        >
                            <MobileField label="Price / day">
                                {ringgit(vehicle.price_per_day)}
                            </MobileField>
                            <MobileField label="Year">
                                {vehicle.year}
                            </MobileField>
                        </MobileCard>
                    ))
                )}
            </MobileCards>

            <div className="mt-4">
                <Pagination paginator={vehicles} />
            </div>

            {/* Delete confirmation. It is open whenever a vehicle is selected for deletion. */}
            <Dialog
                open={vehicleToDelete !== null}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setVehicleToDelete(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete this vehicle?</DialogTitle>
                        <DialogDescription>
                            {vehicleToDelete &&
                                `${vehicleToDelete.brand} ${vehicleToDelete.model} (${vehicleToDelete.plate_number}) will be permanently removed. `}
                            Vehicles with bookings cannot be deleted. Set them
                            to &quot;inactive&quot; instead.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isDeleting}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting…' : 'Delete vehicle'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

VehiclesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Vehicles',
            href: VehicleController.index(),
        },
    ],
};
