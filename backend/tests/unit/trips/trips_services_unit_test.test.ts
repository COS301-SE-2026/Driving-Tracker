jest.mock('../../../src/services/map_services', () => ({
    map_services: {
        get_map_token: jest.fn(),
        suggested_routes: jest.fn<() => Promise<{
            distance_km: number;
            travel_time_seconds: number;
            traffic_delay_seconds: number;
        }>>().mockResolvedValue({
            distance_km: 10,
            travel_time_seconds: 600,
            traffic_delay_seconds: 0,
        }),
        search_address: jest.fn(),
        reverse_geocode: jest.fn(),
        get_nearby_pois: jest.fn(),
    },
}));

jest.mock('../../../src/db/prisma', () => {
    const trips = {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
    };
     const vehicles = {
        findUnique: jest.fn(),
    };
    const trip_location_shares = {
        create: jest.fn(),
        updateMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn()
    };
    const trip_scores = {
        create: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
    };
    const trip_readings = {
        create: jest.fn(),
        findMany: jest.fn(),
        createMany: jest.fn()
    };
    const trip_events = {
        create: jest.fn(),
    };
    const users = {
        findUnique: jest.fn(),
    };
    const trusted_contacts = {
        findMany: jest.fn(),
    };
    const unexpected_stop_events = {
        create: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
    }

    return {
        __esModule: true,
        default: {
        $transaction: jest.fn((callback: any) => callback({
            trips,
            trip_location_shares,
            trip_scores,
            trip_readings,
            trip_events,
            users,
            trusted_contacts,
            unexpected_stop_events,
        })),
        users,
        trips,
        vehicles,
        trip_scores,
        trip_readings,
        trip_events,
        trip_location_shares,
        trusted_contacts,
        unexpected_stop_events,
        },
    };
});
jest.mock('../../../src/utils/notification', () => ({
    add_notification: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

jest.mock('../../../src/services/notification_service', () => ({
    notification_services: {
        send_trip_shared_notification: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        send_trip_alert_notification: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        send_unexpected_stop_notification: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        send_trip_revoked_notification: jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    },
}));
jest.mock('../../../src/services/vehicle.services', () => ({
    fetch_vehicle_benchmark: jest.fn<() => Promise<{ combined_mpg: number }[]>>().mockResolvedValue([
        { combined_mpg: 25 },
    ]),
}));
jest.mock('../../../src/services/user_devices_services', () => ({
    user_devices_services: {
        get_multiple_users_fcm_tokens: jest.fn<() => Promise<string[]>>().mockResolvedValue(['fcm-token-1']),
    },
}));
jest.mock("../../../src/utils/trip_scores_cal", () =>({
    calculate_trip_scores: jest.fn<() => Promise<{
        safety_score: number;
        eco_score: number | null;
        overall_score: number;
    }>>().mockResolvedValue({
        safety_score: 95,
        eco_score: 88,
        overall_score: 91,
    }),
}));

jest.mock('../../../src/utils/auto_ai', () => ({
    driver_profile: jest.fn<() => Promise<any>>().mockResolvedValue({
        user_id: 'u1',
        driver_score: 90,
        driver_type: 'SAFE_DRIVER',
        confidence: 'medium',
        events_per_100km: { harsh_brake: 0, harsh_acceleration: 0, sharp_corner: 0, crash_like: 0 },
        crash_override_applied: false,
        rationale: 'mocked',
        recent_trip_impact: null,
        eco_score: 88,
        safety_score: 95,
        overall_score: 91,
    }),
}));

jest.mock('../../../src/utils/notification');

import {describe, it, expect, jest, beforeEach} from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { trips_services } from '../../../src/services/trips_services';
import { contact_services } from '../../../src/services/contacts_services';
import { add_notification } from '../../../src/utils/notification';
import { user_devices_services } from '../../../src/services/user_devices_services';
import { notification_services } from '../../../src/services/notification_service';
import { fetch_vehicle_benchmark } from '../../../src/services/vehicle.services';
import { calculate_trip_scores } from '../../../src/utils/trip_scores_cal';
import { driver_profile } from '../../../src/utils/auto_ai';
const mock_fetch_vehicle_benchmark = fetch_vehicle_benchmark as jest.MockedFunction<typeof fetch_vehicle_benchmark>;
const mock_calculate_trip_scores = calculate_trip_scores as jest.MockedFunction<typeof calculate_trip_scores>;
const mock_driver_profile = driver_profile as jest.MockedFunction<typeof driver_profile>;
import { map_services } from '../../../src/services/map_services';
import { map } from 'zod';
 
const mock_map_services = map_services as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mock_prisma = prisma as any;

const mock_add_notification = add_notification as jest.MockedFunction<typeof add_notification>

class MockDecimal {
    constructor(private value: number) {}
    toNumber() {
        return this.value;
    }
};
describe('Trips services.create - wu=ith end location (fuel estimate flow) ', () => {
    beforeEach(async()=> jest.clearAllMocks());
    it("Calls map services. suggested routes and returns planned distance and end location",
        async()=>{
            (mock_prisma.users.findUnique).mockResolvedValue({ user_id: 'u1' });
            (mock_prisma.trips.findFirst).mockResolvedValue(null);
            (mock_prisma.vehicles.findUnique).mockResolvedValue({
                make: 'BMW',
                model: 'M3',
                year: 2018,
            });
            (mock_prisma.trips.create).mockResolvedValue({
                trip_id: 't1',
                data_source: 'PHONE',
            });   
            mock_fetch_vehicle_benchmark.mockResolvedValue([{combined_mpg: 25}as any]);
            const result = await trips_services.create({
                user_id: 'u1' ,
                vehicle_id: 'v1',
                data_source: 'PHONE',
                start_date: new Date('2026-05-20'),
                start_location: { lat: -25.7461, lng: 28.2313},
                end_location: { lat: -25.75, lng: 28.24},
            });
            expect(mock_map_services.suggested_routes).toHaveBeenCalledWith({
                start_lat: -25.7461,
                start_lng: 28.2313,
                dest_lat: -25.75,
                dest_lng: 28.24,
            });
            expect(result?.planned_distance_km).toBe(10);
            // expect(result?.fuel_estimate).toBeNull();
        }
    );
    it('does not call fetch_vehicle_benchmark when vehicle is outside 2015-2020', async ()=>{
        (mock_prisma.users.findUnique).mockResolvedValue({ user_id: 'u1' });
        (mock_prisma.trips.findFirst).mockResolvedValue(null);
        (mock_prisma.vehicles.findUnique).mockResolvedValue({
            make: 'BMW',
            model: 'M3',
            year: 2024,
        });
        (mock_prisma.trips.create).mockResolvedValue({
            trip_id: 't1',
            data_source: 'PHONE',
        });

        const result = await trips_services.create({
            user_id: 'u1',
            vehicle_id: 'v1',
            data_source: 'PHONE',
            start_date: new Date('2026-05-20'),
            start_location: { lat: -25.7461, lng: 28.2313 },
            end_location: { lat: -25.75, lng: 28.24 },
        });
 
        // expect(result?.fuel_estimate).toBeNull();
        expect(result?.planned_distance_km).toBe(10);
    });

});

describe('Trips services.create',()=>{
    beforeEach(async()=> jest.clearAllMocks());

    it('creates a trip when valid input comes in', async()=>{
        (mock_prisma.users.findUnique ).mockResolvedValue({ user_id: 'u1' });
        (mock_prisma.trips.findFirst ).mockResolvedValue(null);
        (mock_prisma.trips.create).mockResolvedValue({
            trip_id: 't1',
            data_source: 'PHONE',
        });
        (mock_prisma.vehicles.findUnique).mockResolvedValue({
            make: 'BMW',
            model: 'M3',
            year: 2018,
        });

        const result = await trips_services.create({
            user_id: 'u1',
            vehicle_id: 'v1',
            data_source: 'PHONE',
            start_date: new Date('2026-05-20'),
            start_location: { lat: -25.7461, lng: 28.2313 },
        });

        expect(result).toEqual({
            trip_id: 't1',
            data_source: 'PHONE',
            planned_distance_km: null,
            fuel_estimate: null,
        });
    });
    it('throws when user_id is missing from body', async ()=>{
        await expect(
            trips_services.create({
                user_id: '',
                vehicle_id: 'v1',
                data_source: 'PHONE',
                start_date: new Date(),
                start_location: { lat: 1, lng: 2 },
            })
        ).rejects.toThrow('Missing required fields');
    });
    it('Throws when the start location is invalid', async ()=>{
        await expect(
            trips_services.create({
                user_id: 'u1',
                vehicle_id: 'v1',
                data_source: 'PHONE',
                start_date: new Date(),
                start_location: { lat: 0, lng: 0 },
            })
        ).rejects.toThrow('Unknown start location');
    });

    it('throws when user is not known',async ()=>{
        (mock_prisma.users.findUnique).mockResolvedValue(null);
         
        await expect(
            trips_services.create({
                user_id: 'u1',
                vehicle_id: 'v1',
                data_source: 'PHONE',
                start_date: new Date('2026-05-20'),
                start_location: { lat: -25.7461, lng: 28.2313 },
            })
        ).rejects.toThrow('user not found');
    });

    it('Thro when the trip is already in progress', async()=>{
        (mock_prisma.users.findUnique).mockResolvedValue({ user_id: 'u1' });
        (mock_prisma.trips.findFirst ).mockResolvedValue({trip_id: 'active',status: 'IN_PROGRESS',});

        await expect(
            trips_services.create({
                user_id: 'u1',
                vehicle_id: 'v1',
                data_source:'PHONE',
                start_date: new Date(),
                start_location: { lat: 1, lng: 2 }
            })
        ).rejects.toThrow('Trip already in progress');
    });

    it('throws when selected contacts are invalid', async()=>{
        (mock_prisma.users.findUnique).mockResolvedValue({ user_id: 'u1' });
        (mock_prisma.trips.findFirst ).mockResolvedValue(null);
        mock_prisma.trusted_contacts.findMany.mockResolvedValue([]);
        (mock_prisma.vehicles.findUnique).mockResolvedValue({
            make: 'BMW',
            model: 'M3',
            year: 2018,
        });

        await expect(
            trips_services.create({
                user_id: 'u1',
                vehicle_id: 'v1',
                data_source: 'PHONE',
                start_date: new Date('2026-05-20'),
                start_location: { lat: -25.7461, lng: 28.2313 },
                share_with_contacts: ['c1'],
            })
        ).rejects.toThrow('Invalid contacts selection');
    });
});

describe('Trips services end_trip',()=>{
    beforeEach(async()=> jest.clearAllMocks());
    it('end trip accept', async()=>{
        (mock_prisma.trips.findUnique).mockResolvedValue({trip_id: 't1',
            user_id: 'u1',
            status: 'IN_PROGRESS',
            vehicle_id: 'v1',
            fuel_estimate: 3.2, 
        });
        (mock_prisma.trips.update).mockResolvedValue({trip_id: 't1',
            distance_km: 45.5,
            status: 'COMPLETED',
        });
        (mock_prisma.trip_scores.findFirst).mockResolvedValue(null);
        (mock_prisma.trip_scores.create).mockResolvedValue({
            safety_score: 95,
            eco_score: 88,
            overall_score: 91,
        });
        (mock_prisma.users.findUnique).mockResolvedValue({
            username: 'testuser',
        });
        (mock_prisma.trips.count).mockResolvedValue(1);
        const result = await trips_services.end_trip({
            trip_id: 't1',
            user_id: 'u1',
            end_time: new Date(),
            route_polyline: 'polyline',
            distance_km: 45.5,
            duration_minutes: 60,
            fuel_estimate: 3.2,
            status: 'COMPLETED',
            
        });

        expect(result.trip_id).toBe('t1');
        expect(result.status).toBe('COMPLETED');
    });

    it('end trip updates existing score', async()=>{
        (mock_prisma.trips.findUnique).mockResolvedValue({trip_id: 't1',
            user_id: 'u1',
            status: 'IN_PROGRESS',
            vehicle_id: 'v1',
            fuel_estimate: 3.2,
        });
        (mock_prisma.trips.update).mockResolvedValue({trip_id: 't1',
            distance_km: 45.5,
            status: 'COMPLETED',
        });
        (mock_prisma.trip_scores.findFirst).mockResolvedValue({ score_id: 's1' });
        (mock_prisma.trip_scores.update).mockResolvedValue({
            safety_score: 90,
            eco_score: 87,
            overall_score: 89,
        });
        (mock_prisma.users.findUnique).mockResolvedValue({
            username: 'testuser',
        });
        (mock_prisma.trips.count).mockResolvedValue(2);

        const result = await trips_services.end_trip({
            trip_id: 't1',
            user_id: 'u1',
            end_time: new Date(),
            route_polyline: 'polyline',
            distance_km: 45.5,
            duration_minutes: 60,
            fuel_estimate: 3.2,
            status: 'COMPLETED',
            
        });

        expect(result.trip_id).toBe('t1');
        expect(mock_prisma.trip_scores.update).toHaveBeenCalled();
    });
    it('throws when trip not found', async()=>{
        (mock_prisma.trips.findUnique).mockResolvedValue(null);
         
        await expect(
            trips_services.end_trip({
                trip_id: 't1',
                user_id: 'u1',
                end_time: new Date(),
                route_polyline: 'polyline',
                distance_km: 45.5,
                duration_minutes: 60,
                fuel_estimate: 3.2,
                status: 'COMPLETED',
                
            })
        ).rejects.toThrow('Trip not found');
    });

    it('throws when user does not own trip', async()=>{
        (mock_prisma.trips.findUnique).mockResolvedValue({
            trip_id:'t1',
            user_id: 'u2',
            status: 'IN_PROGRESS',
        });

        await expect(
            trips_services.end_trip({
                trip_id: 't1',
                user_id: 'u1',
                end_time: new Date(),
                route_polyline: 'polyline',
                distance_km: 45.5,
                duration_minutes: 60,
                fuel_estimate: 3.2,
                status: 'COMPLETED',
               
            })
        ).rejects.toThrow('You do not own this trip');
    });

    it('throws when trip not IN_PROGRESS', async()=>{
        (mock_prisma.trips.findUnique).mockResolvedValue({
            trip_id:'t1',
            user_id: 'u1',
            status: 'COMPLETED',
        });

        await expect(
            trips_services.end_trip({
                trip_id: 't1',
                user_id: 'u1',
                end_time: new Date(),
                route_polyline: 'polyline',
                distance_km: 45.5,
                duration_minutes: 60,
                fuel_estimate: 3.2,
                status: 'COMPLETED',
                
            })
        ).rejects.toThrow('Cannot end a trip with status');
    });
});
describe('Trips sevice.get_trip_shares', () =>{
    beforeEach(async () => jest.clearAllMocks());
    it('returns active shares for a trip the user owns',async () =>{
        mock_prisma.trips.findUnique.mockResolvedValue({ user_id: 'u1'});
        mock_prisma.trip_location_shares.findMany.mockResolvedValue([
            {
                share_id: 's1',
                trip_id: 't1',
                revoked_at: null,
                contact:{
                    contact_id: 'c1',
                    name: 'Jane',
                    email:' jane@example.com',
                },
            },
        ]);
        const result = await trips_services.get_trip_shares('u1','t1');

        expect(mock_prisma.trips.findUnique).toHaveBeenCalledWith({
            where: {trip_id: 't1', user_id: 'u1'},
            select: { user_id: true}
        });
        expect(mock_prisma.trip_location_shares.findMany).toHaveBeenCalledWith({
            where: {trip_id: 't1', revoked_at: null},
            include:{ 
                contact:{
                    select:{
                        contact_id: true,
                        name: true, 
                        email: true,
                    },
                },
            },
        });
        expect(result.length).toBe(1);
        expect(result[0].contact.contact_id).toBe('c1');
    });
    it('returns empty array when the trip has no active shares', async ()=>{
        mock_prisma.trips.findUnique.mockResolvedValue({ user_id: 'u1' });
        mock_prisma.trip_location_shares.findMany.mockResolvedValue([]);

        const result = await trips_services.get_trip_shares('u1', 't1');

        expect(result).toEqual([]);
    });
    it('throws when the trip is not found or not owned by the user', async()=>{
        mock_prisma.trips.findUnique.mockResolvedValue(null);
        await expect(
            trips_services.get_trip_shares('u1','t1')
        ).rejects.toThrow('trip not found or You do not own this trip');
        expect(mock_prisma.trip_location_shares.findMany).not.toHaveBeenCalled();
    });
});
describe('Trips services.revoke_share', () =>{
    beforeEach(async () => jest.clearAllMocks());
    it('Revokes a share, notifies the contact in-app via push', async () => {
        mock_prisma.trip_location_shares.findFirst.mockResolvedValue({
            share_id: 's1',
            owner: { username: 'jsmith', name: 'John', surname: 'Smith'},
            contact: { contact_user_id: 'u2'},
        });
        mock_prisma.trip_location_shares.delete.mockResolvedValue({ share_id: 's1'});

        jest.spyOn(user_devices_services, 'get_multiple_users_fcm_tokens').mockResolvedValue(['fcm-token-1']);
        jest.spyOn(notification_services,'send_trip_revoked_notification').mockResolvedValue(undefined);
        mock_add_notification.mockResolvedValue(undefined);
        const result = await trips_services.revoke_share('u1', 'c1', 't1');

        expect(mock_prisma.trip_location_shares.findFirst).toHaveBeenCalledWith({
            where: { trip_id: 't1', contact_id: 'c1', owner_user_id: 'u1' },
            include: {
                owner: { select: { username: true, name: true, surname: true } },
                contact: { select: { contact_user_id: true } },
            },
        });

        expect(mock_prisma.trip_location_shares.delete).toHaveBeenCalledWith({
            where: { share_id: 's1' },
        });

        expect(mock_add_notification).toHaveBeenCalledWith({
            user_ids: ['u2'],
            type: 'GENERAL',
            title: 'Trip Access Revoked',
            body: 'John Smith has stopped sharing their trip with you.',
            reference_ids: ['t1'],
            reference_type: 'trips',
        });

        expect(user_devices_services.get_multiple_users_fcm_tokens).toHaveBeenCalledWith(['u2']);
        expect(notification_services.send_trip_revoked_notification).toHaveBeenCalledWith(
            ['fcm-token-1'],
            'John Smith',
            't1'
        );

        expect(result).toEqual({ success: true });
    });
    it('falls back to username when owner name/surname are missing', async () => {
        mock_prisma.trip_location_shares.findFirst.mockResolvedValue({
            share_id: 's1',
            owner: { username: 'jsmith', name: null, surname: null },
            contact: { contact_user_id: 'u2' },
        });
        mock_prisma.trip_location_shares.delete.mockResolvedValue({ share_id: 's1' });

        jest.spyOn(user_devices_services, 'get_multiple_users_fcm_tokens')
            .mockResolvedValue(['fcm-token-1']);
        jest.spyOn(notification_services, 'send_trip_revoked_notification')
            .mockResolvedValue(undefined);
        mock_add_notification.mockResolvedValue(undefined);

        await trips_services.revoke_share('u1', 'c1', 't1');

        expect(mock_add_notification).toHaveBeenCalledWith(
            expect.objectContaining({
                body: 'jsmith has stopped sharing their trip with you.',
            })
        );
        expect(notification_services.send_trip_revoked_notification).toHaveBeenCalledWith(
            ['fcm-token-1'],
            'jsmith',
            't1'
        );
    });
})
describe('Trips services.record', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('records trip data successfully', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u1',
        });
        mock_prisma.trip_readings.create.mockResolvedValue({
            reading_id: 'r1',
        });

        await trips_services.record({
            user_id: 'u1',
            trip_id: 't1',
            recorded_at: new Date(),
            data_source: 'OBD',
            location: { lng: 28.2313, lat: -25.7461 },
            speed_kmh: 80,
            accelerometer: 0.5,
            gyroscope_x: 0.1,
            gyroscope_y: 0.1,
            gyroscope_z: 0.1,
            rpm: 3000,
            coolant_temp: 95,
            fuel_trim_percent: 0,
            throttle_position: 25,
            dtc_codes: [],
        });

        expect(mock_prisma.trip_readings.create).toHaveBeenCalled();
    });

    it('throws when trip not found', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue(null);

        await expect(
            trips_services.record({
                user_id: 'u1',
                trip_id: 't1',
                recorded_at: new Date(),
                data_source: 'OBD',
                location: { lng: 1, lat: 1 },
                speed_kmh: 80,
                accelerometer: 0.5,
                gyroscope_x: 0.1,
                gyroscope_y: 0.1,
                gyroscope_z: 0.1,
                rpm: 3000,
                coolant_temp: 95,
                fuel_trim_percent: 0,
                throttle_position: 25,
                dtc_codes: [],
            })
        ).rejects.toThrow('Trip not found');
    });

    it('throws when user does not own trip', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u2',
        });

        await expect(
            trips_services.record({
                user_id: 'u1',
                trip_id: 't1',
                recorded_at: new Date(),
                data_source: 'OBD',
                location: { lng: 1, lat: 1 },
                speed_kmh: 80,
                accelerometer: 0.5,
                gyroscope_x: 0.1,
                gyroscope_y: 0.1,
                gyroscope_z: 0.1,
                rpm: 3000,
                coolant_temp: 95,
                fuel_trim_percent: 0,
                throttle_position: 25,
                dtc_codes: [],
            })
        ).rejects.toThrow('You do not own this trip');
    });
});

describe('Trips services.get_history', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('returns trip history with stats', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
            username: 'testuser',
        });
        mock_prisma.trips.findMany.mockResolvedValue([
            {
                trip_id: 't1',
                distance_km: 45.5,
                duration_minutes: 60,
                trip_scores: [{ safety_score: 95, eco_score: 88, overall_score: 91 }],
            },
            {
                trip_id: 't2',
                distance_km: 30,
                duration_minutes: 45,
                trip_scores: [{ safety_score: 92, eco_score: 85, overall_score: 88 }],
            },
        ]);

        const result = await trips_services.get_history({
            user_id: 'u1',
            start_date: new Date('2026-05-01'),
            end_date: new Date('2026-05-31'),
            status: 'COMPLETED',
        });

        expect(result.total_trips).toBe(2);
        expect(result.meta.mean_distance).toBeGreaterThan(0);
    });

    it('throws when user not found', async () => {
        mock_prisma.users.findUnique.mockResolvedValue(null);

        await expect(
            trips_services.get_history({
                user_id: 'u1',
                start_date: new Date(),
            })
        ).rejects.toThrow('User not found');
    });

    it('throws when invalid start date', async () => {
        await expect(
            trips_services.get_history({
                user_id: 'u1',
                start_date: new Date('invalid'),
            })
        ).rejects.toThrow('Invalid start date');
    });
});

describe('Trips services.get_summary', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('returns trip summary successfully', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u1',
            vehicle_id: 'v1',
            status: 'COMPLETED',
            data_source: 'OBD',
            route_polyline: 'polyline',
            distance_km: new MockDecimal(45.5),
            duration_minutes: 60,
            fuel_estimate: new MockDecimal(3.2),
            start_time: new Date(),
            end_time: new Date(),
            trip_scores: [{ safety_score: 95, eco_score: 88, overall_score: 91 }],
            trip_events: [
                {
                    event_id: 'e1',
                    type: 'HARSH_BRAKE',
                    longitude: new MockDecimal(28.2313),
                    latitude: new MockDecimal(-25.7461),
                    severity: 8.5,
                    sensor_source: 'ACCELEROMETER',
                    recorded_at: new Date(),
                },
            ],
        });
        mock_prisma.trip_readings.findMany.mockResolvedValue([
            { data_source: 'OBD' },
        ]);

        const result = await trips_services.get_summary({
            trip_id: 't1',
            user_id: 'u1',
        });

        expect(result.data.trip_id).toBe('t1');
        expect(result.data.events.length).toBe(1);
    });

    it('throws when trip not found', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue(null);

        await expect(
            trips_services.get_summary({
                trip_id: 't1',
                user_id: 'u1',
            })
        ).rejects.toThrow('Trip not found');
    });

    it('throws when user does not own trip', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u2',
            trip_scores: [],
            trip_events: [],
        });

        await expect(
            trips_services.get_summary({
                trip_id: 't1',
                user_id: 'u1',
            })
        ).rejects.toThrow('You do not own this trip');
    });

	it('geocodes and caches missing start/end address from coordinates', async () => {
		mock_prisma.trips.findUnique.mockResolvedValue({
			trip_id: 't1',
			user_id: 'u1',
			vehicle_id: 'v1',
			status: 'COMPLETED',
			data_source: 'OBD',
			route_polyline: 'polyline',
			distance_km: new MockDecimal(45.5),
			duration_minutes: 60,
			fuel_estimate: new MockDecimal(3.2),
			start_time: new Date(),
			end_time: new Date(),
			start_address: null,
			end_address: null,
			start_latitude: -26.2041,
			start_longitude: 28.0473,
			end_latitude: -26.2100,
			end_longitude: 28.0520,
			trip_scores: [{ safety_score: 95, eco_score: 88, overall_score: 91 }],
			trip_events: [],
		});
		mock_prisma.trip_readings.findMany.mockResolvedValue([]);
		mock_prisma.trips.update.mockResolvedValue({
			trip_id: 't1',
			start_address: '1 Start Street',
			end_address: '1 End Avenue',
		} as any);

		jest.spyOn(map_services, 'reverse_geocode').mockResolvedValueOnce({
			address: '1 Start Street',
			road_use: null,
			speed_limit: null,
			municipality: null,
			countryCode: null,
		}).mockResolvedValueOnce({
			address: '1 End Avenue',
			road_use: null,
			speed_limit: null,
			municipality: null,
			countryCode: null,
		});

		await trips_services.get_summary({
			trip_id: 't1',
			user_id: 'u1',
		});

		expect(map_services.reverse_geocode).toHaveBeenCalledWith(
			Number(-26.2041),
			Number(28.0473)
		);
		expect(map_services.reverse_geocode).toHaveBeenCalledWith(
			Number(-26.2100),
			Number(28.0520)
		);

		expect(mock_prisma.trips.update).toHaveBeenCalledWith({
			where: { trip_id: 't1' },
			data: {
				start_address: '1 Start Street',
				end_address: '1 End Avenue'
			}
		});
	});
});

describe('Trips services.events_log', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('logs event successfully', async () => {

        jest.spyOn(user_devices_services, 'get_multiple_users_fcm_tokens').mockResolvedValue(['token-1','token-2']);

        jest.spyOn(notification_services, 'send_trip_alert_notification').mockResolvedValue(undefined);

        jest.spyOn(contact_services, 'alert_contacts_for_event').mockResolvedValue({alert_id: 'a1'});

        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u1',
        });
        mock_prisma.trip_events.create.mockResolvedValue({
            event_id: 'e1',
            trip_id: 't1',
            type: 'HARSH_BRAKE',
            severity: 8.5,
            sensor_source: 'ACCELEROMETER',
            recorded_at: new Date(),
        });

        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
            name: 'john',
            surname: 'doe',
            username: 'doe123'
        });

        mock_prisma.trip_location_shares.findMany.mockResolvedValueOnce([
            {
                contact_id: "c1",
                contact: {
                    contact_user_id: "u2"
                }
            },
            {
                contact_id: "c2",
                contact: {
                    contact_user_id: "u3"
                }
            }
        ]);

        mock_add_notification.mockResolvedValue(undefined);

        const result = await trips_services.events_log({
            trip_id: 't1',
            user_id: 'u1',
            event_type: 'HARSH_BRAKE',
            location: { lat: -25.7461, lng: 28.2313 },
            severity: 8.5,
            sensor_source: 'ACCELEROMETER',
            recorded_at: new Date(),
        });

        expect(result.data.event_id).toBe('e1');
        expect(result.data.type).toBe('HARSH_BRAKE');
    });

    it('throws when event type invalid', async () => {
        await expect(
            trips_services.events_log({
                trip_id: 't1',
                user_id: 'u1',
                event_type: 'INVALID' as any,
                location: { lat: 1, lng: 1 },
                severity: 8,
                sensor_source: 'ACCELEROMETER',
                recorded_at: new Date(),
            })
        ).rejects.toThrow('Invalid event type');
    });

    it('throws when trip not found', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue(null);

        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
            name: 'john',
            surname: 'doe',
            username: 'doe123'
        });

        await expect(
            trips_services.events_log({
                trip_id: 't1',
                user_id: 'u1',
                event_type: 'HARSH_BRAKE',
                location: { lat: 1, lng: 1 },
                severity: 8,
                sensor_source: 'ACCELEROMETER',
                recorded_at: new Date(),
            })
        ).rejects.toThrow('Trip not found');
    });

    it('throws when user does not own trip', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u2',
        });

        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
            name: 'john',
            surname: 'doe',
            username: 'doe123'
        });

        await expect(
            trips_services.events_log({
                trip_id: 't1',
                user_id: 'u1',
                event_type: 'HARSH_BRAKE',
                location: { lat: 1, lng: 1 },
                severity: 8,
                sensor_source: 'ACCELEROMETER',
                recorded_at: new Date(),
            })
        ).rejects.toThrow('You do not own this trip');
    });

    it('throws when location invalid', async () => {
        await expect(
            trips_services.events_log({
                trip_id: 't1',
                user_id: 'u1',
                event_type: 'HARSH_BRAKE',
                location: { lat: 0, lng: 0 },
                severity: 8,
                sensor_source: 'ACCELEROMETER',
                recorded_at: new Date(),
            })
        ).rejects.toThrow('Invalid location');
    });
});
describe('trips get_history additional tests', () =>{

    beforeEach(async() => jest.clearAllMocks());

    it('it returns zero trips when there are no trips', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1' ,
            username: 'testuser',
        });

        mock_prisma.trips.findMany.mockResolvedValue([]);

        const result = await trips_services.get_history({ user_id: 'u1' });
        expect(result.total_trips).toBe(0);
        expect(result.trips).toEqual([]);
        expect(result.meta).toEqual({ mean_distance: 0, mean_minutes: 0 });
    });
    it('throws when end_date is invalid', async () => {
        await expect(
            trips_services.get_history({
                user_id: 'u1',
                end_date: new Date('not-a-date'),
            })
        ).rejects.toThrow('Invalid end date');
    });
 
    it('filters by status when provided', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
            username: 'testuser',
        });
        mock_prisma.trips.findMany.mockResolvedValue([]);
 
        await trips_services.get_history({ user_id: 'u1', status: 'ABORTED' });
 
        const call_args = mock_prisma.trips.findMany.mock.calls[0][0];
        expect(call_args.where.status).toBe('ABORTED');
    });
    
});

describe('Trips services.get_trip_latest_location', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('returns latest location data', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue({
            last_latitude: 25.23,
            last_longitude: -26.08,
            last_recorded_at: new Date('2026-05-01'),
            last_speed_kmh: 76.00,
            status: "IN_PROGRESS"
        });

        const result = await trips_services.get_trip_latest_location("trip-1");

        expect(result?.status).toBe("IN_PROGRESS");
        expect(result.last_longitude).toBe(-26.08);
    });

    it('throws when trip not found', async () => {

        mock_prisma.trips.findUnique.mockResolvedValue(null);

        await expect(
            trips_services.get_trip_latest_location('t1')
        ).rejects.toThrow('Trip not found');
    });
});

describe('Trips services.get_trips_shared_with_me', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('returns trips', async () => {
        mock_prisma.trip_location_shares.findMany.mockResolvedValue([
                {
                    trip_id: 'trip-1',
                    owner: { username: 'john' },
                    shared_at: new Date().toISOString(),
                    trip: {
                        status: 'IN_PROGRESS',
                        start_time: new Date().toISOString(),
                        start_latitude: 25.23,
                        start_longitude: 26.08,
                        fuel_estimate: 3.2
                    }
                },
                {
                    trip_id: 'trip-2',
                    owner: { username: 'bob' },
                    shared_at: new Date().toISOString(),
                    trip: {
                        status: 'IN_PROGRESS',
                        start_time: new Date().toISOString(),
                        start_latitude: 25.23,
                        start_longitude: 26.08,
                        fuel_estimate: 3.2
                    }
                },
            ]);

        const result = await trips_services.get_trips_shared_with_me("u1");

        expect(result.length).toBe(2);
        expect(result[0].status).toBe("IN_PROGRESS");
        expect(result[1].owner).toBe("bob");
    });
    
});

describe('Trips services.record_batch_trip_readings', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('records batch trip data successfully', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u1',
        });

        mock_prisma.trip_readings.createMany.mockResolvedValue(undefined);

        mock_prisma.trip_location_shares.count.mockResolvedValue(0);

        await trips_services.record_batch_trip_readings('u1','t1',
             [
                {
                    recorded_at: new Date(),
                    data_source: 'PHONE',
                    location: { lat: 0, lng: 0 },
                    speed_kmh: 60,
                    accelerometer: 1.2,
                    gyroscope_x: 0,
                    gyroscope_y: 0,
                    gyroscope_z: 0,
                    rpm: 3000,
                    coolant_temp: 90,
                    fuel_trim_percent: 5,
                    throttle_position: 50,
                    dtc_codes: [],
                },
                {
                    recorded_at: new Date(),
                    data_source: 'OBD',
                    location: { lat: 0, lng: 0 },
                    speed_kmh: 60,
                    accelerometer: 1.2,
                    gyroscope_x: 0,
                    gyroscope_y: 0,
                    gyroscope_z: 0,
                    rpm: 3000,
                    coolant_temp: 90,
                    fuel_trim_percent: 5,
                    throttle_position: 50,
                    dtc_codes: [],
                },
            ]
            );

        expect(mock_prisma.trip_readings.createMany).toHaveBeenCalled();
    });

    it('throws when trip not found', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue(null);

        await expect(
            trips_services.record_batch_trip_readings('u1','t1',
             [
                {
                    recorded_at: new Date(),
                    data_source: 'PHONE',
                    location: { lat: 0, lng: 0 },
                    speed_kmh: 60,
                    accelerometer: 1.2,
                    gyroscope_x: 0,
                    gyroscope_y: 0,
                    gyroscope_z: 0,
                    rpm: 3000,
                    coolant_temp: 90,
                    fuel_trim_percent: 5,
                    throttle_position: 50,
                    dtc_codes: [],
                },
                {
                    recorded_at: new Date(),
                    data_source: 'OBD',
                    location: { lat: 0, lng: 0 },
                    speed_kmh: 60,
                    accelerometer: 1.2,
                    gyroscope_x: 0,
                    gyroscope_y: 0,
                    gyroscope_z: 0,
                    rpm: 3000,
                    coolant_temp: 90,
                    fuel_trim_percent: 5,
                    throttle_position: 50,
                    dtc_codes: [],
                },
            ]
            )
        ).rejects.toThrow('Trip not found');
    });

    it('throws when user does not own trip', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u2',
        });

        await expect(
            trips_services.record_batch_trip_readings('u1','t1',
             [
                {
                    recorded_at: new Date(),
                    data_source: 'PHONE',
                    location: { lat: 0, lng: 0 },
                    speed_kmh: 60,
                    accelerometer: 1.2,
                    gyroscope_x: 0,
                    gyroscope_y: 0,
                    gyroscope_z: 0,
                    rpm: 3000,
                    coolant_temp: 90,
                    fuel_trim_percent: 5,
                    throttle_position: 50,
                    dtc_codes: [],
                },
                {
                    recorded_at: new Date(),
                    data_source: 'OBD',
                    location: { lat: 0, lng: 0 },
                    speed_kmh: 60,
                    accelerometer: 1.2,
                    gyroscope_x: 0,
                    gyroscope_y: 0,
                    gyroscope_z: 0,
                    rpm: 3000,
                    coolant_temp: 90,
                    fuel_trim_percent: 5,
                    throttle_position: 50,
                    dtc_codes: [],
                },
            ]
            )
        ).rejects.toThrow('You do not own this trip');
    });
});

describe('Trips services.check_stop', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('checks stop successfully', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u1',
        });

        mock_map_services.reverse_geocode.mockResolvedValue({
            address: 'Main Street',
            road_use: ['LocalStreet'],
            speed_limit: null,
            municipality: 'Pretoria',
            countryCode: 'Za'
        });

        mock_map_services.get_nearby_pois.mockResolvedValue([]);

        mock_prisma.unexpected_stop_events.create.mockResolvedValue({
            event_id: 'stop-1',
            address: 'Main Street',
            poi_category: null,
        });

        const result = await trips_services.check_stop('u1','t1', 25.23, -26.93, Date.now()-5*60*1000);

        expect(mock_map_services.reverse_geocode).toHaveBeenCalledWith(25.23, -26.93);
        expect(mock_map_services.get_nearby_pois).toHaveBeenCalledWith(
            25.23, 
            -26.93,
            10,
            'all',
            400
        );

        expect(mock_prisma.unexpected_stop_events.create).toHaveBeenCalled();

        expect(result).toEqual({
            stop_event_id: 'stop-1',
            classification: 'expected',
            location_context: {
                address: 'Main Street',
                poi_category: null,
            },
            should_prompt: false,
        });
    });

    it('throws when the trip is not found', async ()=>{
        mock_prisma.trips.findUnique.mockResolvedValue(null);

        await expect(
            trips_services.check_stop('u1','t1', 25.23, -26.93, Date.now()-5*60*1000)
        ).rejects.toThrow('Trip not found');

        expect(mock_map_services.reverse_geocode).not.toHaveBeenCalled();
    });

    it('throws when the user does not own the trip', async ()=>{
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u2',
        });

        await expect(
            trips_services.check_stop('u1','t1', 25.23, -26.93, Date.now()-5*60*1000)
        ).rejects.toThrow('You do not own this trip');

        expect(mock_map_services.reverse_geocode).not.toHaveBeenCalled();
    });

    it('throws when coordinates are invalid', async ()=>{

        await expect(
            trips_services.check_stop('u1','t1', 0, 0, Date.now()-5*60*1000)
        ).rejects.toThrow('Location coordinates missing or invalid');

        expect(mock_map_services.reverse_geocode).not.toHaveBeenCalled();
    });

    it('throws when stopped_at is in the future', async ()=>{
        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u1',
        });

        await expect(
            trips_services.check_stop('u1','t1', 25.23, -26.93, Date.now()+2*60*1000)
        ).rejects.toThrow('stopped_at cannot be in the future');

        expect(mock_map_services.reverse_geocode).not.toHaveBeenCalled();
    });
    
});

describe('Trips services.confirm_stop', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('confirms a possible stop successfully', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
        });

        mock_prisma.unexpected_stop_events.findUnique.mockResolvedValue({
            event_id: 'stop-1',
            trip_id: 't1',
            address: 'Main Street',
            stopped_at: new Date(Date.now() - 5 * 60 * 1000),
            status: 'possible',
        });

        mock_prisma.unexpected_stop_events.updateMany.mockResolvedValue({
            count: 1,
        });


        mock_prisma.trips.findUniqueOrThrow.mockResolvedValue({
            users: {
                username: 'driver',
                name: 'jeff',
                surname: 'driver'
            },
        });

        mock_prisma.trip_location_shares.findMany.mockResolvedValue([]);

        const result = await trips_services.confirm_stop('u1', 'stop-1');
        
        expect(mock_prisma.users.findUnique).toHaveBeenCalledWith({
            where: { user_id: 'u1' },
        });

        expect(mock_prisma.unexpected_stop_events.updateMany).toHaveBeenCalledWith({
            where: {
                event_id: 'stop-1',
                status: 'possible',
            },
            data: {
                status: 'confirmed',
                escalated_at: expect.any(Date),
            },
        });

        expect(result).toEqual({
            status: 'confirmed',
            already_handled: false,
        });
    });

    it('returns already_handled when stop no longer possible', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
        });

        mock_prisma.unexpected_stop_events.findUnique.mockResolvedValue({
            event_id: 'stop-1',
            status: 'resolved_ok',
        });

        mock_prisma.unexpected_stop_events.updateMany.mockResolvedValue({
            count: 0,
        });

        const result = await trips_services.confirm_stop('u1', 'stop-1');

        expect(result).toEqual({
            status: 'resolved_ok',
            already_handled: true,
        });
    });

    it('throws when the user is not found', async () => {
        mock_prisma.users.findUnique.mockResolvedValue(null);

        await expect(
            trips_services.confirm_stop('u1','stop-1')
        ).rejects.toThrow('user not found');

        expect(mock_prisma.unexpected_stop_events.findUnique).not.toHaveBeenCalled();
    });

    it('throws when stop event not found', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({user_id: 'u1'});
        mock_prisma.unexpected_stop_events.findUnique.mockResolvedValue(null);

        await expect(
            trips_services.confirm_stop('u1','stop-1')
        ).rejects.toThrow('event not found');

    });

});

describe('Trips services.resolve__stop', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('resolves a stop as moved', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
        });

        mock_prisma.unexpected_stop_events.findUnique.mockResolvedValue({
            event_id: 'stop-1',
            trips: {
                user_id: 'u1',
            },
        });

        mock_prisma.unexpected_stop_events.updateMany.mockResolvedValue({
            count: 1,
        });

        const result = await trips_services.resolve_stop('u1', 'stop-1', 'moved');
        

        expect(mock_prisma.unexpected_stop_events.updateMany).toHaveBeenCalledWith({
            where: {
                event_id: 'stop-1',
                status: 'possible',
            },
            data: {
                status: 'resolved_moved',
                resolved_at: expect.any(Date),
            },
        });

        expect(result).toEqual({
            resolved: true,
        });
    });

    it('resolves a stop as moved', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
        });

        mock_prisma.unexpected_stop_events.findUnique.mockResolvedValue({
            event_id: 'stop-1',
            trips: {
                user_id: 'u1',
            },
        });

        mock_prisma.unexpected_stop_events.updateMany.mockResolvedValue({
            count: 1,
        });

        const result = await trips_services.resolve_stop('u1', 'stop-1', 'safe');
        

        expect(mock_prisma.unexpected_stop_events.updateMany).toHaveBeenCalledWith({
            where: {
                event_id: 'stop-1',
                status: 'possible',
            },
            data: {
                status: 'resolved_ok',
                resolved_at: expect.any(Date),
            },
        });

        expect(result).toEqual({
            resolved: true,
        });
    });

    it('returns false when the stop was already handled', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({
            user_id: 'u1',
        });

        mock_prisma.unexpected_stop_events.findUnique.mockResolvedValue({
            event_id: 'stop-1',
            trips: {
                user_id: 'u1',
            },
        });

        mock_prisma.unexpected_stop_events.updateMany.mockResolvedValue({
            count: 0,
        });

        const result = await trips_services.resolve_stop('u1', 'stop-1', 'moved');

        expect(result).toEqual({
            resolved: false,
        });
    });

    it('throws when the reason is missing', async () => {
        
        await expect(
            trips_services.resolve_stop('u1', 'stop-1', '')
        ).rejects.toThrow('reason missing');

        expect(mock_prisma.users.findUnique).not.toHaveBeenCalled();

    });

    it('throws when the user is not found', async () => {
        mock_prisma.users.findUnique.mockResolvedValue(null);

        await expect(
            trips_services.resolve_stop('u1', 'stop-1', 'moved')
        ).rejects.toThrow('user not found');
    });

    it('throws when the stop event is not found', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({ user_id: 'u1' });
        mock_prisma.unexpected_stop_events.findUnique.mockResolvedValue(null);

        await expect(
            trips_services.resolve_stop('u1', 'stop-1', 'moved')
        ).rejects.toThrow('event not found');
    });
   
    it('throws when the stop event is not found', async () => {
        mock_prisma.users.findUnique.mockResolvedValue({ user_id: 'u1' });
        mock_prisma.unexpected_stop_events.findUnique.mockResolvedValue({
            event_id: 'stop-1',
            trips: {
                user_id: 'u2',
            },
        });

        await expect(
            trips_services.resolve_stop('u1', 'stop-1', 'moved')
        ).rejects.toThrow('cannot access event');

        expect(mock_prisma.unexpected_stop_events.updateMany).not.toHaveBeenCalled();
    });


});

describe('Trips services.has_trip_resumed_movement', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('returns true when a reading was recorded after the stop', async () => {

        const stopped_at = new Date('2026-08-20T10:00:00.000Z');
        const last_recorded_at = new Date('2026-08-20T10:05:00.000Z');

        mock_prisma.trips.findFirst.mockResolvedValue({
            last_recorded_at,
        });

        const result = await trips_services.has_trip_resumed_movement('t1', stopped_at);
        

        expect(mock_prisma.trips.findFirst).toHaveBeenCalledWith({
            where: {
                trip_id: 't1',
            },
            select: {
                last_recorded_at: true
            },
        });

        expect(result).toBe(true);
    });

     it('returns false when no reading was recorded after the stop', async () => {

        const stopped_at = new Date('2026-08-20T10:00:00.000Z');
        const last_recorded_at = new Date('2026-08-20T09:55:00.000Z');

        mock_prisma.trips.findFirst.mockResolvedValue({
            last_recorded_at,
        });

        const result = await trips_services.has_trip_resumed_movement('t1', stopped_at);
        

        expect(mock_prisma.trips.findFirst).toHaveBeenCalledWith({
            where: {
                trip_id: 't1',
            },
            select: {
                last_recorded_at: true
            },
        });

        expect(result).toBe(false);
    });

    
});