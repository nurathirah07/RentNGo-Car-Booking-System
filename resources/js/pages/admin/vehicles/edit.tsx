import { Head } from '@inertiajs/react';
import VehicleController from '@/actions/App/Http/Controllers/Admin/VehicleController';
import PageHeader from '@/components/rentngo/page-header';
import StatusBadge from '@/components/rentngo/status-badge';
import VehicleForm from '@/components/vehicle-form';
import type { EditableVehicle, VehicleFormOptions } from '@/types';

type EditVehicleProps = VehicleFormOptions & {
    vehicle: EditableVehicle;
};

export default function EditVehicle({ vehicle, ...options }: EditVehicleProps) {
    const name = `${vehicle.brand} ${vehicle.model}`;

    return (
        <>
            <Head title={`Edit ${name}`} />
            <PageHeader
                eyebrow="Fleet"
                title={`Edit ${name}`}
                description={
                    <span className="flex items-center gap-2">
                        <span className="font-mono">
                            {vehicle.plate_number}
                        </span>
                        <StatusBadge status={vehicle.status} />
                    </span>
                }
            />
            {/* key makes React rebuild the form if we navigate to another vehicle */}
            <VehicleForm key={vehicle.id} vehicle={vehicle} {...options} />
        </>
    );
}

EditVehicle.layout = {
    breadcrumbs: [
        { title: 'Vehicles', href: VehicleController.index() },
        // The last breadcrumb is shown as plain text, so its href is never used.
        { title: 'Edit vehicle', href: '#' },
    ],
};
