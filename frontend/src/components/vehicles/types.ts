export type Driver = {
    user_id: string;
    name: string;
    surname: string;
    profile_picture_url?: string | null;
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
    trip_count: number;
    assigned_driver?: Driver | null;
};

export type CreateVehicleInput = {
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