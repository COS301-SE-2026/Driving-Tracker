import { multipleOf } from "zod";
import prisma from "../db/prisma";
// import { fetch_vehicle_benchmark } from "../services/vehicle.services";

export interface trip_scores_results{
    safety_score: number; 
    eco_score: number | null; // null if no benchmark/fuel data is available 
    overall_score: number;
}
//check if the amount of trips is over 5 for fuel efficiency update 

function to_number(value: any): number | null {//helper to convert prisma type to number for typescript
    if (value === null || value === undefined) {
        return null;
    }
    // If it has a toNumber method (Prisma Decimal), use it
    if (typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    // If it's already a number, return it
    if (typeof value === 'number') {
        return value;
    }
    // Otherwise try to convert to number
    return Number(value);
};
const event_weights = {
    HARSH_BRAKE: 1.0,
    HARSH_ACCELERATION: 1.0,
    SHARP_CORNER: 0.75,
    CRASH_LIKE: 8.0,
} as const;

async function calculate_safety_score(trip_id: string, distance_km: number): Promise<number>{
    //first check if the distance is valid 
    if(distance_km <= 0 ){
        return 0 ;// nothing to evaluate 
    }

    const event_group = await prisma.trip_events.groupBy({
        by: ['type'],
        where:{ trip_id},
        _count: {event_id: true}
    });//get the events that happened in that specific trip...

    let weighted_events_per_100km = 0;
    for( const row of event_group){
        const weight = event_weights[row.type as keyof typeof event_weights] ?? 0;
        const per_100km = row._count.event_id / (distance_km / 100);
        weighted_events_per_100km += per_100km * weight;
    }

    const raw_score = 100 - weighted_events_per_100km* 5 ;
    return Math.max(0, Math.min(100, Math.round(raw_score)));
}

/**
 * the eco score will be based on the cars api benchmark 
 * if there is no car api should it revert to normal obd readings ???
 */
async function calculate_eco_score(trip_id: string, vehicle_id: string): Promise<number | null> {
    const [vehicle, trip] = await Promise.all([
        prisma.vehicles.findUnique({ where: { vehicle_id } }),
        prisma.trips.findUnique({ where: { trip_id } }),
    ]);

    if (!vehicle || !trip) return null;
    if (trip.vehicle_id !== vehicle_id) return null;

    const fuel_level_start = to_number(trip.fuel_level_start);
    const fuel_level_end = to_number(trip.fuel_level_end);
    const tank_liters = to_number(vehicle.fuel_tank);
    const benchmark_l_per_100km = to_number(vehicle.fuel_efficiency);
    const distance_km = to_number(trip.distance_km);

    if (fuel_level_start === null ||fuel_level_end === null ||tank_liters === null ||benchmark_l_per_100km === null ||distance_km === null) {
        return null;
    }

    if (tank_liters <= 0 || benchmark_l_per_100km <= 0 || distance_km <= 0) return null;

    // fuel levels are percentages (0-100)
    const fuel_used_liters = ((fuel_level_start - fuel_level_end) / 100) * tank_liters;
    if (fuel_used_liters <= 0) return null;

    // convert this trip's usage to L/100km so units match benchmark
    const actual_l_per_100km = (fuel_used_liters / distance_km) * 100;

    // Lower L/100km is better
    if (actual_l_per_100km <= benchmark_l_per_100km) return 100;

    const percent_over = ((actual_l_per_100km - benchmark_l_per_100km) / benchmark_l_per_100km) * 100;
    const score = 100 - percent_over * 2;

    return Math.max(0, Math.min(100, Math.round(score)));
};


export async function calculate_trip_scores(trip_id: string, vehicle_id:string,distance_km:number):Promise<trip_scores_results>{
    // if(!fuel_estimate){
    //     throw new Error("null fuel estimate");
    // }
    const [safety_score, eco_score] = await Promise.all([
        calculate_safety_score(trip_id, distance_km),
        calculate_eco_score(trip_id,vehicle_id),
    ]);
    const overall_score = eco_score != null? Math.round(safety_score * 0.6 + eco_score * 0.4): safety_score;
 
    return { safety_score, eco_score, overall_score };
}