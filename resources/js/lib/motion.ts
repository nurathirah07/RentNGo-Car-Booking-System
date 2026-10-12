import type { Transition, Variants } from 'motion/react';

/**
 * Shared animation settings for the whole app (Framer Motion / "motion").
 * Keep everything subtle: 150-300ms, ease-out, small distances.
 * Reduced motion is handled globally by <MotionConfig reducedMotion="user"> in app.tsx.
 */

/** "Ease-out-quint": fast start, gentle stop. Same curve as --ease-smooth in app.css. */
export const easeOut = [0.22, 1, 0.36, 1] as const;

export const durations = {
    fast: 0.15,
    base: 0.22,
    slow: 0.3,
} as const;

export const baseTransition: Transition = {
    duration: durations.slow,
    ease: easeOut,
};

/** Fade in while rising 8px. The default entrance for cards and sections. */
export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: baseTransition },
};

/** Plain fade, for things that shouldn't move (alerts, inline results). */
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: durations.base, ease: 'easeOut' },
    },
};

/** Grow from 96% while fading in. For hero images and dialogs' main visual. */
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: baseTransition },
};

/**
 * Parent of a staggered list: its children (using fadeUp etc.) start one after
 * another, `gap` seconds apart.
 */
export function staggerContainer(gap = 0.05, delay = 0): Variants {
    return {
        hidden: {},
        visible: {
            transition: { staggerChildren: gap, delayChildren: delay },
        },
    };
}

/** Whole-page enter/exit between Inertia visits. */
export const pageTransition: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: baseTransition },
    exit: {
        opacity: 0,
        y: -4,
        transition: { duration: durations.fast, ease: 'easeIn' },
    },
};

/** A soft spring with almost no bounce, for things that slide (active tab pills). */
export const springSoft: Transition = {
    type: 'spring',
    bounce: 0.15,
    duration: 0.4,
};

/** Hover lift + press for interactive cards: spread onto a motion element. */
export const pressable = {
    whileHover: { y: -2 },
    whileTap: { scale: 0.98 },
    transition: { duration: durations.base, ease: easeOut },
} as const;

export const variantsByName = { fadeUp, fadeIn, scaleIn } as const;

export type VariantName = keyof typeof variantsByName;
