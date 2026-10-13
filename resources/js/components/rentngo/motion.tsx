import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'motion/react';
import { Children, isValidElement } from 'react';
import type { AriaAttributes, ReactNode } from 'react';
import {
    baseTransition,
    pageTransition,
    springSoft,
    staggerContainer,
    variantsByName,
} from '@/lib/motion';
import type { VariantName } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * A list/grid whose items fade up one after another.
 *
 *   <Stagger className="grid gap-4 sm:grid-cols-3">
 *       {cars.map((car) => <VehicleCard key={car.id} ... />)}
 *   </Stagger>
 *
 * Each child is wrapped in a small motion box that stretches the child to fill
 * its grid cell, so cards keep equal heights. Items added later (e.g. after a
 * filter change) animate in on their own.
 */
export function Stagger({
    children,
    className,
    gap = 0.05,
    delay = 0,
    variant = 'fadeUp',
    inView = false,
    ...aria
}: AriaAttributes & {
    children: ReactNode;
    className?: string;
    /** Wait until the list scrolls into view before animating (sections lower on a page). */
    inView?: boolean;
    /** Seconds between one item and the next */
    gap?: number;
    delay?: number;
    variant?: VariantName;
}) {
    return (
        <motion.div
            {...aria}
            className={className}
            variants={staggerContainer(gap, delay)}
            initial="hidden"
            {...(inView
                ? {
                      whileInView: 'visible',
                      viewport: { once: true, margin: '-60px' },
                  }
                : { animate: 'visible' })}
        >
            {Children.map(children, (child, index) =>
                isValidElement(child) ? (
                    <motion.div
                        key={child.key ?? index}
                        variants={variantsByName[variant]}
                        className="flex min-w-0 *:min-w-0 *:flex-1"
                    >
                        {child}
                    </motion.div>
                ) : (
                    child
                ),
            )}
        </motion.div>
    );
}

/** One block that animates in when it first appears (hero image, banners, results). */
export function Reveal({
    children,
    className,
    variant = 'fadeUp',
    delay = 0,
    inView = false,
}: {
    children: ReactNode;
    className?: string;
    variant?: VariantName;
    delay?: number;
    /** Wait until the block scrolls into view before animating. */
    inView?: boolean;
}) {
    return (
        <motion.div
            className={cn(className)}
            variants={variantsByName[variant]}
            initial="hidden"
            {...(inView
                ? {
                      whileInView: 'visible',
                      viewport: { once: true, margin: '-60px' },
                  }
                : { animate: 'visible' })}
            // Keep the shared duration/easing, only add the delay.
            transition={delay ? { ...baseTransition, delay } : undefined}
        >
            {children}
        </motion.div>
    );
}

/**
 * Fades the old page out and the new one in between Inertia visits.
 *
 * It is keyed by the page component, so a visit to the SAME page (filtering,
 * paging, saving a form) doesn't flash. All settings pages count as one page
 * here; SettingsLayout animates its own content when you switch tabs.
 */
export function PageTransition({
    children,
    className,
    transitionKey,
}: {
    children: ReactNode;
    className?: string;
    /** Override the key, e.g. to animate a nested area per page. */
    transitionKey?: string;
}) {
    const { component } = usePage();
    const key =
        transitionKey ??
        (component.startsWith('settings/') ? 'settings' : component);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={key}
                className={className}
                variants={pageTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

/**
 * The highlight behind the active tab. Give every tab in a group the same
 * `layoutId` and render this only in the active one: it slides from the old
 * tab to the new one ("magic move").
 */
export function ActivePill({
    layoutId,
    className,
}: {
    layoutId: string;
    className?: string;
}) {
    return (
        <motion.span
            layoutId={layoutId}
            aria-hidden
            className={cn('absolute inset-0 -z-10', className)}
            transition={springSoft}
        />
    );
}
