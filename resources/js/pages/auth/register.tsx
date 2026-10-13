import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, IdCard, Mail } from 'lucide-react';
import AuthField from '@/components/rentngo/auth-field';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { clearCelebration, markCelebration } from '@/lib/celebration';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                // Plays the "Welcome to RentNGo" animation on the next page
                onStart={() => markCelebration('register')}
                onError={() => clearCelebration()}
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        <AuthField
                            id="name"
                            name="name"
                            label="Full name"
                            icon={IdCard}
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            placeholder="As on your IC"
                            error={errors.name}
                        />

                        <AuthField
                            id="email"
                            name="email"
                            type="email"
                            label="Email"
                            icon={Mail}
                            required
                            tabIndex={2}
                            autoComplete="email"
                            placeholder="you@example.com"
                            error={errors.email}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <AuthField
                                id="password"
                                name="password"
                                type="password"
                                label="Password"
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                placeholder="Strong password"
                                passwordrules={passwordRules}
                                error={errors.password}
                            />
                            <AuthField
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                label="Confirm password"
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                placeholder="Type it again"
                                passwordrules={passwordRules}
                                error={errors.password_confirmation}
                            />
                        </div>

                        <p className="px-1 text-caption text-muted-foreground">
                            You&apos;ll add your IC and driving license later,
                            before your first booking.
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <Button
                                asChild
                                variant="ghost"
                                size="lg"
                                className="order-2 rounded-full bg-muted text-muted-foreground hover:bg-primary-hover hover:text-primary-foreground sm:order-1"
                            >
                                <Link href={login()} tabIndex={6}>
                                    I have an account
                                </Link>
                            </Button>
                            <Button
                                type="submit"
                                variant="brand"
                                size="lg"
                                className="order-1 rounded-full sm:order-2"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing ? <Spinner /> : null}
                                {processing ? 'Creating…' : 'Create account'}
                                {!processing && <ArrowRight />}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Create new account',
    description: '',
};
