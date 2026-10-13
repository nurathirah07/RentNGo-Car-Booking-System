import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { takeCelebration } from '@/lib/celebration';
import type { CelebrationKind } from '@/lib/celebration';
import { easeOut } from '@/lib/motion';

/** Confetti dots: angle (deg), distance (px) and colour token for each piece. */
const confetti = Array.from({ length: 14 }, (_, index) => ({
    angle: (360 / 14) * index + (index % 2 ? 8 : -8),
    distance: index % 3 === 0 ? 120 : index % 3 === 1 ? 96 : 140,
    color: ['var(--brand)', 'var(--violet)', 'var(--success)', '#f59e0b'][
        index % 4
    ],
    size: index % 2 ? 8 : 6,
}));

const DISPLAY_MS = 2200;

/**
 * Plays once on the first page after logging in or signing up:
 * a check mark draws itself in a soft blue circle, confetti bursts out,
 * then a greeting appears and the whole thing fades away.
 * Click, press Esc or wait ~2 seconds to dismiss.
 */
export default function WelcomeCelebration() {
    const { auth } = usePage().props;
    const reduceMotion = useReducedMotion();
    const [kind, setKind] = useState<CelebrationKind | null>(null);

    // Read the mark once, after the page has mounted (sessionStorage is browser-only).
    useEffect(() => {
        const pending = takeCelebration();

        if (!pending) {
            return;
        }

        setKind(pending);
        const timer = window.setTimeout(() => setKind(null), DISPLAY_MS);
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setKind(null);
            }
        };
        window.addEventListener('keydown', onKey);

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('keydown', onKey);
        };
    }, []);

    const firstName = auth.user?.name.split(' ')[0] ?? '';

    return (
        <AnimatePresence>
            {kind && (
                <motion.div
                    key="celebration"
                    className="fixed inset-0 z-60 flex items-center justify-center bg-white/55 p-4 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.3 } }}
                    onClick={() => setKind(null)}
                    role="status"
                    aria-live="polite"
                >
                    <motion.div
                        className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border bg-card px-8 py-10 text-center shadow-lift"
                        initial={{ scale: 0.9, y: 12, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        transition={{ duration: 0.4, ease: easeOut }}
                    >
                        {/* Confetti burst from behind the check mark */}
                        {!reduceMotion && (
                            <div
                                className="pointer-events-none absolute top-[4.5rem] left-1/2"
                                aria-hidden
                            >
                                {confetti.map((piece, index) => {
                                    const radians =
                                        (piece.angle * Math.PI) / 180;

                                    return (
                                        <motion.span
                                            key={index}
                                            className="absolute rounded-full"
                                            style={{
                                                width: piece.size,
                                                height: piece.size,
                                                background: piece.color,
                                                marginLeft: -piece.size / 2,
                                                marginTop: -piece.size / 2,
                                            }}
                                            initial={{
                                                x: 0,
                                                y: 0,
                                                opacity: 0,
                                                scale: 0.4,
                                            }}
                                            animate={{
                                                x:
                                                    Math.cos(radians) *
                                                    piece.distance,
                                                y:
                                                    Math.sin(radians) *
                                                    piece.distance,
                                                opacity: [0, 1, 1, 0],
                                                scale: [0.4, 1, 1, 0.6],
                                            }}
                                            transition={{
                                                duration: 1.1,
                                                delay: 0.45,
                                                ease: easeOut,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {/* Check mark that draws itself */}
                        <motion.div
                            className="relative flex size-20 items-center justify-center rounded-full border border-primary-border bg-primary"
                            initial={{ scale: 0.6 }}
                            animate={{ scale: [0.6, 1.08, 1] }}
                            transition={{ duration: 0.55, ease: easeOut }}
                        >
                            <svg
                                viewBox="0 0 52 52"
                                className="size-12 text-brand"
                                aria-hidden
                            >
                                <motion.circle
                                    cx="26"
                                    cy="26"
                                    r="23"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0, opacity: 0.2 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{
                                        duration: 0.5,
                                        ease: easeOut,
                                    }}
                                />
                                <motion.path
                                    d="M15 27 l7.5 7.5 L37 19"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{
                                        duration: 0.35,
                                        delay: 0.4,
                                        ease: easeOut,
                                    }}
                                />
                            </svg>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.35,
                                delay: 0.55,
                                ease: easeOut,
                            }}
                        >
                            <h2 className="mt-6 text-h2">
                                {kind === 'register'
                                    ? `Welcome to RentNGo, ${firstName}!`
                                    : `Welcome back, ${firstName}!`}
                            </h2>
                            <p className="mt-1.5 text-body text-muted-foreground">
                                {kind === 'register'
                                    ? 'Your account is ready. Add your license details, then pick a car.'
                                    : "You're signed in. Let's find your next ride."}
                            </p>
                        </motion.div>

                        {/* Time bar showing when it will close by itself */}
                        <motion.div
                            className="mt-6 h-1 w-24 overflow-hidden rounded-full bg-muted"
                            aria-hidden
                        >
                            <motion.div
                                className="h-full rounded-full bg-brand"
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{
                                    duration: DISPLAY_MS / 1000,
                                    ease: 'linear',
                                }}
                            />
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
