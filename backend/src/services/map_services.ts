//this will be where tokens and other things need for map processing 
import {z} from "zod";
import prisma from "../db/prisma";

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
    stops?: { lat: number; lng: number; stop_order: number; }[];
};

export interface route_summary{
     distance_km: number;
    travel_time_seconds: number;
    traffic_delay_seconds: number;
    points: { lat: number; lng: number }[];// points that that will display the shortest route
};

export interface RoadDefectQuery{
    lat: number;
    lng: number;
    heading?: number;
    radius_m?: number;
    min_reports?: number;
}

export interface RoadDefect{
    lat: number;
    lng: number;
    reports: number;
    avg_severity: number;
    distance_m: number;
    bearing_deg: number;
}

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
function calculate_distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earth_radius = 6371e3; 
    const distance_lat = (lat2 - lat1) * Math.PI / 180;
    const distance_lng = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(distance_lat / 2) * Math.sin(distance_lat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(distance_lng / 2) * Math.sin(distance_lng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earth_radius * c;
}
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
        //const query = `${data.start_lat},${data.start_lng}:${data.dest_lat},${data.dest_lng}`;

        const sorted_stops = [...(data.stops ?? [])].sort(
            (a, b) => (a.stop_order ?? 0) - (b.stop_order ?? 0)
        );

        const waypoints = [
            { lat: data.start_lat, lng: data.start_lng },
            ...sorted_stops,
            { lat: data.dest_lat, lng: data.dest_lng },
        ];

        const query = waypoints.map(p => `${p.lat},${p.lng}`).join(':');

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
        const points = route.legs.flatMap(leg =>
            leg.points.map(p => ({
                lat: p.latitude,
                lng: p.longitude
            }))
        );

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

        const response = await fetch(url);

        if(!response.ok){
            throw new Error(`Azure Maps request failed: ${response.status} ${response.statusText}`);
        }

        const json = await response.json() as { addresses: any[] };

        const result = json.addresses?.[0];

        return {
            address: result.address?.freeformAddress ?? null,
            road_use: result?.roadUse ?? null,
            speed_limit: result?.address?.speedLimit ?? null,
            municipality: result?.address?.municipality ?? null,
            countryCode: result?.address?.countryCode ?? null,
        };
    },

    async get_road_defects(query: RoadDefectQuery): Promise<RoadDefect[]> {
        const { lat, lng, heading, radius_m = 100, min_reports = 3 } = query;

        const normalized_heading = 
            heading === undefined || heading === null ? null : ((heading % 360) + 360) % 360;

        //bounding box
        const buffer_meters = Math.max(radius_m * 1.5, 200); //square box but diag distance ~ 1.4... - use 1.5
        const lat_offset = buffer_meters / 111_000;//convert buffer meters into degs of lat - 111000 constant
        const cos_lat = Math.cos((lat * Math.PI) / 180);//cos factor for lng shrinkage due to earths curvature
        const lng_offset = buffer_meters / (111_000 * Math.max(Math.abs(cos_lat), 0.01));//convert buffer meters into degs of lng

        const min_lat = lat-lat_offset;
        const max_lat = lat+lat_offset;
        const min_lng = lng-lng_offset;
        const max_lng = lng+lng_offset;

        const raw_candidates = await prisma.$queryRaw<
            Array<{
                lat: number;
                lng: number;
                reports: number;
                avg_severity: number;
            }>
        >`
            SELECT
                ROUND(latitude::numeric, 4)::float as lat,
                ROUND(longitude::numeric, 4)::float as lng,
                COUNT(DISTINCt user_id):: int as reports,
                AVG(intensity)::float as avg_severity
            FROM road_quality_events
            WHERE event_type = 'IMPACT'
                AND latitude BETWEEN ${min_lat} AND ${max_lat}
                AND longitude BETWEEN ${min_lng} AND ${max_lng}
            GROUP BY ROUND(latitude::numeric, 4), ROUND(longitude::numeric, 4)
            HAVING COUNT(DISTINCT user_id) >= ${min_reports}
        `;

        const candidates: RoadDefect[] = raw_candidates.map((candidate) => {
            const cand_lat = Number(candidate.lat);
            const cand_lng = Number(candidate.lng);

            //haversine
            const dLat = ((cand_lat - lat) * Math.PI) / 180;
            const dLng = ((cand_lng - lng) * Math.PI) / 180;
            const radLat1 = (lat * Math.PI) / 180;
            const radLat2 = (cand_lat * Math.PI) / 180;

            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(radLat1) * Math.cos(radLat2) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance_m = 6_371_000 * c;

            //compass bearing formula
            const y = Math.sin(dLng) * Math.cos(radLat2);
            const x = 
                Math.cos(radLat1) * Math.sin(radLat2) -
                Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLng);
            const bearing_rad = Math.atan2(y, x);
            const bearing_deg = ((bearing_rad * 180) / Math.PI + 360) % 360;

            return{
                lat: cand_lat,
                lng: cand_lng,
                reports: Number(candidate.reports),
                avg_severity: Number(Number(candidate.avg_severity).toFixed(2)),
                distance_m: Number(distance_m.toFixed(2)),
                bearing_deg: Number(bearing_deg.toFixed(2)),
            };
        });

        return candidates.filter((defect) => {
            if(defect.distance_m > radius_m){
                return false;
            }
            if(normalized_heading !== null){
                const diff = Math.abs(defect.bearing_deg - normalized_heading) % 360;
                const angular_distance = diff > 180 ? 360 - diff : diff;
                return angular_distance <= 90;
            }
            return true;
        }).sort((a, b) => a.distance_m - b.distance_m);
    },
    async get_all_hotspots(){
        const rawhotspots= await prisma.trip_events.findMany({
            where: {
                OR: [
                    { type: 'HARSH_BRAKE' },
                    { type: 'HARSH_ACCELERATION' }
                ]
            },
            select:{
               latitude: true,
                longitude: true,
                type: true,     
                event_id: true,
                recorded_at: true
            }
        });
        if (rawhotspots.length < 3) return [];
        const filteredHotspots = rawhotspots.filter((p1) => {
            const lat1 = Number(p1.latitude);
            const lng1 = Number(p1.longitude);

            const neighborCount = rawhotspots.reduce((count, p2) => {
                const lat2 = Number(p2.latitude);
                const lng2 = Number(p2.longitude);
                if (Math.abs(lat1 - lat2) > 0.005 || Math.abs(lng1 - lng2) > 0.005) {
                    return count;
                }

                // 2. Precise Haversine distance
                const distance = calculate_distance(lat1, lng1, lat2, lng2);
                return distance <= 500 ? count + 1 : count;
            }, 0);

            return neighborCount >= 3;
        });
        return filteredHotspots.map(h => ({
            event_id: h.event_id,
            event_type: h.type,
            latitude: h.latitude,
            longitude: h.longitude,
            time_stamp: h.recorded_at
        }));
    } 
    
}