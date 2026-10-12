import { Link, useForm } from '@inertiajs/react';
import { ImagePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import VehicleController from '@/actions/App/Http/Controllers/Admin/VehicleController';
import InputError from '@/components/input-error';
import CarImage from '@/components/rentngo/car-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { EditableVehicle, VehicleFormOptions } from '@/types';

/**
 * Form fields are kept as strings because that is what <input> gives us;
 * Laravel's validation casts and checks them on the server.
 */
type VehicleFormData = {
    category_id: string;
    brand: string;
    model: string;
    year: string;
    plate_number: string;
    color: string;
    transmission: string;
    fuel_type: string;
    seats: string;
    price_per_day: string;
    status: string;
    description: string;
    image: File | null;
};

type VehicleFormProps = VehicleFormOptions & {
    /** Pass a vehicle to edit it; leave it out to create a new one. */
    vehicle?: EditableVehicle;
};

/**
 * One form shared by the Create and Edit pages.
 * The only differences are the starting values and where it is submitted.
 */
export default function VehicleForm({
    vehicle,
    categories,
    transmissions,
    fuelTypes,
    statuses,
}: VehicleFormProps) {
    const isEditing = vehicle !== undefined;

    // useForm keeps the field values, validation errors and "processing" state for us.
    const { data, setData, post, transform, processing, errors, progress } =
        useForm<VehicleFormData>({
            category_id: vehicle ? String(vehicle.category_id) : '',
            brand: vehicle?.brand ?? '',
            model: vehicle?.model ?? '',
            year: vehicle
                ? String(vehicle.year)
                : String(new Date().getFullYear()),
            plate_number: vehicle?.plate_number ?? '',
            color: vehicle?.color ?? '',
            transmission: vehicle?.transmission ?? 'Auto',
            fuel_type: vehicle?.fuel_type ?? 'Petrol',
            seats: vehicle ? String(vehicle.seats) : '5',
            price_per_day: vehicle ? String(vehicle.price_per_day) : '',
            status: vehicle?.status ?? 'available',
            description: vehicle?.description ?? '',
            image: null,
        });

    // Shows the current photo, or the newly picked file before it is uploaded.
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        vehicle?.image_url ?? null,
    );

    // A blob: URL from URL.createObjectURL() holds the file in memory until revoked.
    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function handleImageChange(file: File | null) {
        setData('image', file);
        setPreviewUrl(
            file ? URL.createObjectURL(file) : (vehicle?.image_url ?? null),
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        if (isEditing) {
            // Browsers can't send files with a real PUT request, so we POST
            // and add _method=put. Laravel then treats it as PUT (method spoofing).
            transform((formData) => ({ ...formData, _method: 'put' }));
            post(VehicleController.update.url(vehicle.id), {
                forceFormData: true,
                preserveScroll: true,
            });

            return;
        }

        // Inertia turns the data into multipart FormData automatically when it contains a File.
        post(VehicleController.store.url(), { preserveScroll: true });
    }

    return (
        <form
            onSubmit={submit}
            className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
        >
            <div className="space-y-6">
                <FormSection
                    title="Car details"
                    description="What the customer sees on the car card."
                >
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field id="brand" label="Brand" error={errors.brand}>
                            <Input
                                id="brand"
                                value={data.brand}
                                onChange={(e) =>
                                    setData('brand', e.target.value)
                                }
                                placeholder="Perodua"
                                required
                            />
                        </Field>

                        <Field id="model" label="Model" error={errors.model}>
                            <Input
                                id="model"
                                value={data.model}
                                onChange={(e) =>
                                    setData('model', e.target.value)
                                }
                                placeholder="Myvi"
                                required
                            />
                        </Field>

                        <Field
                            id="category_id"
                            label="Category"
                            error={errors.category_id}
                        >
                            <Select
                                value={data.category_id}
                                onValueChange={(value) =>
                                    setData('category_id', value)
                                }
                            >
                                <SelectTrigger
                                    id="category_id"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="Choose a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={String(category.id)}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field
                            id="plate_number"
                            label="Plate number"
                            error={errors.plate_number}
                        >
                            <Input
                                id="plate_number"
                                value={data.plate_number}
                                onChange={(e) =>
                                    setData(
                                        'plate_number',
                                        e.target.value.toUpperCase(),
                                    )
                                }
                                placeholder="WXY 1234"
                                className="font-mono"
                                required
                            />
                        </Field>

                        <Field id="year" label="Year" error={errors.year}>
                            <Input
                                id="year"
                                type="number"
                                min={2000}
                                max={new Date().getFullYear() + 1}
                                value={data.year}
                                onChange={(e) =>
                                    setData('year', e.target.value)
                                }
                                required
                            />
                        </Field>

                        <Field
                            id="color"
                            label="Colour"
                            optional
                            error={errors.color}
                        >
                            <Input
                                id="color"
                                value={data.color}
                                onChange={(e) =>
                                    setData('color', e.target.value)
                                }
                                placeholder="Red"
                            />
                        </Field>

                        <Field
                            id="transmission"
                            label="Transmission"
                            error={errors.transmission}
                        >
                            <Select
                                value={data.transmission}
                                onValueChange={(value) =>
                                    setData('transmission', value)
                                }
                            >
                                <SelectTrigger
                                    id="transmission"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {transmissions.map((transmission) => (
                                        <SelectItem
                                            key={transmission}
                                            value={transmission}
                                        >
                                            {transmission}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field
                            id="fuel_type"
                            label="Fuel type"
                            error={errors.fuel_type}
                        >
                            <Select
                                value={data.fuel_type}
                                onValueChange={(value) =>
                                    setData('fuel_type', value)
                                }
                            >
                                <SelectTrigger
                                    id="fuel_type"
                                    className="w-full"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {fuelTypes.map((fuelType) => (
                                        <SelectItem
                                            key={fuelType}
                                            value={fuelType}
                                        >
                                            {fuelType}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field id="seats" label="Seats" error={errors.seats}>
                            <Input
                                id="seats"
                                type="number"
                                min={2}
                                max={15}
                                value={data.seats}
                                onChange={(e) =>
                                    setData('seats', e.target.value)
                                }
                                required
                            />
                        </Field>
                    </div>

                    <Field
                        id="description"
                        label="Description"
                        optional
                        error={errors.description}
                    >
                        <textarea
                            id="description"
                            rows={3}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground hover:border-brand/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            placeholder="Short description shown to customers"
                        />
                    </Field>
                </FormSection>

                <FormSection
                    title="Pricing & availability"
                    description="The daily rate and whether customers can book it."
                >
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                            id="price_per_day"
                            label="Price per day"
                            error={errors.price_per_day}
                        >
                            <div className="relative">
                                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                                    RM
                                </span>
                                <Input
                                    id="price_per_day"
                                    type="number"
                                    min={0.01}
                                    step={0.01}
                                    value={data.price_per_day}
                                    onChange={(e) =>
                                        setData('price_per_day', e.target.value)
                                    }
                                    placeholder="120.00"
                                    className="pl-10 font-semibold"
                                    required
                                />
                            </div>
                        </Field>

                        <Field id="status" label="Status" error={errors.status}>
                            <Select
                                value={data.status}
                                onValueChange={(value) =>
                                    setData('status', value)
                                }
                            >
                                <SelectTrigger
                                    id="status"
                                    className="w-full capitalize"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((status) => (
                                        <SelectItem
                                            key={status}
                                            value={status}
                                            className="capitalize"
                                        >
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        &quot;Maintenance&quot; hides the car from bookings for
                        now; &quot;inactive&quot; retires it but keeps its
                        booking history.
                    </p>
                </FormSection>
            </div>

            {/* Photo + save, sticky on wide screens */}
            <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                <FormSection
                    title="Photo"
                    description="A side-view PNG with a transparent background looks best."
                >
                    <label
                        htmlFor="image"
                        className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input bg-surface-gradient p-4 text-center transition-colors duration-200 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 hover:border-brand/40"
                    >
                        <div className="h-36 w-full">
                            {previewUrl ? (
                                <CarImage
                                    src={previewUrl}
                                    alt="Vehicle preview"
                                />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-tint text-tint-foreground transition-transform duration-200 group-hover:scale-110">
                                        <ImagePlus className="size-5" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-sm">
                            <span className="font-semibold text-tint-foreground">
                                {previewUrl
                                    ? 'Choose another photo'
                                    : 'Choose a photo'}
                            </span>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG or WEBP, up to 2 MB.
                                {isEditing &&
                                    ' Leave empty to keep the current one.'}
                            </p>
                        </div>
                        <input
                            id="image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) =>
                                handleImageChange(e.target.files?.[0] ?? null)
                            }
                            className="sr-only"
                        />
                    </label>
                    {progress && (
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-brand transition-[width] duration-200"
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                    )}
                    <InputError message={errors.image} />
                </FormSection>

                <div className="flex gap-3">
                    <Button
                        type="submit"
                        size="lg"
                        className="flex-1"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        {isEditing ? 'Save changes' : 'Add vehicle'}
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                        <Link href={VehicleController.index()}>Cancel</Link>
                    </Button>
                </div>
            </div>
        </form>
    );
}

function FormSection({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-5 rounded-xl border bg-card p-5 shadow-soft sm:p-6">
            <div>
                <h2 className="text-base font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
        </section>
    );
}

function Field({
    id,
    label,
    optional = false,
    error,
    children,
}: {
    id: string;
    label: string;
    optional?: boolean;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>
                {label}
                {optional && (
                    <span className="font-normal text-muted-foreground">
                        (optional)
                    </span>
                )}
            </Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
