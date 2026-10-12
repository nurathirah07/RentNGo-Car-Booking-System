export type VehicleStatus = 'available' | 'maintenance' | 'inactive';

export type Category = {
    id: number;
    name: string;
};

/** One row of the admin vehicle table (built in VehicleController@index). */
export type VehicleListItem = {
    id: number;
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    category: string;
    price_per_day: number;
    status: VehicleStatus;
    image_url: string | null;
};

/** A vehicle loaded into the edit form (built in VehicleController@edit). */
export type EditableVehicle = {
    id: number;
    category_id: number;
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    color: string | null;
    transmission: string;
    fuel_type: string;
    seats: number;
    price_per_day: number;
    status: VehicleStatus;
    description: string | null;
    image_url: string | null;
};

/** Dropdown options the create and edit pages receive from the controller. */
export type VehicleFormOptions = {
    categories: Category[];
    transmissions: string[];
    fuelTypes: string[];
    statuses: VehicleStatus[];
};
