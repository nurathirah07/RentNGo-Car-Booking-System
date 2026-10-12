export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

/** A car card on the customer "Browse cars" page (CarController@index). */
export type CarCard = {
    id: number;
    name: string;
    year: number;
    category: string;
    transmission: string;
    fuel_type: string;
    seats: number;
    price_per_day: number;
    image_url: string | null;
    /** Only sent by the Browse page: "available" or "maintenance". */
    status?: 'available' | 'maintenance' | 'inactive';
    /** Only sent by the Browse page: booked at least twice. */
    is_popular?: boolean;
};

/** The Browse page filters, exactly as they appear in the URL (all strings, '' = not set). */
export type BrowseFilters = {
    search: string;
    pickup_date: string;
    return_date: string;
    /** Comma-separated category IDs, e.g. "1,3" */
    category: string;
    transmission: string;
    /** Minimum seats, e.g. "7" */
    seats: string;
    min_price: string;
    max_price: string;
    sort: string;
    /** "1" = also show cars in maintenance */
    include_unavailable: string;
};

/** Price slider data for the Browse page (CarController::priceStats). */
export type PriceStats = {
    min: number;
    max: number;
    histogram: number[];
};

/** A car on its booking page (CarController@show). */
export type CarDetails = CarCard & {
    color: string | null;
    description: string | null;
    is_rentable: boolean;
};

/** A row on the customer's "My bookings" page (BookingController@index). */
export type CustomerBooking = {
    id: number;
    ref: string;
    vehicle: string;
    plate: string;
    image_url: string | null;
    pickup: string;
    /** "10:00", or null for bookings made before pickup times existed */
    pickup_time: string | null;
    return: string;
    total_days: number;
    total_amount: number;
    pickup_location: string;
    status: BookingStatus;
    payment_method: string | null;
    payment_status: PaymentStatus | null;
    can_cancel: boolean;
};

/** A row on the admin bookings page (Admin\BookingController@index). */
export type AdminBooking = {
    id: number;
    ref: string;
    customer: string;
    customer_email: string;
    customer_phone: string | null;
    vehicle: string;
    plate: string;
    pickup: string;
    pickup_time: string | null;
    return: string;
    total_days: number;
    total_amount: number;
    pickup_location: string;
    notes: string | null;
    status: BookingStatus;
    payment_method: string | null;
    payment_status: PaymentStatus | null;
    next_statuses: BookingStatus[];
    can_mark_paid: boolean;
};

/** A row on the admin customers page (Admin\CustomerController@index). */
export type AdminCustomer = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    ic_number: string | null;
    license_number: string | null;
    license_expiry: string | null;
    license_valid: boolean;
    status: 'active' | 'blocked';
    bookings_count: number;
    joined: string;
};

/** JSON returned by the live availability check (VehicleAvailabilityController). */
export type AvailabilityResult = {
    available: boolean;
    total_days: number;
    total_amount: number;
    message: string;
};
