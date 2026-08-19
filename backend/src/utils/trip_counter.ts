import prisma from "../db/prisma";

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

export async function update_vehicle_efficiency(trip_id:string,vehicle_id: string,user_id: string):Promise<{updated: boolean; trip_count: number; fuel_efficiency: number | null}>{

    const trip_count = await prisma.trips.count({
        where:{trip_id:trip_id,
            status:"COMPLETED"
        }
    });

    if(trip_count %5 !== 0||trip_count ===0){
        return { updated: false,trip_count,fuel_efficiency:null};
    }
    const [vehicle, trips] = await Promise.all([
        prisma.vehicles.findUnique({
            where:{vehicle_id},
            select:{fuel_tank:true},
        }),
        prisma.trips.findMany({
            where: {
                user_id,
                vehicle_id,
                status: "COMPLETED",
                fuel_level_start: { not: null },
                fuel_level_end: { not: null },
                distance_km: { not: null },
            },
            select: {
            fuel_level_start: true,
            fuel_level_end: true,
            distance_km: true,
            },
        }),
    ]);
    if(!vehicle){
        throw new Error("Vehicle not found");
    }

    const tank_liters = to_number(vehicle.fuel_tank);
    if(tank_liters ===null || tank_liters <= 0){
        return{ updated:false,trip_count,fuel_efficiency:null}
    }

    let total_fuel_used_liters = 0;
    let total_distance_km = 0;

    for(const t of trips){
        const start_fuel = to_number(t.fuel_level_start);
        const end_fuel = to_number(t.fuel_level_end);
        const distance = to_number(t.distance_km);

        if(start_fuel === null || end_fuel === null || distance ===null){
            continue;
        }
        if(start_fuel < end_fuel){
            continue;
        }

        const fuel_used_liters = ((start_fuel - end_fuel)/100)* tank_liters;
        if(fuel_used_liters <= 0 ){
            continue;
        }
        total_fuel_used_liters += fuel_used_liters;
        total_distance_km += distance;
    }
    if(total_distance_km <= 0 || total_fuel_used_liters <= 0){
        return { updated: false, trip_count, fuel_efficiency: null };
    }

    const fuel_efficiency = Number(((total_fuel_used_liters / total_distance_km) * 100).toFixed(2));

    await prisma.vehicles.update({
        where: { vehicle_id },
        data: { fuel_efficiency },
    });

    return {
        updated: true,
        trip_count,
        fuel_efficiency,
    };

}