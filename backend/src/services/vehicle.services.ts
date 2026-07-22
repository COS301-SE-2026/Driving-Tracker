import prisma from "../db/prisma";


// what do you need to process ?
// user_id 
//then it gets all vehicles associated with that user 
export interface get_vehicles{
    user_id:string;
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
    vehicle_id: string,
    registration: string,
    model: string,
    year: number,
    fuel_type: string
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
                }
            });
            return vehicles
        }catch(error){
            throw error;
        }
        
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
            if(!data.vehicle_id || !data.user_id){
                throw new Error("Missing field(s)");
            } 
            const user = await prisma.users.findUnique({
                where : {user_id:data.user_id}
            });

            if(!user){
                throw new Error("User does not exist");
            }
            //if the vehicle exist already in the database
             // Check if assignment already exists
            const existing_assignment = await prisma.users_vehicles.findUnique({
                where: {
                    user_id_vehicle_id: {
                    user_id: data.user_id,
                    vehicle_id: data.vehicle_id
                    }
                }
            });

            if (existing_assignment) {
                // Do nothing if the user already assigned to this vehicle
                return {
                    data: {
                    vehicle_id: data.vehicle_id,
                    message: "User already assigned to this vehicle"
                    }
                };
            }
            //if the vehicle doesnt exist yet in the db 
            let vehicle = await prisma.vehicles.findUnique({
                where: { vehicle_id: data.vehicle_id }
            });

            //If vehicle doesn't exist, create it
            if (!vehicle) {
                vehicle = await prisma.vehicles.create({
                    data: {
                        vehicle_id: data.vehicle_id,  // VIN number
                        registration: data.registration,
                        model: data.model,
                        year: data.year,
                        fuel_type: data.fuel_type
                    }
                });
            }
            // Assign user to vehicle if vehicle exists in database
            await prisma.users_vehicles.create({
                data: {
                    user_id: data.user_id,
                    vehicle_id: data.vehicle_id
                }
            });

    
            return {
                data:{
                    vehicle_id: vehicle.vehicle_id,
                    model: vehicle.model,
                    registration: vehicle.registration
                }
            };
       }catch(error){
            throw error 
       }
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
    const url = `https://carapi.app/api/mileages/v2?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`;

    const jwt = await fetch_jwt_car_token() ;
    const response = await fetch(url,{
        headers:{'Authorization': `Bearer ${jwt}`}
    });
    if (!response.ok) {
        throw new Error("Vehicle API request failed");
    }

    const json = await response.json() as { data?: unknown[] };

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