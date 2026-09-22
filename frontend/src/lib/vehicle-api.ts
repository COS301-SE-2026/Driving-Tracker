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
        `${API_URL}/vehicle/get_all_vehicles`,
        {
            headers: getHeaders(),
        },
    );

    return parseResponse<Vehicle[]>(response);

}

export async function createVehicle(
    input: CreateVehicleInput,
): Promise<Vehicle> {

    const response = await fetch(
        `${API_URL}/vehicle/assign_vehicle`,
        {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(input),
        },
    );

    const result = await parseResponse<{ data: Vehicle }>(response);

    return result.data;

}