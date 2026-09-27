import { FleetDriver } from "@/components/fleet/type";

import { apiFetch } from "./auth/apiClient";

interface GetDriversResponse{
    message: string;
    data: {
        drivers: FleetDriver[];
    };
}

export async function getDrivers(): Promise<FleetDriver[]> {

    const response = await apiFetch<GetDriversResponse>(`/fleet/fleet_drivers`);

    return response.data.drivers;
}