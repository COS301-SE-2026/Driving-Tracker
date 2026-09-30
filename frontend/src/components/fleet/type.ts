//driver route uses [longitude, latitude]
export type Driver = {
    id: string;
    name: string;
    image?: string | null;
    status: string;
    location?: [number, number];
    route?: [number, number][];
    speed?: number;
};

export type FleetDriver = {
    user_id: string;
    name: string;
    surname: string;
    email: string;
    username: string;
    phone_number: string;
    profile_picture_url: string | null;
    joined_at: Date;
    status: string;
}

export type FleetStats = {
    harshBraking: number;
    harshAcceleration: number;
    crashLike: number;
    idleDrivers: number;
    tripsInProgress: number;
};

export type HarshEventCounts = {
    harsh_brake: number;
    harsh_acceleration: number;
    sharp_corner: number;
    crash_like: number;
};

export type FleetDashboardResponse = {
    drivers: Driver[];
    stats: FleetStats;
};