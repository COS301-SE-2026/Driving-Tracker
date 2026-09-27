import { FleetDriver } from "@/components/fleet/type";
import type {
    Driver,
} from "@/components/vehicles/types";

import { apiFetch } from "./auth/apiClient";

interface GetDriversResponse{
    message: string;
    data: {
        drivers: FleetDriver[];
    };
}

export async function getDrivers(): Promise<FleetDriver[]> {

    const response = await apiFetch<GetDriversResponse>(`/vehicle/get_all_vehicles`);

    return response.data.drivers;
}