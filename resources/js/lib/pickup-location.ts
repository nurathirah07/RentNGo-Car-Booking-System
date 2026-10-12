/**
 * The pickup point picked in the landing page search, remembered in this
 * browser so the booking form can pre-select it. Purely a convenience:
 * nothing is sent to the server until the customer books.
 */
const STORAGE_KEY = 'rentngo.pickup-location';

/** Same list as Booking::PICKUP_LOCATIONS on the server. */
export const PICKUP_POINTS = [
    'RentNGo HQ, Shah Alam',
    'KLIA Terminal 1',
    'KL Sentral',
];

export function savePickupLocation(location: string): void {
    try {
        if (location) {
            window.localStorage.setItem(STORAGE_KEY, location);
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // Storage blocked (private mode): the form just uses its default.
    }
}

/** The saved pickup point, but only if it's still one of the real options. */
export function readPickupLocation(options: string[]): string | null {
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);

        return saved && options.includes(saved) ? saved : null;
    } catch {
        return null;
    }
}
