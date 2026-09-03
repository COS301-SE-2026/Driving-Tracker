import { Prisma } from "@prisma/client";
import prisma from "../db/prisma";
import { manufacturer_baseline_service } from "./manufacturer_baseline.service";

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
            !vehicle.year
        ) {
            throw new Error("Vehicle is missing manufacturer specification fields");
        }

        const since = new Date(
            Date.now() - params.timeframe_days * 24 * 60 * 60 * 1000,
        );

        //querying the DB for all users driving the same vehicle
        const rows = await prisma.$queryRaw<AggregatedUser[]>(Prisma.sql`
            SELECT
                t.user_id,
                CONCAT_WS(' ', u.name, u.surname) AS display_name,
                SUM(t.fuel_consumed)::float AS total_fuel,
                SUM(t.distance_km)::float AS total_distance
            FROM "trips" t
            INNER JOIN "vehicles" v ON v.vehicle_id = t.vehicle_id
            INNER JOIN "users" u ON u.user_id = t.user_id
            WHERE t.status = 'COMPLETED'
                AND COALESCE(t.end_time, t.created_at) >= ${since}
                AND t.fuel_consumed IS NOT NULL
                AND t.distance_km IS NOT NULL
                AND t.distance_km > 0
                AND LOWER(v.make) = LOWER(${vehicle.make})
                AND LOWER(v.model) = LOWER(${vehicle.model})
                AND v.year = ${vehicle.year}
                AND u.status = 'ACTIVE'
            GROUP BY t.user_id, u.name, u.surname
            HAVING SUM(t.distance_km) > 0
            ORDER BY SUM(t.fuel_consumed) / SUM(t.distance_km) ASC
        `);

        //converting database results to ranked list
        const ranked: RankedUser[] = rows
            .map((row) => {
                const totalFuel = Number(row.total_fuel);
                const totalDistance = Number(row.total_distance);

                return {
                    ...row,
                    total_fuel: totalFuel,
                    total_distance: totalDistance,
                    dispaly_name: row.display_name || "Driver",
                    efficiency: (totalFuel / totalDistance) * 100,
                    rank: 0,
                };
            })
            .sort((a, b) => {
                if (a.efficiency !== b.efficiency) {
                    return a.efficiency - b.efficiency;
                }

                return a.display_name.localeCompare(b.display_name);
            })
            .map((entry, index) => ({
                ...entry,
                rank: index + 1,
            }));
        
        const currentUser = ranked.find(
            (entry) => entry.user_id === params.user_id,
        );

        //getting manufactures official efficiency standard
        const manufacturerStandard = 
            await manufacturer_baseline_service.get_efficiency({
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
            });


        //calculating percentile
        const totalPeers = ranked.length; //how many drivers have the same car

        const userPercentile = currentUser
            ? totalPeers === 1
                ? 100
                : ((totalPeers - currentUser.rank) / (totalPeers - 1)) * 100
            : null;

        
        //final response to send back to the app
        return {
            vehicle: {
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
            },
            manufacturerStandardL100km: manufacturerStandard,
            userEfficiencyL100km: currentUser ? Number(currentUser.efficiency.toFixed(2)) : null,
            userRank: currentUser?.rank ?? null,
            userPerecentile: userPercentile === null ? null : Number(userPercentile.toFixed(2)),
            totalPeers,
            leaderboard: ranked.map((entry) => ({
                rank: entry.rank,
                displayName: entry.display_name || "Driver",
                efficiencyL100km: Number(entry.efficiency.toFixed(2)),
                isCurrentUser: entry.user_id === params.user_id,
            })),
        };

    }
};