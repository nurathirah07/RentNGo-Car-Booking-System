import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { easeOut } from '@/lib/motion';

/**
 * A number that rolls smoothly to its new value (price totals, dashboard stats).
 *
 * - `countUp`: start from 0 on first show (dashboard counters).
 *   Without it, the first value appears as-is and only later changes animate.
 * - Screen readers get the final value only, never the rolling digits.
 * - With "reduce motion" on, the value just changes.
 */
export default function AnimatedNumber({
    value,
    format = (n) => Math.round(n).toLocaleString('en-MY'),
    countUp = false,
    duration = 0.6,
    className,
}: {
    value: number;
    format?: (value: number) => string;
    countUp?: boolean;
    duration?: number;
    className?: string;
}) {
    const reduceMotion = useReducedMotion();
    const [display, setDisplay] = useState(countUp ? 0 : value);
    // What is on screen right now, so an interrupted roll continues from there.
    const shown = useRef(countUp ? 0 : value);

    useEffect(() => {
        if (reduceMotion) {
            shown.current = value;
            setDisplay(value);

            return;
        }

        const controls = animate(shown.current, value, {
            duration,
            ease: easeOut,
            onUpdate: (latest) => {
                shown.current = latest;
                setDisplay(latest);
            },
        });

        return () => controls.stop();
    }, [value, duration, reduceMotion]);

    return (
        <span className={className}>
            <span aria-hidden className="tabular-nums">
                {format(display)}
            </span>
            <span className="sr-only">{format(value)}</span>
        </span>
    );
}
