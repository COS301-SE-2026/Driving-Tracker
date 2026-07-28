import prisma from "../db/prisma";
import { fetch_vehicle_benchmark } from "../services/vehicle.services";

export interface trip_scores_results{
    safety_score: number; 
    eco_score: number | null; // null if no benchmark/fuel data is available 
    overall_score: number;
}

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

function mpg_to_lper100km(mpg: number): number | null {//helper function for converting mpg to lper100
    if (!mpg || mpg <= 0) return null;
    return 235.215 / mpg;
}
async function calculate_eco_score(distance_km: number, vehicle_id: string,fuel_estimate: number){

    const vehicle = await prisma.vehicles.findUnique({
        where:{ vehicle_id:vehicle_id}
    });
    if (!vehicle?.make || !vehicle?.model || !vehicle?.year) {        
        throw new Error("No car info found in database");
    }

    const make = vehicle?.make;
    const model = vehicle?.model;
    const year = vehicle?.year;
     
    let benchmark_lper100km: number| null =null;
    if(year >= 2015 && year <= 2020){
        try{
            const ben_trim = await fetch_vehicle_benchmark(make,model,year);
            if(ben_trim.length === 0){
                return null ;
            }

            const  avg_mpg = ben_trim.reduce((sum, ben_trim) => sum + ben_trim.combined_mpg, 0) / ben_trim.length;
            benchmark_lper100km = mpg_to_lper100km(avg_mpg)
        }catch(error){
            console.error(`Benchmark lookup failed for eco_score (${vehicle.make} ${vehicle.model} ${vehicle.year}):`, error);
            return null;
        }
    }
    if (benchmark_lper100km == null) return null;
 
    const trip_lper100km = (fuel_estimate / distance_km) * 100;
    const percent_diff = ((trip_lper100km - benchmark_lper100km) / benchmark_lper100km) * 100;
 
    if (percent_diff <= 0) return 100; // at or better than rated economy
 
    const score = 100 - percent_diff * 2;
    return Math.max(0, Math.min(100, Math.round(score)));
}

export async function calculate_trip_scores(trip_id: string, vehicle_id:string,distance_km:number,fuel_estimate:number):Promise<trip_scores_results>{
    const [safety_score, eco_score] = await Promise.all([
        calculate_safety_score(trip_id, distance_km),
        calculate_eco_score(distance_km,vehicle_id, fuel_estimate),
    ]);
    const overall_score = eco_score != null? Math.round(safety_score * 0.6 + eco_score * 0.4): safety_score;
 
    return { safety_score, eco_score, overall_score };
}