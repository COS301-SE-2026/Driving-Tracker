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
};
export interface get_directions_request {
    start_lat: number;
    start_lng: number;
    dest_lat: number;
    dest_lng: number;
};
export interface route_summary{
    distance_km: number;
    travel_time_seconds: number;
    traffic_delay_seconds:number;
};
//  (matches what Azure actually sends)
const azure_route_response_schema = z.object({
    routes: z.array(
        z.object({
            summary: z.object({
                lengthInMeters: z.number(),
                travelTimeInSeconds: z.number(),
                trafficDelayInSeconds: z.number().optional(),
            }),
        })
    ),
});
export const map_services ={
    async get_map_token(): Promise<AzureMapsTokenResponse>{
        return {
            token: azure_maps_config.AZURE_MAPS_SUBSCRIPTION_KEY,
            // client_id: azure_maps_config.AZURE_MAPS_CLIENT_ID,
            auth_type: "subscriptionKey"
        };
    },
    async suggested_routes(data: get_directions_request):Promise<route_summary>{
        // console.log("Does it reatch to azure ?")
        const key = azure_maps_config.AZURE_MAPS_SUBSCRIPTION_KEY;
        const query = `${data.start_lat},${data.start_lng}:${data.dest_lat},${data.dest_lng}`;
        const url =
            `https://atlas.microsoft.com/route/directions/json` +
            `?api-version=1.0` +
            `&query=${encodeURIComponent(query)}` +
            `&subscription-key=${key}` +
            `&travelMode=car` +
            `&traffic=true`;
 
        let response: Response;
        try{
            response = await fetch(url); 
        }catch(error){
            throw new Error(`Failed to reach Azure Maps: ${error instanceof Error ? error.message : String(error)}`);
        }
        if(!response.ok) {
            const body = await response.text().catch(() => "");
            throw new Error(`Azure Maps route request failed (${response.status}): ${body}`);
        }
 
        const json = await response.json();
        const parsed = azure_route_response_schema.safeParse(json);
        // console.log(parsed);
 
        if (!parsed.success) {
            throw new Error(`Unexpected Azure Maps response shape: ${parsed.error.message}`);
        }
 
        if (parsed.data.routes.length === 0) {
            throw new Error("No route found between the given start and destination points");
        }
 
        // Azure can return alternative routes if maxAlternatives is set; we didn't
        // request any, so routes[0] is the single best route by default.
        const best = parsed.data.routes[0].summary;
        // console.log(best,"MIght be null");
 
        return {
            distance_km: best.lengthInMeters / 1000,
            travel_time_seconds: best.travelTimeInSeconds,
            traffic_delay_seconds: best.trafficDelayInSeconds ?? 0,
        };

    }
    //further endpoints to be implemented relating to map integration
}