/** 120 -> "RM 120.00" (amounts, totals) */
export function ringgit(value: number): string {
    return value.toLocaleString('en-MY', {
        style: 'currency',
        currency: 'MYR',
    });
}

/** 120 -> "RM 120", 99.5 -> "RM 99.50" (daily prices on cards) */
export function ringgitShort(value: number): string {
    return value.toLocaleString('en-MY', {
        style: 'currency',
        currency: 'MYR',
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    });
}

/**
 * "2026-10-20" -> a Date at local midnight. Parsing it ourselves (instead of
 * new Date("2026-10-20"), which means UTC) stops the day shifting by timezone.
 */
export function parseISODate(isoDate: string): Date {
    const [year, month, day] = isoDate.split('-').map(Number);

    return new Date(year, month - 1, day);
}

/** A Date -> "2026-10-20" (local date, the format the server expects) */
export function toISODate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

/** "2026-10-20" -> "20 Oct" (or "20 Oct 2026" with the year) */
export function shortDate(isoDate: string, withYear = false): string {
    return parseISODate(isoDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        ...(withYear ? { year: 'numeric' } : {}),
    });
}

/** "2026-10-20" -> "Tue, 20 Oct" */
export function dayAndDate(isoDate: string): string {
    return parseISODate(isoDate).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}
