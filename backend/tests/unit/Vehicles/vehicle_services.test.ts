jest.mock('../../../src/db/prisma', () => {
    const users = {
        findUnique: jest.fn(),
    };
    const vehicles = {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    };
    const users_vehicles = {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    };

    const $transaction = jest.fn(async (fn: any) => await fn({
        users,
        vehicles,
        users_vehicles
    }));
 
    return {
        __esModule: true,
        default: {
            users,
            vehicles,
            users_vehicles,
            $transaction
        },
    };
});


import { describe, it, expect, jest, beforeEach,afterAll,afterEach } from '@jest/globals';
import prisma from '../../../src/db/prisma';
import {vehicle_services,fetch_jwt_car_token,fetch_vehicle_benchmark } from '../../../src/services/vehicle.services';
import { get_fuel_analytics } from '../../../src/controllers/vehicle.controller';



const mock_prisma = prisma as any ;
const mock_fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

globalThis.fetch = mock_fetch;
//helper function for responses 
function make_response(options: {
     ok: boolean;
    status?: number;
    statusText?: string;
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
}): Response {
    return {
        ok: options.ok,
        status: options.status ?? (options.ok ? 200 : 500),
        statusText: options.statusText ?? '',
        json: options.json ?? (async () => ({})),
        text: options.text ?? (async () => ''),
    } as unknown as Response; 
} 


describe ('vehicle services get all vehicles', () =>{
    beforeEach(async () => jest.clearAllMocks());

    it('throws when the user_id is missing', async()=>{
        await expect(
            vehicle_services.get_all_vehicles({ user_id: '' })
        ).rejects.toThrow('Missing field(s)');
    });
    it('throws when user is not found', async()=>{
        mock_prisma.users.findUnique.mockResolvedValue(null);
 
        await expect(
            vehicle_services.get_all_vehicles({ user_id: 'u1' })
        ).rejects.toThrow('user not found');
    });
    it('returns the vehicles assigned to the user', async ()=> {
        mock_prisma.users.findUnique.mockResolvedValue({ user_id: 'u1'});
        mock_prisma.vehicles.findMany.mockResolvedValue([
            { vehicle_id: 'v1', make: 'BMW', model: 'M3', year: 2018, trips: [
                { distance_km: 100, fuel_estimate: 10}
            ] },
            { vehicle_id: 'v2', make: 'Toyota', model: 'Corolla', year: 2020, trips: [] },
        ]);

        const result = await vehicle_services.get_all_vehicles({ user_id: 'u1'});

        expect(result).toHaveLength(2);
        expect(result[0].mileage).toBe(100);
        expect(result[0].avg_fuel_efficiency).toBe(10);
        expect(result[1].mileage).toBe(0); 
    });
    

});


describe('vehicle services assign user to vehicle', ()=>{
    beforeEach(async()=> jest.clearAllMocks());
    const base_payload = {
        user_id: 'u1',
        name: 'My Car',
        registration: 'ABC123GP',
        make: "BMW",
        model: 'M3',
        year: 2018,
        fuel_type: 'PETROL',
        fuel_tank: 60,
    };


    it('Throws when the user or vehicle id is missing', async()=>{
        await expect(
            vehicle_services.assign_user_to_vehicle({...base_payload, make: ''})
        ).rejects.toThrow('Missing field(s)');
    });
     it('throws when the user does not exist', async () => {
        mock_prisma.users.findUnique.mockResolvedValue(null);
 
        await expect(
            vehicle_services.assign_user_to_vehicle(base_payload)
        ).rejects.toThrow('User does not exist');
    });

    // it('returns early with a message when the assignment already exists', async () => {
    //     mock_prisma.users.findUnique.mockResolvedValue({ user_id: 'u1' });
    //     mock_prisma.users_vehicles.findUnique.mockResolvedValue({
    //         user_id: 'u1',
    //         vehicle_id: 'v1',
    //     });
 
    //     const result = await vehicle_services.assign_user_to_vehicle(base_payload);
 
    //     expect(result).toEqual({
    //         data: {
    //             vehicle_id: 'v1',
    //             message: 'User already assigned to this vehicle',
    //         },
    //     });
    //     // should not attempt to create a new assignment row
    //     expect(mock_prisma.users_vehicles.create).not.toHaveBeenCalled();
    // });

    it('creates the vehicle when it does not exist yet, then assigns it', async() =>{
        process.env.CARAPI_TOKEN = "token123";
        process.env.CARAPI_SECRET = "secret123";

        mock_prisma.users.findUnique.mockResolvedValue({ user_id: 'u1' });
        
        // mock_prisma.users_vehicles.findUnique.mockResolvedValue(null);
        // mock_prisma.vehicles.findUnique.mockResolvedValue(null);
         mock_fetch
        .mockResolvedValueOnce(
            make_response({
                ok: true,
                text: async () => "jwt-token",
            })
        )
        .mockResolvedValueOnce(
            make_response({
                ok: true,
                json: async () => ({
                    data: [{ combined_mpg: 25,
                        trim_description:"Test trim",
                    }],
                }),
            })
        );
        
        mock_prisma.vehicles.create.mockResolvedValue({
            vehicle_id: 'v-new-uuid',
            name:'My Car',
            make: 'BMW',
            model: 'M3',
            registration: 'ABC123GP',
            year: 2018,
            fuel_type: 'PETROL',
            fuel_tank: 60,
            fuel_efficiency: 235.215 / 25,
        });

        mock_prisma.users_vehicles.create.mockResolvedValue({});

        const result = await vehicle_services.assign_user_to_vehicle(base_payload);

        expect(mock_prisma.$transaction).toHaveBeenCalled();

        expect(mock_prisma.vehicles.create).toHaveBeenCalledWith({
            data: {
                name: 'My Car',
                registration: 'ABC123GP',
                make: 'BMW',
                model: 'M3',
                year: 2018,
                fuel_type: 'PETROL',
                fuel_tank: 60,
                fuel_efficiency: 235.215 / 25,
            },
        });
        expect(mock_prisma.users_vehicles.create).toHaveBeenCalledWith({
            data: { user_id: 'u1', vehicle_id: 'v-new-uuid' },
        });
        expect(result).toEqual({
            data: {
                vehicle_id: 'v-new-uuid',
                name: 'My Car',
                registration: 'ABC123GP',
                make: 'BMW',
                model: 'M3',
                year: 2018,
                fuel_tank: 60,
                fuel_efficiency: 235.215 / 25,
                fuel_type: 'PETROL'
            },
            warning: null
        });
    });
});

describe ('vehicle services update vehicle name', () =>{
    beforeEach(async () => jest.clearAllMocks());

    it('updates vehicle name successfully', async ()=> {
        mock_prisma.users_vehicles.findUnique.mockResolvedValue({ user_id: 'u1', vehicle_id: 'v1'});
        mock_prisma.vehicles.update.mockResolvedValue({ vehicle_id: 'v1', name: 'New Name' });

        const result = await vehicle_services.update_vehicle_name({ 
            user_id: 'u1',
            vehicle_id: 'v1',
            name: 'New Name'
        });

        expect(mock_prisma.vehicles.update).toHaveBeenCalledWith({
            where: { vehicle_id: 'v1' },
            data: { name: 'New Name' }
        });
        expect(result.name).toBe('New Name');
    });
    
    it('Throws error if the user does not own the vehicle', async()=>{
        mock_prisma.users_vehicles.findUnique.mockResolvedValue(null);
        await expect(
            vehicle_services.update_vehicle_name({
                user_id: 'u1',
                vehicle_id: 'v1',
                name: 'New Name'
            })
        ).rejects.toThrow('You do not own this vehicle');
    });
});

describe ('vehicle services remove vehicle', () =>{
    beforeEach(async () => jest.clearAllMocks());

    it('removes the vehicle assignment successfully', async ()=> {
        mock_prisma.users_vehicles.findUnique.mockResolvedValue({ user_id: 'u1', vehicle_id: 'v1'});
        mock_prisma.users_vehicles.delete.mockResolvedValue({ });
        mock_prisma.users_vehicles.count.mockResolvedValue(1);

        const result = await vehicle_services.remove_vehicle('u1', 'v1');

        expect(mock_prisma.users_vehicles.delete).toHaveBeenCalledWith({
            where: { user_id_vehicle_id: {user_id: 'u1', vehicle_id: 'v1'} }
        });
        expect(result.message).toBe('Vehicle removed successfully');
        expect(mock_prisma.vehicles.delete).not.toHaveBeenCalled();
    });
    
    it('deletes the vehicle entirely if no owners remain', async()=>{
        mock_prisma.users_vehicles.findUnique.mockResolvedValue({user_id: 'u1', vehicle_id: 'v1'});
        mock_prisma.users_vehicles.delete.mockResolvedValue({});
        mock_prisma.users_vehicles.count.mockResolvedValue(0);

        await vehicle_services.remove_vehicle('u1', 'v1');

        expect(mock_prisma.vehicles.delete).toHaveBeenCalledWith({
            where: { vehicle_id: 'v1'}
        });
    });

    it('throws error if the vehice is not found or is not owned by the user', async()=>{
        mock_prisma.users_vehicles.findUnique.mockResolvedValue(null);
        await expect(
            vehicle_services.remove_vehicle('u1', 'v1')
        ).rejects.toThrow('Vehicle not found or not owned by you');
    });
});

describe('fetch jwt car token', ()=>{
    const original_env = process.env;
 
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...original_env, CARAPI_TOKEN: 'token123', CARAPI_SECRET: 'secret123' };
    });
 
    afterAll(() => {
        process.env = original_env;
    });

    it('throws when CARAPI_token is missing', async()=>{
        delete process.env.CARAPI_TOKEN;
        await expect(fetch_jwt_car_token()).rejects.toThrow(
            'Missing CARAPI_TOKEN or CARAPI_SECRET'
        );
    });
    it('throws when CARAPI_SECRET is missing', async () => {
        delete process.env.CARAPI_SECRET;
 
        await expect(fetch_jwt_car_token()).rejects.toThrow(
            'Missing CARAPI_TOKEN or CARAPI_SECRET'
        );
    });
    it('returns the JWT text on a successful login', async () => {
        mock_fetch.mockResolvedValue(
            make_response({ ok: true, text: async () => 'a.jwt.token' })
        );
 
        const jwt = await fetch_jwt_car_token();
 
        expect(jwt).toBe('a.jwt.token');
        expect(mock_fetch).toHaveBeenCalledWith(
            'https://carapi.app/api/auth/login',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_token: 'token123', api_secret: 'secret123' }),
            })
        );
    });

});
describe('fetch_vehicle_benchmark', () => {
    const original_env = process.env;
 
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...original_env, CARAPI_TOKEN: 'token123', CARAPI_SECRET: 'secret123' };
    });
 
    afterAll(() => {
        process.env = original_env;
    });
 
    const valid_trim = {
        id: 1,
        make_id: 1,
        model_id: 1,
        submodel_id: 1,
        trim_id: 1,
        year: 2018,
        make: 'BMW',
        model: 'M3',
        series: null,
        submodel: null,
        trim: 'Competition',
        trim_description: 'M3 Competition',
        fuel_tank_capacity: '60L',
        combined_mpg: 22,
        epa_city_mpg: 18,
        epa_highway_mpg: 26,
        range_city: 300,
        range_highway: 400,
        battery_capacity_electric: null,
        epa_time_to_charge_hr_240v_electric: null,
        epa_kwh_100_mi_electric: null,
        range_electric: null,
        epa_highway_mpg_electric: null,
        epa_city_mpg_electric: null,
        epa_combined_mpg_electric: null,
    };
 
    it('returns benchmark trims on success', async () => {
        mock_fetch
            .mockResolvedValueOnce(
                make_response({ ok: true, text: async () => 'jwt-token' })
            )
            .mockResolvedValueOnce(
                make_response({ ok: true, json: async () => ({ data: [valid_trim] }) })
            );
 
        const result = await fetch_vehicle_benchmark('BMW', 'M3', 2018);
 
        expect(result).toEqual([valid_trim]);
        expect(mock_fetch).toHaveBeenNthCalledWith(
            2,
            'https://carapi.app/api/mileages/v2?make=BMW&model=M3&year=2018',
            { headers: { Authorization: 'Bearer jwt-token' } }
        );
    });
 
    it('throws when the JWT login fails', async () => {
        mock_fetch.mockResolvedValueOnce(
            make_response({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: async () => 'bad creds',
            })
        );
 
        await expect(
            fetch_vehicle_benchmark('BMW', 'M3', 2018)
        ).rejects.toThrow('CarAPI token request failed');
    });
 
    it('throws when the returned data does not match the expected shape', async () => {
        mock_fetch
            .mockResolvedValueOnce(
                make_response({ ok: true, text: async () => 'jwt-token' })
            )
            .mockResolvedValueOnce(
                make_response({
                    ok: true,
                    json: async () => ({ data: [{ unexpected: 'shape' }] }),
                })
            );
 
        await expect(
            fetch_vehicle_benchmark('BMW', 'M3', 2018)
        ).rejects.toThrow('Unexpected shape from vehicle benchmark API');
    });
 
    it('treats a missing data field as an empty result and throws "No vehicle found"', async () => {
        mock_fetch
            .mockResolvedValueOnce(
                make_response({ ok: true, text: async () => 'jwt-token' })
            )
            .mockResolvedValueOnce(
                make_response({ ok: true, json: async () => ({}) })
            );
 
        await expect(
            fetch_vehicle_benchmark('BMW', 'M3', 2018)
        ).rejects.toThrow('No vehicle found for BMW M3 2018');
    });
});
describe("additional vehicle service tests", ()=>{
    beforeEach(() =>{
        jest.clearAllMocks();
        mock_fetch.mockReset();
        process.env.CARAPI_TOKEN ="token123";
        process.env.CARAPI_SECRET="secret123";
    });
    it("returns an empty array when the user has no vehicles", async()=>{
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id:"u1",
        });

        mock_prisma.vehicles.findMany.mockResolvedValue([]);
        const result = await vehicle_services.get_all_vehicles({
            user_id: "u1"
        });
        expect(result).toEqual([]);
        expect(mock_prisma.vehicles.findMany).toHaveBeenCalled();
    });

    it("returns warning when the benchmark API returns no vehicles", async ()=>{
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: "u1"
        });
         mock_fetch.mockResolvedValueOnce(
                make_response({
                    ok: true,
                    text: async () => "jwt-token",
                })
            ).mockResolvedValueOnce(
                make_response({
                    ok: true,
                    json: async () => ({
                        data: [],
                    }),
                })
            );

            const responseShape = {
                vehicle_id: 'v-new-uuid',
                name:'My Car',
                make: 'Dodge',
                model: 'RAM',
                registration: 'ABC123GP',
                year: 2026,
                fuel_type: 'PETROL',
                fuel_tank: 60,
                fuel_efficiency: 235.215 / 25,
            }

            mock_prisma.vehicles.create.mockResolvedValue(responseShape);

        const result = await vehicle_services.assign_user_to_vehicle({
             user_id: "u1",
            name: "My Car",
            registration: "ABC123GP",
            make: "Dodge",
            model: "RAM",
            year: 2026,
            fuel_type: "PETROL",
            fuel_tank: 60,
        });

        expect(result).toEqual({
            data: responseShape,
            warning: "Your vehicle is not fully supported. You will only get fuel estimates after 5 trips"
        });
        
        expect(mock_prisma.$transaction).toHaveBeenCalled();
    });
     it("rejects when the fuel tank is missing", async () => {
        await expect(
            vehicle_services.assign_user_to_vehicle({
                user_id: "u1",
                name: "My Car",
                registration: "ABC123GP",
                make: "BMW",
                model: "M3",
                year: 2018,
                fuel_type: "PETROL",
                fuel_tank: 0,
            })
        ).rejects.toThrow("Missing field(s)");

        expect(mock_prisma.users.findUnique).not.toHaveBeenCalled();
    });
    it("throws when updating a vehicle fails", async () => {
        mock_prisma.users_vehicles.findUnique.mockResolvedValue({
            user_id: "u1",
            vehicle_id: "v1",
        });

        mock_prisma.vehicles.update.mockRejectedValue(
            new Error("Database update failed")
        );

        await expect(
            vehicle_services.update_vehicle_name({
                user_id: "u1",
                vehicle_id: "v1",
                name: "New Name",
            })
        ).rejects.toThrow("Database update failed");
    });
    it("adds unsupported vehicles without fuel efficiency", async () => {
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: "u1",
        });

        mock_prisma.vehicles.create.mockResolvedValue({
            vehicle_id: "v-old",
            name: "Old Car",
            registration: "OLD123",
            make: "BMW",
            model: "M3",
            year: 2010,
            fuel_tank: 60,
            fuel_efficiency: null,
            fuel_type: "PETROL",
        });

        mock_prisma.users_vehicles.create.mockResolvedValue({});

        const result = await vehicle_services.assign_user_to_vehicle({
            user_id: "u1",
            name: "Old Car",
            registration: "OLD123",
            make: "BMW",
            model: "M3",
            year: 2010,
            fuel_tank: 60,
            fuel_type: "PETROL",
            
        });

        expect(mock_fetch).not.toHaveBeenCalled();
        expect(mock_prisma.$transaction).toHaveBeenCalled();

        expect(mock_prisma.vehicles.create).toHaveBeenCalledWith({
            data: {
                name: "Old Car",
                registration: "OLD123",
                make: "BMW",
                model: "M3",
                year: 2010,
                fuel_tank: 60,
                fuel_efficiency: null,
                fuel_type: "PETROL",
            }
        });

        expect(result).toEqual({
            data: {
                vehicle_id: "v-old",
                name: "Old Car",
                registration: "OLD123",
                make: "BMW",
                model: "M3",
                year: 2010,
                fuel_tank: 60,
                fuel_efficiency: null,
                fuel_type: "PETROL",
            },
            warning: "Your vehicle is not fully supported. You will only get fuel estimates after 5 trips",
        });
    });

    it.each([2014,2021])(
        "adds vehicles outside the supported year range: %s",
        async(year) => {
            mock_prisma.users.findUnique.mockResolvedValue({user_id: "u1"});

            mock_prisma.vehicles.create.mockResolvedValue({
                vehicle_id: "v-unsupported",
                year,
                fuel_efficiency: null,
            });

            mock_prisma.users_vehicles.create.mockResolvedValue({});

            const result = await vehicle_services.assign_user_to_vehicle({
                user_id: "u1",
                name: "Unsupported Car",
                registration: "TEST123",
                make: "BMW",
                model: "M3",
                year,
                fuel_type: "PETROL",
                fuel_tank: 60,
            });

            expect(mock_fetch).not.toHaveBeenCalled();
            expect(mock_prisma.$transaction).toHaveBeenCalled();
            expect(result?.warning).toContain("Your vehicle is not fully supported.");
        }
    );
})

describe('vehicle services get fuel analytics', ()=>{
    beforeEach(async() => jest.clearAllMocks());
    afterEach(async() => {jest.restoreAllMocks();
    jest.clearAllMocks();
    });

    it('throws when the user_id is missing', async () =>{
        await expect(vehicle_services.get_fuel_analytics({user_id: ''}))
        .rejects.toThrow('Missing field(s)');
    });

    it('throws when the user is not found', async ()=>{
        mock_prisma.users.findUnique.mockResolvedValue(null);

        await expect(vehicle_services.get_fuel_analytics({user_id: 'u1'}))
        .rejects.toThrow('User not found');
    });

    it('returns analytics for all valid completed trips', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({user_id: 'u1'});
        mock_prisma.vehicles.findMany.mockResolvedValue([
            {
                vehicle_id: 'v1',
                fuel_tank: 60,
                trips: [
                    {
                        distance_km: 100,
                        fuel_level_start: 80,
                        fuel_level_end: 50,
                        end_time: new Date('2026-08-01T00:00:00Z'),
                    }
                ]
            }
        ]);

        const result = await vehicle_services.get_fuel_analytics({
            user_id: 'u1'
        });

        expect(result.average_fuel_efficiency).toBeCloseTo(18,2);
        expect(result.best_fuel_efficiency).toBeCloseTo(18,2);
        expect(result.worst_fuel_efficiency).toBeCloseTo(18,2);
        expect(result.history).toHaveLength(1);

    });

    it('returns 200 with analytics on success', async ()=> {
        const spy = jest.spyOn(vehicle_services, 'get_fuel_analytics').mockResolvedValueOnce({
            average_fuel_efficiency: 8.5,
            best_fuel_efficiency: 7.2,
            worst_fuel_efficiency: 10.1,
            history: []
        });

        const req: any = {user: {sub: 'u1'}};
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({json});
        const res: any = {status};

        await get_fuel_analytics(req,res);

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({
            average_fuel_efficiency: 8.5
        }));

        spy.mockRestore();
    });

    it('returns 403 when unauthenticated', async ()=> {
        const req: any = {user:null};
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({json});
        const res: any = {status};

        await get_fuel_analytics(req,res);
        expect(status).toHaveBeenCalledWith(403)
    });

    it('calculates average,best, and worst efficiency from valid trips', async ()=> {
        mock_prisma.users.findUnique.mockResolvedValue({user_id: 'u1'});
        mock_prisma.vehicles.findMany.mockResolvedValue([
            {
                vehicle_id: 'v1',
                fuel_tank: 60,
                trips: [
                    {
                        distance_km : 100,
                        fuel_level_start: 80,
                        fuel_level_end: 50,
                        end_time: new Date ('2026-08-02T00:00:00Z'),
                    },
                    {
                        distance_km : 200,
                        fuel_level_start: 90,
                        fuel_level_end: 60,
                        end_time: new Date ('2026-08-04T00:00:00Z'),
                    }
                ]
            }
        ]);
        const result = await vehicle_services.get_fuel_analytics({user_id: 'u1'});

        expect(result.history).toHaveLength(2);
        expect(result.average_fuel_efficiency).toBeCloseTo(13.5,1);
        expect(result.best_fuel_efficiency).toBeCloseTo(9,2);
        expect(result.worst_fuel_efficiency).toBeCloseTo(18,2);
    });

    it ('returns null analytics when no valid trip data exists',async()=>{
        mock_prisma.users.findUnique.mockResolvedValue({user_id: 'u1'});
        mock_prisma.vehicles.findMany.mockResolvedValue([
            {
                vehicle_id: 'v1',
                fuel_tank: 60,
                trips: [
                    {
                        distance_km: 0,
                        fuel_level_start: 80,
                        fuel_level_end: 50,
                        end_time: new Date('2026-08-01T00:00:00Z'),
                    }
                ]
            }
        ]);
        const result = await vehicle_services.get_fuel_analytics({user_id: 'u1'});
        expect(result.average_fuel_efficiency).toBeNull();
        expect(result.best_fuel_efficiency).toBeNull();
        expect(result.worst_fuel_efficiency).toBeNull();
        expect(result.history).toEqual([]);
    });

	describe('vehicle services update vehicle image', () => {
		it('updates image successfully', async () => {
			mock_prisma.users_vehicles.findUnique.mockResolvedValue({user_id: 'user-1', vehicle_id: 'v1'});
			mock_prisma.vehicles.findUnique.mockResolvedValue({ vehicle_id: 'v1', image_url: 'old'});
			mock_prisma.vehicles.update.mockResolvedValue({});

			const result = await vehicle_services.update_vehicle_image('user-1', 'v1', 'new');
			expect(result.previous_blob_name).toBe('old');
		});

		it('throws if ownerships check fails', async () => {
			mock_prisma.users_vehicles.findUnique.mockResolvedValue(null);
			await expect(vehicle_services.update_vehicle_image('user-1', 'v1', 'new'))
				.rejects.toThrow('You do not own this vehicle');
		});
	});
});
 