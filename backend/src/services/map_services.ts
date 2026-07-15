//this will be where tokens and other things need for map processing 
import {z} from "zod";

const azure_maps_config_schema = z.object({
    AZURE_MAPS_SUBSCRIPTION_KEY: z.string().min(1, "AZURE_MAPS_SUBSCRIPTION_KEY is required"),
    AZURE_MAPS_CLIENT_ID: z.string().optional(),
});

const config_result = azure_maps_config_schema.safeParse({
    AZURE_MAPS_SUBSCRIPTION_KEY: process.env.AZURE_MAPS_SUBSCRIPTION_KEY,
    AZURE_MAPS_CLIENT_ID: process.env.AZURE_MAPS_CLIENT_ID,
});

if(!config_result.success){
    throw new Error(`Azure maps config error ${config_result.error.issues.map((issue) => issue.message).join(", ")}`);
}

const azure_maps_config = config_result.data;

export interface AzureMapsTokenResponse{
    token: string ;
    // client_id: string;
    auth_type: "subscriptionKey";
}
export const map_services ={
    async get_map_token(): Promise<AzureMapsTokenResponse>{
        return {
            token: azure_maps_config.AZURE_MAPS_SUBSCRIPTION_KEY,
            // client_id: azure_maps_config.AZURE_MAPS_CLIENT_ID,
            auth_type: "subscriptionKey"
        };
    },

    //further endpoints to be implemented relating to map integration
}