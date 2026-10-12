export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    role: 'admin' | 'customer';
    phone: string | null;
    ic_number: string | null;
    license_number: string | null;
    license_expiry: string | null;
    address: string | null;
    status: 'active' | 'blocked';
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};
