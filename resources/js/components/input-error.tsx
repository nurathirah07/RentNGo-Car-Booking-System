import { CircleAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { durations } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * A validation message under a field (the text comes from Laravel's errors).
 * It slides in softly, has an icon so it isn't colour-only, and role="alert"
 * so screen readers announce it.
 */
export default function InputError({
    message,
    className = '',
}: {
    message?: string;
    className?: string;
}) {
    return (
        <AnimatePresence initial={false}>
            {message && (
                <motion.p
                    key={message}
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: durations.base, ease: 'easeOut' }}
                    className={cn(
                        'flex items-start gap-1.5 text-sm font-medium text-danger',
                        className,
                    )}
                >
                    <CircleAlert
                        className="mt-0.5 size-4 shrink-0"
                        aria-hidden
                    />
                    {message}
                </motion.p>
            )}
        </AnimatePresence>
    );
}
