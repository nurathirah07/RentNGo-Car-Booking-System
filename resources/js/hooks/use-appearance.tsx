/**
 * RentNGo uses a light-only design (white with soft blue gradients),
 * so the page is always shown in light mode, whatever the operating system
 * prefers. This replaces the starter kit's light/dark/system switcher.
 */
export type ResolvedAppearance = 'light';

const setCookie = (name: string, value: string, days = 365): void => {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

export function initializeTheme(): void {
    if (typeof window === 'undefined') {
        return;
    }

    // Overwrite any older "dark"/"system" choice saved by the starter kit.
    try {
        localStorage.setItem('appearance', 'light');
    } catch {
        // Storage blocked (private mode): nothing to clean up.
    }

    setCookie('appearance', 'light');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
}

/** Kept so components like the toaster can ask which theme is active. */
export function useAppearance(): { appearance: ResolvedAppearance } {
    return { appearance: 'light' };
}
