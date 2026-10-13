import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, Mail } from 'lucide-react';
import AuthField from '@/components/rentngo/auth-field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { clearCelebration, markCelebration } from '@/lib/celebration';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />

            {status && (
                <div
                    role="status"
                    className="mb-5 rounded-2xl bg-success-tint px-4 py-3 text-sm font-medium text-success"
                >
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                // Plays the "Welcome back" animation on the next page (see welcome-celebration.tsx)
                onStart={() => markCelebration('login')}
                onError={() => clearCelebration()}
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <AuthField
                            id="email"
                            name="email"
                            type="email"
                            label="Email"
                            icon={Mail}
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            placeholder="you@example.com"
                            error={errors.email}
                        />

                        <AuthField
                            id="password"
                            name="password"
                            type="password"
                            label="Password"
                            required
                            tabIndex={2}
                            autoComplete="current-password"
                            placeholder="Your password"
                            error={errors.password}
                        />

                        <div className="flex items-center justify-between gap-3 px-1">
                            <div className="flex items-center gap-2.5">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label
                                    htmlFor="remember"
                                    className="font-medium"
                                >
                                    Remember me
                                </Label>
                            </div>
                            {canResetPassword && (
                                <Link
                                    href={request()}
                                    tabIndex={5}
                                    className="rounded-sm text-sm font-semibold text-brand underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                                >
                                    Forgot password?
                                </Link>
                            )}
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Button
                                asChild
                                variant="ghost"
                                size="lg"
                                className="order-2 rounded-full bg-muted text-muted-foreground hover:bg-primary-hover hover:text-primary-foreground sm:order-1"
                            >
                                <Link href={register()} tabIndex={6}>
                                    Create account
                                </Link>
                            </Button>
                            <Button
                                type="submit"
                                variant="brand"
                                size="lg"
                                className="order-1 rounded-full sm:order-2"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing ? <Spinner /> : null}
                                {processing ? 'Logging in…' : 'Log in'}
                                {!processing && <ArrowRight />}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Log in to RentNGo',
    description: '',
};
