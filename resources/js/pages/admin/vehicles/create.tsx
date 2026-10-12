import { Head } from '@inertiajs/react';
import VehicleController from '@/actions/App/Http/Controllers/Admin/VehicleController';
import PageHeader from '@/components/rentngo/page-header';
import VehicleForm from '@/components/vehicle-form';
import type { VehicleFormOptions } from '@/types';

export default function CreateVehicle(props: VehicleFormOptions) {
    return (
        <>
            <Head title="Add vehicle" />
            <PageHeader
                eyebrow="Fleet"
                title="Add vehicle"
                description="Add a new car to the rental fleet."
            />
            <VehicleForm {...props} />
        </>
    );
}

CreateVehicle.layout = {
    breadcrumbs: [
        { title: 'Vehicles', href: VehicleController.index() },
        { title: 'Add vehicle', href: VehicleController.create() },
    ],
};
