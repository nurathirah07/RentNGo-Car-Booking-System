import { router, usePage } from '@inertiajs/react';
import FavouriteController from '@/actions/App/Http/Controllers/FavouriteController';

/**
 * Cars the customer saved with the heart button, stored on their account
 * (so they follow them to any device). The heart flips instantly; if the
 * request fails, Inertia's optimistic update rolls it back.
 */
export function useSavedCars() {
    const { savedCarIds } = usePage().props;

    function toggle(carId: number) {
        router
            .optimistic<{ savedCarIds: number[] }>((props) => {
                const current = props.savedCarIds ?? [];

                return {
                    savedCarIds: current.includes(carId)
                        ? current.filter((id) => id !== carId)
                        : [...current, carId],
                };
            })
            .post(
                FavouriteController.toggle.url(carId),
                {},
                { preserveScroll: true, preserveState: true },
            );
    }

    return { isSaved: (carId: number) => savedCarIds.includes(carId), toggle };
}
