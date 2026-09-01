import prisma from "../db/prisma";
import { fetch_vehicle_benchmark } from "./vehicle.services";

//This service looks up what the factory says your car should get for fuel efficiency
export interface ManufacturerLookup {
    make: string;
    model: string;
    year: number;
    engine_type: string;
}

//making text lowercase
function normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
}

//converting mpg to l/100km
function mpgToLitresPer100Km(mpg: number): number {
    return 235.215 / mpg;
}

//checking if trim name matches what user asked for
function matchesEngineType(
    trim: string,
    trimDescription: string,
    requestedEngineType: string,
): boolean {
    const requested = normalize(requestedEngineType);
    return (
        normalize(trim) === requested || 
        normalize(trimDescription).includes(requested)
    );
}

export const manufacturer_baseline_service = {
    async get_efficiency(params: ManufacturerLookup): Promise<number | null> {
        const make = normalize(params.make);
        const model = normalize(params.model);
        const engine_type = normalize(params.engine_type);

        //checking if data is already in cache
        const cached = await prisma.manufacturer_efficiency_cache.findUnique({
            where: {
                make_model_engine_type: {
                    make,
                    model,
                    year: params.year,
                    engine_type,
                },
            },
            select: {
                official_efficiency_l_100km: true,
            },
        });

        if (cached) {
            return Number(cached.official_efficiency_l_100km)
        }

        //if cache miss, calling external API to get factory standard
        const trims = await fetch_vehicle_benchmark(make, model, params.year);

        //filtering results to find the exact engine type user asked for
        const matchingTrims = trims.filter((trim) =>
            matchesEngineType(
                trim.trim,
                trim.trim_description,
                engine_type,
            ),
        );

        if (matchingTrims.length === 0) {
            return null;
        }

        //Calculating average efficiency from matching results
        const validMpgValues = matchingTrims
            .map((trim) => Number(trim.combined_mpg))
            .filter((mpg) => Number.isFinite(mpg) && mpg > 0);
        
        if (validMpgValues.length === 0) {
            return null;
        }

        const averageMpg = validMpgValues.reduce((sum, mpg) => sum + mpg, 0) / validMpgValues.length;

        const efficiencyL100Km = Number(
            mpgToLitresPer100Km(averageMpg).toFixed(4),
        );

        //saving result to cache for future requests
        await prisma.manufacturer_efficiency_cache.upsert({
            where: {
                make_model_year_engine_type: {
                    make,
                    model,
                    year: params.year,
                    engine_type,
                },
            },
            create: {
                make,
                model,
                year: params.year,
                engine_type,
                official_efficiency_l_100km: efficiencyL100Km
            },
            update: {
                official_efficiency_l_100km: efficiencyL100Km,
            },
        });

        return efficiencyL100Km;
    },
};