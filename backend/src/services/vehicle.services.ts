import { register } from "module";
import prisma from "../db/prisma";
import { parse } from "path";


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
            //create unique vehicle       
            //send the vehicle data to car api and populate the fuel efficiency 
            //update to add the tank capacity
            let benchmark_lper100km: number| null =null;
                if(data.year >= 2015 && data.year <= 2020){
                    try{
                        const ben_trim = await fetch_vehicle_benchmark(data.make,data.model,data.year);
                        if(ben_trim.length === 0){
                            return null ;
                        }
            
                        const  avg_mpg = ben_trim.reduce((sum, ben_trim) => sum + ben_trim.combined_mpg, 0) / ben_trim.length;
                        benchmark_lper100km = mpg_to_lper100km(avg_mpg)
                    }catch(error){
                        console.error(`Benchmark lookup failed  `, error);
                        return null;
                    }
                }
                //if it comes back as null then the first trip will be used as the fuel efficiency of the car until the first 5 trips are reached 
                if (benchmark_lper100km == null) return null;
            
             
            const result = await prisma.$transaction(async (tx) => {
                const vehicle = await tx.vehicles.create({
                    data: {
                        name: data.name,
                        registration: data.registration,
                        make: data.make,
                        model: data.model,
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
                }
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