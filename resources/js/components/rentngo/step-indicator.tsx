import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { baseTransition } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type Step = {
    label: string;
    done: boolean;
};

/**
 * "1 Dates — 2 Time — 3 Details — 4 Review": shows how far through the booking
 * the customer is. Finished steps get a tick, the line between them fills in,
 * and the first unfinished step is highlighted as the current one.
 */
export default function StepIndicator({ steps }: { steps: Step[] }) {
    const current = steps.findIndex((step) => !step.done);
    const activeIndex = current === -1 ? steps.length - 1 : current;

    return (
        <ol className="flex items-center" aria-label="Booking progress">
            {steps.map((step, index) => {
                const isCurrent = index === activeIndex && !step.done;

                return (
                    <li
                        key={step.label}
                        className="flex flex-1 items-center last:flex-none"
                        aria-current={isCurrent ? 'step' : undefined}
                    >
                        <div className="flex flex-col items-center gap-1.5">
                            <motion.span
                                className={cn(
                                    'flex size-7 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-200',
                                    step.done &&
                                        'border-brand bg-brand text-brand-foreground',
                                    isCurrent &&
                                        'border-brand bg-card text-brand ring-4 ring-brand/15',
                                    !step.done &&
                                        !isCurrent &&
                                        'bg-muted text-muted-foreground',
                                )}
                                animate={{ scale: isCurrent ? 1.08 : 1 }}
                                transition={baseTransition}
                            >
                                {step.done ? (
                                    <Check
                                        className="size-3.5"
                                        strokeWidth={3}
                                    />
                                ) : (
                                    index + 1
                                )}
                            </motion.span>
                            <span
                                className={cn(
                                    'text-caption font-semibold whitespace-nowrap',
                                    step.done || isCurrent
                                        ? 'text-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {step.label}
                                <span className="sr-only">
                                    {step.done
                                        ? ' (done)'
                                        : isCurrent
                                          ? ' (current step)'
                                          : ''}
                                </span>
                            </span>
                        </div>

                        {/* Connector line that fills in when this step is done */}
                        {index < steps.length - 1 && (
                            <div
                                className="mx-2 mb-5 h-0.5 flex-1 overflow-hidden rounded-full bg-muted"
                                aria-hidden
                            >
                                <motion.div
                                    className="h-full rounded-full bg-brand"
                                    initial={false}
                                    animate={{
                                        width: step.done ? '100%' : '0%',
                                    }}
                                    transition={baseTransition}
                                />
                            </div>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
