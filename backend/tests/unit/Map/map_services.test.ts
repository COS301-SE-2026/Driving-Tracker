import {describe, it, expect, jest, beforeEach} from '@jest/globals';
import { map_services } from '../../../src/services/map_services';


const mock_fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
globalThis.fetch = mock_fetch; //mocking the global fetch API 

// Helper to build a minimal Response-like object for mockResolvedValue.
function make_response(options: {
    ok: boolean;
    status?: number;
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
}): Response {
    return {
        ok: options.ok,
        status: options.status ?? (options.ok ? 200 : 500),
        json: options.json ?? (async () => ({})),
        text: options.text ?? (async () => ''),
    } as unknown as Response;
};

describe('Map services get_map_token',() =>{
    beforeEach(async() => jest.clearAllMocks());

    it("returns a subscription-key upon success",async ()=>{
        const result = await map_services.get_map_token();

        expect(result.auth_type).toBe('subscriptionKey');
        expect(typeof result.token).toBe('string');
        expect(result.token.length).toBeGreaterThan(0);
    });
});

describe('Map services suggested routes ', ()=>{
    beforeEach(async()=> jest.clearAllMocks());
    const azure_route_response ={
        routes:[
            {
                summary: {
                    lengthInMeters: 12500,
                    travelTimeInSeconds: 900,
                    trafficDelayInSeconds: 60,
                },
                legs: [
                    {
                        points: [
                            { latitude: -25.7461, longitude: 28.2313 },
                            { latitude: -25.75, longitude: 28.24 },
                        ],
                    },
                ],
            },
        ],
    };// the response that azure would provide but it is mocked now 

    it('return a mapped route summary on success', async()=>{
        mock_fetch.mockResolvedValue(
            make_response({
                ok: true,
                json: async ()=> azure_route_response,
            })
        );
        const result = await map_services.suggested_routes({
            start_lat: -25.7461,
            start_lng: 28.2313,
            dest_lat: -25.75,
            dest_lng: 28.24, 
        });
        expect(result).toEqual({
            distance_km: 12.5,
            travel_time_seconds: 900,
            traffic_delay_seconds: 60,
            points: [
                { lat: -25.7461, lng: 28.2313 },
                { lat: -25.75, lng: 28.24 },
            ],
        });

    });
    it('defaults traffic_delay_seconds to 0 when Azure omits', async()=>{
        const response_without_delay ={
            routes: [
                {
                    summary: {
                        lengthInMeters: 1000,
                        travelTimeInSeconds: 120,
                        // trafficDelayInSeconds intentionally omitted
                    },
                    legs: [{ points: [{ latitude: 1, longitude: 2 }] }],
                },
            ],
        };

        mock_fetch.mockResolvedValue(
            make_response({ ok: true, json: async()=> response_without_delay})
        );
        const result = await map_services.suggested_routes({
            start_lat: 1,
            start_lng: 2 ,
            dest_lat:3 ,
            dest_lng: 4
        });
        expect(result.traffic_delay_seconds).toBe(0);
    });

    it('throws a clear error when fetch itself fails', async() =>{
        mock_fetch.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
        await expect(
            map_services.suggested_routes({
                 start_lat: 1,
                start_lng: 2,
                dest_lat: 3,
                dest_lng: 4,
            })
        ).rejects.toThrow('Failed to reach Azure Maps');
    });
    it('throws when Azure response with a non-ok status', async()=>{
        mock_fetch.mockResolvedValue(
            make_response({
                ok: false,
                status: 401,
                text: async () => 'Invalid subscription key',
            })
        );

        await expect(
            map_services.suggested_routes({
               start_lat: 1,
                start_lng: 2,
                dest_lat: 3,
                dest_lng: 4, 
            })
        ).rejects.toThrow('Azure Maps route request failed');
    });
    it('throw when the response shape does not match the expected schema', async ()=>{
        mock_fetch.mockResolvedValue(
            make_response({ ok: true, json: async ()=> ({unexpected: 'shape' })})
        );

        await expect(
            map_services.suggested_routes({
                start_lat:1,
                start_lng: 2,
                dest_lat: 3,
                dest_lng:4,
            })
        ).rejects.toThrow('Unexpected Azure Maps response shape');
    });
});
describe('map services search address', ()=>{
    beforeEach(async() => jest.clearAllMocks());

    it('maps Azure Search results tpp address/lat/lng', async()=>{
        mock_fetch.mockResolvedValue(
            make_response({
                ok: true,
                json: async ()=>({
                    results:[
                        {
                            address:{ freeformAddress: '1 Microsoft Way, Redmond, WA'},
                            position:{ lat: 47.6423, lon: -122.1367}
                        },
                        {
                            address: { freeformAddress: '2 Microsoft Way, Redmond, WA' },
                            position: { lat: 47.6425, lon: -122.137 },
                        },
                    ],
                }),
            })
        );
        const result = await map_services.search_address({ address: 'Microsoft Way, Redmond'});
        expect(result).toEqual([
            { address: '1 Microsoft Way, Redmond, WA', lat: 47.6423, lng: -122.1367 },
            { address: '2 Microsoft Way, Redmond, WA', lat: 47.6425, lng: -122.137 },
        ]);
    });
    it('returns an empty array when Azure finds no matches', async () => {
        mock_fetch.mockResolvedValue(
            make_response({
                ok: true,
                json: async () => ({ results: [] }),
            })
        );
 
        const result = await map_services.search_address({ address: 'nowhere' });
 
        expect(result).toEqual([]);
    });
  
});