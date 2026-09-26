import type {
    CreateVehicleInput,
    Driver,
    ImageSearchResult,
    Vehicle,
} from "@/components/vehicles/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getHeaders(): HeadersInit {

    const token = localStorage.getItem("access_token");

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token ?? ""}`,
    };

}

async function parseResponse<T>(response: Response): Promise<T> {

    if (!response.ok) {
        const error = await response.json().catch(() => null);

        throw new Error(
            error?.message ?? error?.error ?? "Request failed",
        );
    }

    return response.json() as Promise<T>;

}

export async function getVehicles(): Promise<Vehicle[]> {

    const response = await fetch(
        `${API_URL}/fleet/fleet_vehicles`,
        {
            headers: getHeaders(),
        },
    );

    const result = await parseResponse<{
        data: {
            vehicles: Vehicle[];
        };
    }>(response);

    return result.data.vehicles;

}

export async function createVehicle(
    input: CreateVehicleInput,
): Promise<Vehicle> {

    const response = await fetch(
        `${API_URL}/fleet/add_fleet_vehicle`,
        {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(input),
        },
    );

    const result = await parseResponse<{ data: Vehicle }>(response);

    return result.data;

}

export async function searchVehicleImage(
    make: string,
    model: string,
    year: number,
): Promise<ImageSearchResult | null> {

    const params = new URLSearchParams({
        make,
        model,
        year: String(year),
    });

    const response = await fetch(
        `${API_URL}/vehicle/image-search?${params.toString()}`,
        {
            headers: getHeaders(),
        },
    );

    const result = await parseResponse<{
        data: ImageSearchResult | null;
    }>(response);

    return result.data;

}

export async function getDrivers(): Promise<Driver[]> {

    const response = await fetch(
        `${API_URL}/fleet/fleet_drivers`,
        {
            headers: getHeaders(),
        },
    );

    const result = await parseResponse<{ 
        data: {
            drivers: Driver[];
        };
    }>(response);

    return result.data.drivers;

}