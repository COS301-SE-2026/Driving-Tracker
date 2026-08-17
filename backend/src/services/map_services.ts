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

const AZURE_MAPS_CATEGORIES = {
    petrol: 7311,
    rest_area: 7395,
    parking: 7369,
}

type PoiCategoryKey = keyof typeof AZURE_MAPS_CATEGORIES;
type PoiRequestType = PoiCategoryKey | 'stops' | 'all';

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
    },
    //Fetches points of interest within a specified radius from the provided location
    async get_nearby_pois(lat: number, lng: number, limit: number = 10, type: string = 'stops', radiusMeters: number = 5000){
        const key = azure_maps_config.AZURE_MAPS_SUBSCRIPTION_KEY

        if(!lat || !lng || lat == 0.0 || lng == 0.0){
            throw new Error("Location coordinates missing or invalid");
        }

        const normalized_type = type?.trim().toLowerCase();

        const is_valid_type = normalized_type === 'stops' || normalized_type === 'all' || normalized_type in AZURE_MAPS_CATEGORIES;

        if(!is_valid_type){
            throw new Error("Invalid type");
        }

        const poi_type: PoiRequestType = normalized_type as PoiRequestType;

        let category_Ids: number[] | null = null;

        if(poi_type === 'stops'){
            category_Ids = [AZURE_MAPS_CATEGORIES.petrol, AZURE_MAPS_CATEGORIES.rest_area, AZURE_MAPS_CATEGORIES.parking]

        } else if(poi_type !== 'all'){
            category_Ids = [AZURE_MAPS_CATEGORIES[poi_type]];
        }


        const params = new URLSearchParams({
            'api-version':'1.0',
            lat: String(lat),
            lon: String(lng),
            radius: String(radiusMeters),
            limit: String(limit),
            language: 'en-US',
            'subscription-key': key,
        });

        if(category_Ids){
            params.set('categorySet', category_Ids.join(','));
        }

        const url = `https://atlas.microsoft.com/search/nearby/json?${params.toString()}`;

        const response = await fetch(url);

        if(!response.ok){
            
            throw new Error(`Azure Maps request failed: ${response.status} ${response.statusText}`);
        }

        const json = await response.json() as { results: any[] };

        return (json.results?? []).map((result: any)=>({
            name: result.poi?.name ?? "Unknown",
            category: result.poi?.classifications?.[0]?.code ?? result.poi?.categories?.[0] ?? null,
            latitude: result.position?.lat,
            longitude: result.position?.lon,
            distanceMeters: result.dist,
            address: result.address?.freeformAddress ?? null
        }));

    },
    //gets address from coordinates including roadUse and speedLimit
    async reverse_geocode(lat: number, lng: number){
        const key = azure_maps_config.AZURE_MAPS_SUBSCRIPTION_KEY

        if(!lat || !lng|| lat == 0.0 || lng == 0.0){
            throw new Error("Location coordinates missing or invalid");
        }

        const params = new URLSearchParams({
            'api-version':'1.0',
            query: `${lat},${lng}`,
            language: 'en-US',
            returnSpeedLimit: 'true',
            returnRoadUse: 'true',
            'subscription-key': key,
        });

        const url = `https://atlas.microsoft.com/search/address/reverse/json?${params.toString()}`;

        console.log("Reverse geocode URL:",  url);

        const response = await fetch(url);

        if(!response.ok){
            throw new Error(`Azure Maps request failed: ${response.status} ${response.statusText}`);
        }

        const json = await response.json() as { addresses: any[] };

        console.log('Full address object:', JSON.stringify(json.addresses?.[0], null, 2));

        const result = json.addresses?.[0];

        return {
            address: result.address?.freeformAddress ?? null,
            road_type: result?.roadUse ?? null,
            speed_limit: result?.address?.speedLimit ?? null,
            municipality: result?.address?.municipality ?? null,
            countryCode: result?.address?.countryCode ?? null,
        };
    }
    
}