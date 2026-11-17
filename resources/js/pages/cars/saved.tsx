import { Head, Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import CarController from '@/actions/App/Http/Controllers/CarController';
import FavouriteController from '@/actions/App/Http/Controllers/FavouriteController';
import EmptyState from '@/components/rentngo/empty-state';
import { Stagger } from '@/components/rentngo/motion';
import PageHeader from '@/components/rentngo/page-header';
import VehicleCard from '@/components/rentngo/vehicle-card';
import { Button } from '@/components/ui/button';
import { useSavedCars } from '@/hooks/use-saved-cars';
import type { CarCard } from '@/types';

/**
 * The cars a customer saved with the heart. Un-hearting a car here hides it
 * straight away (optimistic), and the next visit no longer lists it.
 */
export default function SavedCars({ vehicles }: { vehicles: CarCard[] }) {
    const { isSaved, toggle } = useSavedCars();
    const stillSaved = vehicles.filter((car) => isSaved(car.id));

    return (
        <>
            <Head title="Saved cars" />
            <PageHeader
                eyebrow="Your shortlist"
                title="Saved cars"
                description={
                    stillSaved.length > 0
                        ? `${stillSaved.length} car${stillSaved.length === 1 ? '' : 's'} saved to your account.`
                        : undefined
                }
                actions={
                    <Button variant="outline" asChild>
                        <Link href={CarController.index()}>Browse cars</Link>
                    </Button>
                }
            />

            {stillSaved.length === 0 ? (
                <EmptyState
                    className="mt-6"
                    icon={Heart}
                    title="No saved cars yet"
                    description="Tap the heart on any car to keep it here for later, on any device."
                    action={
                        <Button variant="brand" asChild>
                            <Link href={CarController.index()}>Find a car</Link>
                        </Button>
                    }
                />
            ) : (
                <Stagger className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {stillSaved.map((car) => (
                        <VehicleCard
                            key={car.id}
                            car={car}
                            href={CarController.show(car.id)}
                            isSaved
                            onToggleSave={toggle}
                        />
                    ))}
                </Stagger>
            )}
        </>
    );
}

SavedCars.layout = {
    breadcrumbs: [{ title: 'Saved cars', href: FavouriteController.index() }],
};
