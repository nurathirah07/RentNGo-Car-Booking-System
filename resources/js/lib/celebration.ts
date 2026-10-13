/**
 * A one-time "you're in!" animation after logging in or signing up.
 *
 * The login/register form calls markCelebration() when it submits; the first
 * page after the redirect calls takeCelebration() and plays the animation.
 * If the form fails (wrong password...), clearCelebration() removes the mark.
 * Stored in sessionStorage, so it only lives in this browser tab.
 */
export type CelebrationKind = 'login' | 'register';

const KEY = 'rentngo.celebrate';

export function markCelebration(kind: CelebrationKind): void {
    try {
        window.sessionStorage.setItem(KEY, kind);
    } catch {
        // Storage blocked: the user just doesn't see the animation.
    }
}

export function clearCelebration(): void {
    try {
        window.sessionStorage.removeItem(KEY);
    } catch {
        // ignore
    }
}

/** Returns the pending celebration (and removes it so it only plays once). */
export function takeCelebration(): CelebrationKind | null {
    try {
        const kind = window.sessionStorage.getItem(KEY);
        window.sessionStorage.removeItem(KEY);

        return kind === 'login' || kind === 'register' ? kind : null;
    } catch {
        return null;
    }
}
