import type {
    CreateVehicleInput,
    Driver,
    ImageSearchResult,
    Vehicle,
} from "@/components/vehicles/types"
import { apiFetch } from "./auth/apiClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface FleetVehiclesResponse {
    message: string;
    data: {
        vehicles: Vehicle[];
    };
}

interface FleetDriversResponse {
    message: string;
    data: {
        drivers: Driver[];
    };
}

interface AddVehicleResponse{
    data: Vehicle;
    warning: string | null;
}

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

    const response = await apiFetch<FleetVehiclesResponse>("/fleet/fleet_vehicles");

    return response.data.vehicles;

}

export async function createVehicle(
    input: CreateVehicleInput,
): Promise<Vehicle> {

    const response = await apiFetch<AddVehicleResponse>("/fleet/add_fleet_vehicle",{
        method: "POST",
        body: JSON.stringify(input) 
    });

    return response.data;
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

    //TODO: Change to apiFetch or discard
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

    const response = await apiFetch<FleetDriversResponse>("/fleet/fleet_drivers");

    return response.data.drivers;

}