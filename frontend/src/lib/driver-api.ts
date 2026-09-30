import { FleetDriver, HarshEventCounts } from "@/components/fleet/type";

import { apiFetch } from "./auth/apiClient";

interface GetDriversResponse{
    message: string;
    data: {
        drivers: FleetDriver[];
    };
}

interface GetFleetEventsResponse{
    message: string;
    data: {
        harsh_brake: number;
        harsh_acceleration: number;
        crash_like: number;
        sharp_corner: number;
    };
}

export async function getDrivers(): Promise<FleetDriver[]> {

    const response = await apiFetch<GetDriversResponse>(`/fleet/fleet_drivers`);

    return response.data.drivers;
}


export async function getFleetEvents(): Promise<HarshEventCounts> {

    const response = await apiFetch<GetFleetEventsResponse>(`/fleet/fleet_harsh_events`);

    return response.data;
}

