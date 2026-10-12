import { useState } from 'react';

const STORAGE_KEY = 'rentngo.saved-cars';

function readSaved(): number[] {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);

        return stored ? (JSON.parse(stored) as number[]) : [];
    } catch {
        return []; // private mode or blocked storage: start empty
    }
}

/**
 * Cars the customer bookmarked on this device (the heart on each card).
 * Stored only in this browser's localStorage, so nothing is sent to the server.
 */
export function useSavedCars() {
    const [saved, setSaved] = useState<number[]>(() =>
        typeof window === 'undefined' ? [] : readSaved(),
    );

    function toggle(carId: number) {
        const next = saved.includes(carId)
            ? saved.filter((id) => id !== carId)
            : [...saved, carId];

        setSaved(next);

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            // Storage unavailable: the heart still works until the page reloads.
        }
    }

    return { isSaved: (carId: number) => saved.includes(carId), toggle };
}
