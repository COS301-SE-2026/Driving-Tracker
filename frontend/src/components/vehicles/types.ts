export type Driver = {
    user_id: string;
    name: string;
    surname: string;
    profile_picture_url?: string | null;
    email?: string;
    username?: string;
    phone_number?: string;
    status?: string;
    joined_at?: Date;
};

export type Vehicle = {
    vehicle_id: string;
    name?: string | null;
    registration?: string | null;
    make?: string | null;
    model?: string | null;
    year?: number | null;
    fuel_type?: string | null;
    fuel_tank?: number | null;
    image_url?: string | null;
    trip_count?: number;
    status?: string;
    org_id: string;
    assigned_driver?: Driver | null;
};

export type CreateVehicleInput = {
    name?: string;
    registration?: string;
    make: string;
    model: string;
    year: number;
    fuel_type: string;
    fuel_tank: number;
};

export type ImageSearchResult = {
    title: string;
    image_url: string;
    thumbnail_url: string;
};