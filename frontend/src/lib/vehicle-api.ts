import type {
    CreateVehicleInput,
    Driver,
    ImageSearchResult,
    Vehicle,
} from "@/components/vehicles/types"
import { apiFetch } from "./auth/apiClient";

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

    const response = await apiFetch<{
        data: ImageSearchResult | null;
    }>(`/vehicle/image-search?${params.toString()}`);

    return response.data;

}

export async function getDrivers(): Promise<Driver[]> {

    const response = await apiFetch<FleetDriversResponse>("/fleet/fleet_drivers");

    return response.data.drivers;

}

export async function updateVehicle(
    vehicleId: string,
    input: CreateVehicleInput,
): Promise<Vehicle>{
    const result = await apiFetch<{ data: Vehicle }>(
        `/fleet/vehicles/${vehicleId}`,
        {
            method: "PATCH",
            body: JSON.stringify(input),
        },
    );
    return result.data;
}

export async function deleteVehicle(vehicleId: string): Promise<void>{
    await apiFetch(
        `/fleet/vehicles/${vehicleId}`,
        {
            method: "DELETE",
        },
    );
}

export async function uploadVehicleImage(
    vehicleId: string,
    file: File,
): Promise<string>{
    const formData = new FormData();
    formData.append("image", file);

    const result = await apiFetch<{
        data: {
            image_url: string;
        };
    }>(`/upload/fleet-vehicle/${vehicleId}`,
        {
            method: "POST",
            body: formData,
        });

    return result.data.image_url;
}