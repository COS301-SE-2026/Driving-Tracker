import { Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import { manufacturer_baseline_services } from "./manufacturer_baseline.service";

export interface FuelLeaderboardParams {
    user_id: string;
    vehicle_id: string;
    timeframe_days: number;
}

//data about one driver's fuel usage
interface AggregatedUser {
    user_id: string;
    display_name: string;
    total_fuel: number;
    total_distance: number;
}

interface RankedUser extends AggregatedUser {
    efficiency: number;
    rank: number;
}

function toDisplayName(name: string | null, surname: string | null): string {
    return `${name ?? ""} ${surname ?? ""}`.trim() || "Driver";
}

export const fuel_leaderboard_service = {
    async get_leaderboard(params: FuelLeaderboardParams) {
        if (params.user_id || !params.vehicle_id) {
            throw new Error("Missing user_id or vehicle_id");
        }

        if (
            !Number.isInteger(params.timeframe_days) ||
            params.timeframe_days < 1 ||
            params.timeframe_days > 3650
        ) {
            throw new Error("timeframe_days must be between 1 and 3650");
        }

        //making sure user owns this vehicle
        const assignment = await prisma.users_vehicles.findUnique({
            where: {
                user_id_vehicle_id: {
                    user_id: params.user_id,
                    vehicle_id: params.vehicle_id,
                },
            },
            include: {
                vehicles: true,
            },
        });

        if (!assignment) {
            throw new Error("Vehicle not found or not owned by user");
        }

        const vehicle = assignment.vehicles;

        if (
            !vehicle.make ||
            !vehicle.model ||
            !vehicle.year ||
            !vehicle.engine_type
        ) {
            throw new Error("Vehicle is missing manufacturer specification fields");
        }

        const since = new Date(
            Date.now() - params.timeframe_days * 24 * 60 * 60 * 1000,
        );

        //querying the DB for all users driving the same vehicle
        
    }
}