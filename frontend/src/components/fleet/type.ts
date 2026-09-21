//driver route uses [longitude, latitude]
export type Driver = {
    id: string;
    name: string;
    image? string | null;
    status: "On trip" | "Inactive";
    location: [number, number];
    route: [number, number][];
};

export type FleetStats = {
    harshBraking: number;
    harshAcceleration: number;
    idleVehicles: number;
    tripsInProgress: number;
};

export type FleetDashboardResponse = {
    drivers: Driver[];
    stats: FleetStats;
};