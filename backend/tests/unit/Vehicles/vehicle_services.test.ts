jest.mock('../../../src/db/prisma', () => {
    const users = {
        findUnique: jest.fn(),
    };
    const vehicles = {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
    };
    const users_vehicles = {
        findUnique: jest.fn(),
        create: jest.fn(),
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


import { describe, it, expect, jest, beforeEach,afterAll } from '@jest/globals';
import prisma from '../../../src/db/prisma';
import {vehicle_services,fetch_jwt_car_token,fetch_vehicle_benchmark } from '../../../src/services/vehicle.services';


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
            { vehicle_id: 'v1', make: 'BMW', model: 'M3', year: 2018 },
            { vehicle_id: 'v2', make: 'Toyota', model: 'Corolla', year: 2020 },
        ]);

        const result = await vehicle_services.get_all_vehicles({ user_id: 'u1'});

        expect(result).toHaveLength(2);
        expect(mock_prisma.vehicles.findMany).toHaveBeenCalledWith({
            where: {
                users_vehicles: {
                    some: { user_id: 'u1' },
                },
            },
        });  
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
        mock_prisma.users.findUnique.mockResolvedValue({ user_id: 'u1' });
        
        // mock_prisma.users_vehicles.findUnique.mockResolvedValue(null);
        // mock_prisma.vehicles.findUnique.mockResolvedValue(null);

        mock_prisma.vehicles.create.mockResolvedValue({
            vehicle_id: 'v-new-uuid',
            name:'My Car',
            make: 'BMW',
            model: 'M3',
            registration: 'ABC123GP',
            year: 2018,
            fuel_type: 'PETROL'
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
                fuel_type: 'PETROL'
            },
        });
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
 