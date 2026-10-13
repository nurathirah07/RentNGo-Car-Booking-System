import { Eye, EyeOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';

type AuthFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
    id: string;
    label: string;
    /** Icon on the right (ignored for passwords, which get a show/hide button). */
    icon?: LucideIcon;
    error?: string;
    /** Extra content shown on the right of the label, e.g. "Forgot password?" */
    labelAction?: ReactNode;
};

/**
 * Soft-filled input with a small label inside it (login/register style):
 * grey fill at rest; white with a blue outline while typing; red tint on error.
 * Password fields get a show/hide toggle instead of an icon.
 */
export default function AuthField({
    id,
    label,
    icon: Icon,
    error,
    labelAction,
    type = 'text',
    className,
    ...inputProps
}: AuthFieldProps) {
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={className}>
            <div
                className={cn(
                    'group relative rounded-2xl border px-4 pt-2.5 pb-2 transition-[background-color,border-color,box-shadow] duration-200',
                    'focus-within:border-brand/60 focus-within:bg-card focus-within:shadow-[0_0_0_4px_rgb(61_106_242/0.12)]',
                    error
                        ? 'border-danger/40 bg-danger-tint/50'
                        : 'border-transparent bg-muted hover:bg-muted/70',
                )}
            >
                <div className="flex items-center justify-between gap-2 pr-8">
                    <label
                        htmlFor={id}
                        className="text-[11px] font-semibold tracking-wide text-muted-foreground transition-colors group-focus-within:text-brand"
                    >
                        {label}
                    </label>
                    {labelAction}
                </div>
                <input
                    id={id}
                    type={isPassword && showPassword ? 'text' : type}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className="mt-0.5 w-full bg-transparent pr-8 text-[15px] font-semibold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
                    {...inputProps}
                />

                <span className="absolute top-1/2 right-3 -translate-y-1/2">
                    {isPassword ? (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                            aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                            }
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <EyeOff className="size-4" />
                            ) : (
                                <Eye className="size-4" />
                            )}
                        </button>
                    ) : (
                        Icon && (
                            <span className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors group-focus-within:text-brand">
                                <Icon className="size-4" aria-hidden />
                            </span>
                        )
                    )}
                </span>
            </div>
            <div id={`${id}-error`}>
                <InputError message={error} className="mt-1.5 px-1" />
            </div>
        </div>
    );
}
