import { Head, router } from '@inertiajs/react';
import { Lock, LockOpen, Search, X } from 'lucide-react';
import { useState } from 'react';
import CustomerController from '@/actions/App/Http/Controllers/Admin/CustomerController';
import Pagination from '@/components/pagination';
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
import SegmentedToggle from '@/components/rentngo/segmented-toggle';
import StatusBadge from '@/components/rentngo/status-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useInitials } from '@/hooks/use-initials';
import { useQueryFilters } from '@/hooks/use-query-filters';
import { cn } from '@/lib/utils';
import type { AdminCustomer, Paginated } from '@/types';

type Filters = {
    search: string;
    status: string;
};

type CustomersIndexProps = {
    customers: Paginated<AdminCustomer>;
    filters: Filters;
};

export default function AdminCustomersIndex({
    customers,
    filters,
}: CustomersIndexProps) {
    const {
        search,
        hasFilters,
        isLoading,
        applyFilters,
        handleSearchChange,
        clearFilters,
    } = useQueryFilters(CustomerController.index.url(), filters);
    const getInitials = useInitials();

    // Blocking logs the customer out immediately, so it asks for confirmation first.
    const [customerToBlock, setCustomerToBlock] =
        useState<AdminCustomer | null>(null);

    function setStatus(customer: AdminCustomer, status: 'active' | 'blocked') {
        router.patch(
            CustomerController.updateStatus.url(customer.id),
            { status },
            {
                preserveScroll: true,
                onFinish: () => setCustomerToBlock(null),
            },
        );
    }

    return (
        <>
            <Head title="Customers" />

            <PageHeader
                eyebrow="People"
                title="Customers"
                description={`${customers.total} registered customer${customers.total === 1 ? '' : 's'}`}
            />

            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-soft">
                <SegmentedToggle
                    label="Filter by status"
                    options={[
                        { value: 'all', label: 'All' },
                        { value: 'active', label: 'Active' },
                        { value: 'blocked', label: 'Blocked' },
                    ]}
                    value={filters.status || 'all'}
                    onChange={(value) =>
                        applyFilters({ status: value === 'all' ? '' : value })
                    }
                />

                <div className="relative min-w-0 flex-1 basis-60">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search name, email, phone or IC..."
                        className="pl-9"
                        aria-label="Search customers"
                    />
                </div>

                {hasFilters && (
                    <Button variant="ghost" onClick={clearFilters}>
                        <X />
                        Clear
                    </Button>
                )}
            </div>

            <TableCard className="mt-4 hidden md:block">
                <THead>
                    <Th>Customer</Th>
                    <Th>Phone</Th>
                    <Th>IC number</Th>
                    <Th>Driving license</Th>
                    <Th className="text-right">Bookings</Th>
                    <Th>Status</Th>
                    <Th className="text-right">
                        <span className="sr-only">Actions</span>
                    </Th>
                </THead>
                <tbody>
                    {isLoading ? (
                        <TableRowsSkeleton columns={7} />
                    ) : (
                        <>
                            {customers.data.length === 0 && (
                                <EmptyRow colSpan={7}>
                                    {hasFilters
                                        ? 'No customers match your filters.'
                                        : 'No customers have registered yet.'}
                                </EmptyRow>
                            )}

                            {customers.data.map((customer) => (
                                <Tr key={customer.id}>
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-9">
                                                <AvatarFallback className="bg-tint text-xs font-bold text-tint-foreground">
                                                    {getInitials(customer.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <div className="font-semibold">
                                                    {customer.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {customer.email} · joined{' '}
                                                    {customer.joined}
                                                </div>
                                            </div>
                                        </div>
                                    </Td>
                                    <Td className="whitespace-nowrap">
                                        {customer.phone ?? <Missing />}
                                    </Td>
                                    <Td className="font-mono text-xs whitespace-nowrap">
                                        {customer.ic_number ?? <Missing />}
                                    </Td>
                                    <Td className="whitespace-nowrap">
                                        {customer.license_number ?? <Missing />}
                                        {customer.license_expiry && (
                                            <div
                                                className={cn(
                                                    'text-xs',
                                                    customer.license_valid
                                                        ? 'text-muted-foreground'
                                                        : 'font-semibold text-danger',
                                                )}
                                            >
                                                {customer.license_valid
                                                    ? 'expires'
                                                    : 'expired'}{' '}
                                                {customer.license_expiry}
                                            </div>
                                        )}
                                    </Td>
                                    <Td className="text-right font-semibold">
                                        {customer.bookings_count}
                                    </Td>
                                    <Td>
                                        <StatusBadge status={customer.status} />
                                    </Td>
                                    <Td className="text-right">
                                        {customer.status === 'active' ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-destructive-foreground hover:border-destructive/40 hover:text-destructive-foreground"
                                                onClick={() =>
                                                    setCustomerToBlock(customer)
                                                }
                                            >
                                                <Lock />
                                                Block
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="tint"
                                                size="sm"
                                                onClick={() =>
                                                    setStatus(
                                                        customer,
                                                        'active',
                                                    )
                                                }
                                            >
                                                <LockOpen />
                                                Unblock
                                            </Button>
                                        )}
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
                ) : customers.data.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        {hasFilters
                            ? 'No customers match your filters.'
                            : 'No customers have registered yet.'}
                    </p>
                ) : (
                    customers.data.map((customer) => (
                        <MobileCard
                            key={customer.id}
                            title={customer.name}
                            subtitle={customer.email}
                            badge={<StatusBadge status={customer.status} />}
                            actions={
                                customer.status === 'active' ? (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            setCustomerToBlock(customer)
                                        }
                                    >
                                        <Lock />
                                        Block
                                    </Button>
                                ) : (
                                    <Button
                                        variant="tint"
                                        size="sm"
                                        onClick={() =>
                                            setStatus(customer, 'active')
                                        }
                                    >
                                        <LockOpen />
                                        Unblock
                                    </Button>
                                )
                            }
                        >
                            <MobileField label="Phone">
                                {customer.phone ?? '—'}
                            </MobileField>
                            <MobileField label="Bookings">
                                {customer.bookings_count}
                            </MobileField>
                            <MobileField label="IC number">
                                {customer.ic_number ?? '—'}
                            </MobileField>
                            <MobileField label="License">
                                {customer.license_expiry
                                    ? customer.license_valid
                                        ? `Valid to ${customer.license_expiry}`
                                        : `Expired ${customer.license_expiry}`
                                    : '—'}
                            </MobileField>
                        </MobileCard>
                    ))
                )}
            </MobileCards>

            <div className="mt-4">
                <Pagination paginator={customers} />
            </div>

            <Dialog
                open={customerToBlock !== null}
                onOpenChange={(open) => !open && setCustomerToBlock(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Block this customer?</DialogTitle>
                        <DialogDescription>
                            {customerToBlock?.name} will be logged out and
                            won&apos;t be able to log in or book until you
                            unblock them. Their existing bookings are not
                            changed. Cancel them from the Bookings page if
                            needed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                customerToBlock &&
                                setStatus(customerToBlock, 'blocked')
                            }
                        >
                            Block customer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

/** Shown when a customer hasn't filled in a detail yet. */
function Missing() {
    return <span className="text-xs text-muted-foreground">Not provided</span>;
}

AdminCustomersIndex.layout = {
    breadcrumbs: [{ title: 'Customers', href: CustomerController.index() }],
};
