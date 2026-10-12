import { Form, Head, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { edit } from '@/routes/profile';
import type { Auth, User } from '@/types';

type PageProps = {
    auth: Auth;
};

/**
 * Phone, IC and driving license: required before a customer can book a car
 * (checked on the server by User::hasCompleteProfile()).
 */
function RentalDetailsFields({
    user,
    errors,
}: {
    user: User;
    errors: Partial<Record<string, string>>;
}) {
    const fields = [
        {
            name: 'phone',
            label: 'Phone number',
            placeholder: '012-3456789',
            type: 'tel',
        },
        {
            name: 'ic_number',
            label: 'IC number',
            placeholder: '990101-10-1234',
            type: 'text',
        },
        {
            name: 'license_number',
            label: 'Driving license number',
            placeholder: 'D12345678',
            type: 'text',
        },
        {
            name: 'license_expiry',
            label: 'License expiry date',
            placeholder: '',
            type: 'date',
        },
    ] as const;

    return (
        <div className="space-y-6 border-t pt-6">
            <Heading
                variant="small"
                title="Rental details"
                description="Needed before you can book a car"
            />

            {fields.map((field) => (
                <div key={field.name} className="grid gap-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        defaultValue={user[field.name] ?? ''}
                        placeholder={field.placeholder}
                    />
                    <InputError message={errors[field.name]} />
                </div>
            ))}

            <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <textarea
                    id="address"
                    name="address"
                    rows={3}
                    defaultValue={user.address ?? ''}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <InputError message={errors.address} />
            </div>
        </div>
    );
}

export default function Profile() {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Your name and the email you log in with."
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {/* Only customers rent cars, so only they need these details. */}
                            {auth.user.role === 'customer' && (
                                <RentalDetailsFields
                                    user={auth.user}
                                    errors={errors}
                                />
                            )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    {processing && <Spinner />}
                                    {processing ? 'Saving…' : 'Save changes'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
