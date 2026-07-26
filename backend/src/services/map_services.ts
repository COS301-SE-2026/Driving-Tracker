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
    traffic_delay_seconds: number;
    points: { lat: number; lng: number }[];// points that that will display the shortest route
};

export interface search_address_request{
    address:string;
}
//  (matches what Azure actually sends)
const azure_route_response_schema = z.object({
    routes: z.array(
        z.object({
            summary: z.object({
                lengthInMeters: z.number(),
                travelTimeInSeconds: z.number(),
                trafficDelayInSeconds: z.number().optional(),
            }),
            legs: z.array(
                z.object({
                    points: z.array(
                        z.object({
                            latitude: z.number(),
                            longitude: z.number(),
                        })
                    ),
                })
            ),
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

        if (!parsed.success) {
            throw new Error(`Unexpected Azure Maps response shape: ${parsed.error.message}`);
        }

        const route = parsed.data.routes[0];
        const summary = route.summary;
        
        // Map Azure points to  lat/lng format
        const points = route.legs[0].points.map(p => ({
            lat: p.latitude,
            lng: p.longitude
        }));

        return {
            distance_km: summary.lengthInMeters / 1000,
            travel_time_seconds: summary.travelTimeInSeconds,
            traffic_delay_seconds: summary.trafficDelayInSeconds ?? 0,
            points: points // Return the path
        };

    },
    async search_address(data: search_address_request){
        const key = azure_maps_config.AZURE_MAPS_SUBSCRIPTION_KEY
        const url = `https://atlas.microsoft.com/search/fuzzy/json?api-version=1.0&query=${encodeURIComponent(data.address)}&subscription-key=${key}&language=en-US&limit=5`;
    

        const response = await fetch(url);
        const json = await response.json() as { results: any[] };
    
        return json.results.map((r: any) => ({
            address: r.address.freeformAddress,
            lat: r.position.lat,
            lng: r.position.lon
        }));
    }
    //further endpoints to be implemented relating to map integration
}