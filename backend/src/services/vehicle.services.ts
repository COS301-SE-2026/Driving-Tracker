import prisma from "../db/prisma";


// what do you need to process ?
// user_id 
//then it gets all vehicles associated with that user 
export interface get_vehicles{
    user_id:string;
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
                where: {user_id:user.user_id}
            });
            return vehicles
        }catch(error){
            throw error;
        }
        
    }
}