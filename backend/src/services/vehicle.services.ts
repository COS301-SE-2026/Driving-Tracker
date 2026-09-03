
import prisma from "../db/prisma";
import { manufacturer_baseline_service } from "./manufacturer_baseline.service";


// what do you need to process ?
// user_id 
//then it gets all vehicles associated with that user 
export interface get_vehicles{
    user_id:string;
}

export interface update_vehicle_name{
    user_id: string;
    vehicle_id: string;
    name: string;
}

/*
model vehicles {
  vehicle_id   String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id      String  @db.Uuid
  registration String? @db.VarChar(20)
  make         String? @db.VarChar(50)
  model        String? @db.VarChar(50)
  year         Int?
  fuel_type    String? @db.VarChar(20)
  trips        trips[]
  users        users   @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
}
*/
export interface assign_vehicle{
    user_id: string,
	name?: string,
    registration?: string,
	make: string,
    model: string,
    year: number,
    fuel_type: string,
    fuel_tank:number
}

export interface get_fuel_analytics{
    user_id: string;
}

function mpg_to_lper100km(mpg: number): number | null {//helper function for converting mpg to lper100
    if (!mpg || mpg <= 0) return null;
    return 235.215 / mpg;
}

export const vehicle_services={
    async get_all_vehicles(data:get_vehicles): Promise<any[]>{
        const user_id = data.user_id;
        if(!user_id){
            throw new Error("Missing field(s)");
        }
        try{
             //where the creation of the trip will happen
            const user = await prisma.users.findUnique({
                where: {user_id: data.user_id}
            });
            if(!user){
                throw new Error("user not found");
            }//checks if the user exists 
            const vehicles = await prisma.vehicles.findMany({
                where: {
                    users_vehicles: {
                        some: {user_id: data.user_id}
                    }
                },
                include: {
                    trips: {
                        where: { status: "COMPLETED" },
                        select: { distance_km: true, fuel_estimate: true}
                    }
                }
            });

            return vehicles.map(v => {
                const total_distance = v.trips.reduce((acc, t) => acc + Number(t.distance_km || 0), 0);
                const total_fuel = v.trips.reduce((acc, t) => acc + Number(t.fuel_estimate || 0), 0);
                const avg_efficiency = total_fuel > 0? total_distance / total_fuel : 0;

                return{
                    vehicle_id: v.vehicle_id,
                    name: v.name,
                    registration: v.registration,
                    make: v.make,
                    model: v.model,
                    year: v.year,
                    fuel_type: v.fuel_type,
                    image_url: v.image_url ? `upload/vehicle-image/${v.vehicle_id}` : null,
                    mileage: Math.round(total_distance),
                    trip_count: v.trips.length,
                    avg_fuel_efficiency: parseFloat(avg_efficiency.toFixed(2))
                };
            });
        }catch(error){
            throw error;
        }
    },

    async update_vehicle_name(data: update_vehicle_name){
        const assignment = await prisma.users_vehicles.findUnique({
            where: {user_id_vehicle_id: {
                user_id: data.user_id,
                vehicle_id: data.vehicle_id
            }}
        });

        if(!assignment) throw new Error("You do not own this vehicle");

        return await prisma.vehicles.update({
            where: { vehicle_id: data.vehicle_id },
            data: { name: data.name}
        });
    },

    async update_vehicle_image(user_id: string, vehicle_id: string, blob_name: string){
        const assignment = await prisma.users_vehicles.findUnique({
            where: { user_id_vehicle_id: {
                user_id,
                vehicle_id
            }}
        });

        if(!assignment) throw new Error("You do not own this vehicle");

        const existing = await prisma.vehicles.findUnique({
            where: { vehicle_id },
            select: { image_url: true }
        });

        await prisma.vehicles.update({
            where: { vehicle_id },
            data: { image_url: blob_name }
        });

        return {
            display_url: `upload/vehicle-image/${vehicle_id}`,
            previous_blob_name: existing?.image_url
        };
    },

    async get_vehicle_image_blob_name(user_id: string, vehicle_id: string): Promise<string | null> {
        const assignment = await prisma.users_vehicles.findUnique({
            where: { user_id_vehicle_id: { user_id, vehicle_id}}
        });

        if
        (!assignment) throw new Error("You do not own this vehicle");

        const vehicle = await prisma.vehicles.findUnique({
            where: { vehicle_id },
            select: { image_url: true }
        });

        return vehicle?.image_url ?? null;
    },

    /*
    POST /api/vehicle/assign_vehicle{
        user_id,
        vehicle_id     
    }
    */ 
   

    async assign_user_to_vehicle(data:assign_vehicle){//post (will create a vehicle for the user)
      //users need the ability to add a vehicle as their own 
       //will it get the vehicle id from the vin number
       
       try{
            if( !data.user_id || !data.make || !data.model|| !data.year || !data.fuel_type || !data.fuel_tank){
                throw new Error("Missing field(s)");
            } 
            const user = await prisma.users.findUnique({
                where : {user_id:data.user_id}
            });

            if(!user){
                throw new Error("User does not exist");
            }
            
            let benchmark_lper100km: number | null = null;
            let warning: string | null = null;

            try {
                if(data.year >= 2015 && data.year <= 2020){
                    const benchmarks = await fetch_vehicle_benchmark(
                        data.make,
                        data.model,
                        data.year
                    );    

                    const validMpgValues = benchmarks
                        .map((benchmark) => Number(benchmark.combined_mpg))
                        .filter((mpg) => Number.isFinite(mpg) && mpg > 0);

                    if (validMpgValues.length > 0) {
                        const averageMpg = validMpgValues.reduce((sum, mpg) => sum + mpg, 0) / validMpgValues.length;
                        benchmark_lper100km = mpg_to_lper100km(averageMpg);
                    }
                }
            } catch  {
                // CAR API failure is handled by the database fallback below
                console.error("CAR API lookup failed, using database fallback.");
            }

            if (benchmark_lper100km === null) {
                const databaseAverage = await prisma.vehicles.aggregate({
                    where: {
                        make: {
                            equals: data.make.trim(),
                            mode: "insensitive",
                        },
                        model: {
                            equals: data.model.trim(),
                            mode: "insensitive",
                        },
                        year: data.year,
                        fuel_efficiency: {
                            not: null,
                        },
                    },
                    _avg: {
                        fuel_efficiency: true,
                    },
                });

                const average = databaseAverage._avg.fuel_efficiency;

                if(average === null){
                    benchmark_lper100km = 8.0;
                    warning = "Your vehicle is not fully supported. Fuel estimates and efficiency will not be accurate until 5 trips have elapsed."
                }else{
                    benchmark_lper100km = Number(average);
                }
                // benchmark_lper100km = average === null
                //     ? 8.0 // only if all other sources are unavailable
                //     : Number(average);
            }
            
                
                //if it comes back as null then the first trip will be used as the fuel efficiency of the car until the first 5 trips are reached 
                //if (benchmark_lper100km == null && data.year>=2015 && data.year<=2020) return null;
            
             
            const result = await prisma.$transaction(async (tx) => {
                const vehicle = await tx.vehicles.create({
                    data: {
                        name: data.name,
                        registration: data.registration,
                        make: data.make.trim(),
                        model: data.model.trim(),
                        year: data.year,
                        fuel_type: data.fuel_type,
                        fuel_efficiency: benchmark_lper100km,
                        fuel_tank:data.fuel_tank
                    }
                });

                await tx.users_vehicles.create({
                    data: {
                        user_id: data.user_id,
                        vehicle_id: vehicle.vehicle_id
                    }
                });

                return vehicle;
            });

            return {
                data: {
                    vehicle_id: result.vehicle_id,
                    name: result.name,
                    registration: result.registration,
                    make: result.make,
                    model: result.model,
                    year: result.year,
                    fuel_tank: result.fuel_tank,
                    fuel_efficiency: result.fuel_efficiency,
                    fuel_type: result.fuel_type
                },
                warning
                
            };
            
       }catch(error){
            throw error; 
       }
    },

    async remove_vehicle(user_id: string, vehicle_id: string){
        const assignment = await prisma.users_vehicles.findUnique({
            where: { user_id_vehicle_id: { user_id, vehicle_id }}
        });

        if(!assignment) throw new Error("Vehicle not found or not owned by you");
        await prisma.users_vehicles.delete({
            where: { user_id_vehicle_id: { user_id, vehicle_id }}
        });

        const remainingOwners = await prisma.users_vehicles.count({
            where: { vehicle_id }
        });
        if(remainingOwners===0){
            await prisma.vehicles.delete({ where: { vehicle_id }});
        }
        return { message: "Vehicle removed successfully"};
    },

    async get_fuel_analytics(data: get_fuel_analytics){
        //get all vehicles that a user has, reads all the completed trips for each vehicle, computes each trip's fuel usage
        //then calculates the best,worst and average fuel efficiency
        //as well as the historical array by date

        const user_id = data.user_id;

        if (!user_id){
            throw new Error("Missing field(s)");
        }
        try{
            const user = await prisma.users.findUnique({where: {user_id}});

            if(!user){
                throw new Error("User not found");
            }

            const vehicles = await prisma.vehicles.findMany({

                where: {
                    users_vehicles: {some: {user_id}}
                },

                include: { //gets the trips' fuel start,end and distance for analytics
                    trips: {
                        where: {status: "COMPLETED"},
                        select: {
                            distance_km: true,
                            fuel_level_start: true,
                            fuel_level_end: true,
                            end_time: true
                        }
                    }
                }
            });

            const points: { //trip/fuel usage history
                date: string; //needed for the date (so we can make a graph)
                distance_km: number;
                fuel_used_liters: number;
                efficiency_l_per_100km: number;
            }[] = [];

            for (const v of vehicles){ //Check the fuel usage for each car (analytics isn't based on 1 car)

                const tank_liters = v.fuel_tank ? Number(v.fuel_tank) : null;

                if (!tank_liters || tank_liters <= 0){
                    continue;
                }

                for (const t of v.trips){ 

                    const distance_km = t.distance_km ? Number(t.distance_km) : null;
                    const fuel_level_start = t.fuel_level_start != null ? Number(t.fuel_level_start) : null;
                    const fuel_level_end = t.fuel_level_end != null ? Number(t.fuel_level_end) : null;

                    if (distance_km === null || distance_km <= 0 || fuel_level_start === null || fuel_level_end === null){
                        continue;
                    }

                    const fuel_used_liters = ( (fuel_level_start - fuel_level_end) / 100) * tank_liters; //same as in eco score calculations

                    if (fuel_used_liters <= 0){ //bad reading or if fuel was added
                        continue;
                    }

                    const efficiency_l_per_100km = (fuel_used_liters / distance_km) * 100;

                    points.push({
                        date: t.end_time ? t.end_time.toISOString().slice(0,10) : "", distance_km,
                        fuel_used_liters: parseFloat(fuel_used_liters.toFixed(2)),
                        efficiency_l_per_100km: parseFloat(efficiency_l_per_100km.toFixed(2))
                    });
                }
            }
            if (points.length === 0){ //no cars with a tank capacity or no trips without valid fuel data
                return{
                    average_fuel_efficiency: null,
                    best_fuel_efficiency: null,
                    worst_fuel_efficiency: null,
                    history: []
                };
            }
            const efficiencies = points.map(
                p=> p.efficiency_l_per_100km
            );
            const average = efficiencies.reduce(
                (sum,e) => sum + e, 0
            ) / efficiencies.length;

            return{
                average_fuel_efficiency: parseFloat(average.toFixed(2)),
                best_fuel_efficiency: Math.min(...efficiencies),
                worst_fuel_efficiency: Math.max(...efficiencies),
                history: points.sort(
                    (a,b) => a.date.localeCompare(b.date)
                )
            };
        }
        catch(error){
            throw error;
        }
    },


    async get_fuel_comparison(data: { user_id: string }) {
        const { user_id } = data;

        //getting user's primary vehicle
        const vehicle = await prisma.vehicles.findFirst({
            where: { users_vehicles: { some: { user_id } } },
            include: {
                trips: {
                    where: { status: "COMPLETED" },
                    select: { distance_km: true, fuel_estimate: true }
                }
            }
        });

        if (!vehicle) throw new Error("No vehicle found for this user");

        //calculating user average
        const totalDist = vehicle.trips.reduce((sum, t) => sum + Number(t.distance_km || 0), 0);
        const totalFuel = vehicle.trips.reduce((sum, t) => sum + Number(t.fuel_estimate || 0), 0);
        const userAvg = totalDist > 0 ? (totalFuel / totalDist) * 100 : 0;

        //fetching actual manufacturer standard
        const manufacturerStandard = 
            vehicle.make && vehicle.model && vehicle.year
                ? await manufacturer_baseline_service.get_efficiency({
                    make: vehicle.make,
                    model: vehicle.model,
                    year: vehicle.year
                  })
                : null;

        const finalManufacturerStandard = manufacturerStandard ?? 8.0;
        //getting peer leaderboard
        const peers = await prisma.users.findMany({
            where: {
                users_vehicles: {
                    some: { vehicles: { is : {make: vehicle.make, model: vehicle.model} } }
                },
            user_id: { not: user_id }
            },
            include: {
                trips: {
                    where: { status: "COMPLETED" },
                    select: { distance_km: true, fuel_estimate: true }
                }
            },
            take: 10
        });

        const peerLeaderboard = peers.map(p => {
            const pDist = p.trips.reduce((s, t) => s + Number(t.distance_km || 0), 0);
            const pFuel = p.trips.reduce((s, t) => s + Number(t.fuel_estimate || 0), 0);
            const pEff = pDist > 0 ? (pFuel / pDist) * 100 : 7.5;

            return {
                user_id: p.user_id,
                display_name: p.name || p.username,
                efficiency: Number.parseFloat(pEff.toFixed(1))
            };
        })
        .sort((a, b) => a.efficiency - b.efficiency)
        .slice(0, 5)
        .map((p, index) => ({ ...p, rank: index + 1}));

        return {
            vehicle: {
                vehicle_id: vehicle.vehicle_id,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year,
                fuel_type: vehicle.fuel_type,
                registration: vehicle.registration
            },
            manufacturer_standard: Number.parseFloat(finalManufacturerStandard.toFixed(1)),
            user_average: Number.parseFloat(userAvg.toFixed(1)),
            peer_leaderboard: peerLeaderboard
        };
    }
};

export async function fetch_jwt_car_token(){
    const url = `https://carapi.app/api/auth/login`;
    const api_token = process.env.CARAPI_TOKEN;
    const api_secret = process.env.CARAPI_SECRET;
    
    
    if (!api_token || !api_secret) {
        throw new Error("Missing CARAPI_TOKEN or CARAPI_SECRET");
    }

    const response = await fetch(url,{
        method: 'POST',
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            api_token,
            api_secret
        })
    });

    if (!response.ok) {
        const error_body = await response.text();
        throw new Error(`CarAPI token request failed: ${response.status} ${response.statusText} - ${error_body}`);
    }

    const jwt = await response.text();
    // console.log('JWT Token:', jwt);
    return jwt; 
};
interface VehicleBenchmarkTrim {
    id: number;
    make_id: number;
    model_id: number;
    submodel_id: number;
    trim_id: number;
    year: number;
    make: string;
    model: string;
    series: string | null;
    submodel: string | null;
    trim: string;
    trim_description: string;
    fuel_tank_capacity: string;
    combined_mpg: number;
    epa_city_mpg: number;
    epa_highway_mpg: number;
    range_city: number;
    range_highway: number;
    battery_capacity_electric: number | null;
    epa_time_to_charge_hr_240v_electric: number | null;
    epa_kwh_100_mi_electric: number | null;
    range_electric: number | null;
    epa_highway_mpg_electric: number | null;
    epa_city_mpg_electric: number | null;
    epa_combined_mpg_electric: number | null;
}
export async function fetch_vehicle_benchmark(make: string, model: string, year:number):Promise<VehicleBenchmarkTrim[]>{
    // console.log("Fetching benchmark from api")
    const url = `https://carapi.app/api/mileages/v2?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`;

    const jwt = await fetch_jwt_car_token() ;
    // console.log(jwt, "jwt token for carapi");
    const response = await fetch(url,{
        headers:{'Authorization': `Bearer ${jwt}`}
    });
    if (!response.ok) {
        console.log("Request failed");
        throw new Error("Vehicle API request failed");
    }

    const json = await response.json() as { data?: unknown[] };
    // console.log(json);

    const data = json.data ?? [];

    if (data.length === 0) {
        throw new Error(`No vehicle found for ${make} ${model} ${year}`);
    }

    if (!isVehicleBenchmarkArray(data)) {
        throw new Error("Unexpected shape from vehicle benchmark API");
    }

    return data; 
};
function isVehicleBenchmarkArray(value: unknown[]): value is VehicleBenchmarkTrim[] {
    return value.every(item =>
        typeof item === 'object' &&
        item !== null &&
        'combined_mpg' in item &&
        'trim_description' in item
    );
}