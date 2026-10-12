import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

/**
 * Search box + filters that live in the URL query string,
 * e.g. /admin/bookings?search=myvi&status=pending. The server does the filtering,
 * so a filtered page can be refreshed or bookmarked.
 *
 * `isLoading` is true while the new results are loading, so the page can dim
 * the old list (the user always sees that something is happening).
 *
 * Used by Browse cars and the admin Vehicles, Bookings and Customers pages.
 */
export function useQueryFilters<TFilters extends { search: string }>(
    url: string,
    filters: TFilters,
) {
    const [search, setSearch] = useState(filters.search);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimer = useRef<number | undefined>(undefined);

    const hasFilters = Object.values(filters).some((value) => value !== '');

    const visitOptions = {
        preserveState: true, // keep what is typed in the search box
        preserveScroll: true,
        replace: true, // don't add a browser history entry per keystroke
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false),
    };

    /**
     * Reload the page with the new filters. Empty filters are left out to keep
     * the URL clean, and the page number is dropped so a new search starts at page 1.
     */
    function applyFilters(changes: Partial<TFilters>) {
        const query = Object.fromEntries(
            Object.entries({ ...filters, ...changes }).filter(
                ([, value]) => value !== '',
            ),
        );

        router.get(url, query, visitOptions);
    }

    /** Wait until the user stops typing for 300ms before searching (debounce). */
    function handleSearchChange(value: string) {
        setSearch(value);
        window.clearTimeout(searchTimer.current);
        searchTimer.current = window.setTimeout(
            () => applyFilters({ search: value } as Partial<TFilters>),
            300,
        );
    }

    function clearFilters() {
        setSearch('');
        router.get(url, {}, visitOptions);
    }

    return {
        search,
        hasFilters,
        isLoading,
        applyFilters,
        handleSearchChange,
        clearFilters,
    };
}
