import prisma from "../db/prisma";
import { fetch_vehicle_benchmark } from "./vehicle.services";

//This service looks up what the factory says your car should get for fuel efficiency
export interface ManufacturerLookup {
    make: string;
    model: string;
    year: number;
}

//making text lowercase
function normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
}

//converting mpg to l/100km
function mpgToLitresPer100Km(mpg: number): number {
    return 235.215 / mpg;
}

export const manufacturer_baseline_service = {
    async get_efficiency(params: ManufacturerLookup): Promise<number | null> {
        const make = normalize(params.make);
        const model = normalize(params.model);

        //trying CAR API for exact, make, model and year
        try {
            const trims = await fetch_vehicle_benchmark(
                make,
                model,
                params.year
            );

            const validMpgValues = trims
                .map((trim) => Number(trim.combined_mpg))
                .filter((mpg) => Number.isFinite(mpg) && mpg > 0);

            if (validMpgValues.length > 0) {
                const averageMpg = 
                    validMpgValues.reduce((sum, mpg) => sum + mpg, 0) / validMpgValues.length;
                
                return Number(
                    mpgToLitresPer100Km(averageMpg).toFixed(4)
                );
            }
        } catch (error) {
            console.error("CAR API lookup failed, using database fallback.");
        }

        //if CAR API fails, we average stored efficiency for matching vehicles
        const databaseAverage = await prisma.vehicles.aggregate({
            where: {
                make: {
                    equals: make,
                    mode: "insensitive",
                },
                model: {
                    equals: model,
                    mode: "insensitive",
                },
                year: params.year,
                fuel_efficiency: {
                    not: null,
                },
            },
            _avg: {
                fuel_efficiency: true,
            },
        });

        const average = databaseAverage._avg.fuel_efficiency;

        return average === null ? null : Number(average);
        
    },
};