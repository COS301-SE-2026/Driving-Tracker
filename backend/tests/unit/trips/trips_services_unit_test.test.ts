jest.mock('../../../src/db/prisma', () => {
    const trips = {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
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
        })),
        users,
        trips,
        vehicles,
        trip_scores,
        trip_readings,
        trip_events,
        trip_location_shares,
        trusted_contacts,
        },
    };
});

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
    },
}));
import {describe, it, expect, jest, beforeEach} from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { trips_services } from '../../../src/services/trips_services';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mock_prisma = prisma as any;

class MockDecimal {
    constructor(private value: number) {}
    toNumber() {
        return this.value;
    }
}
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
            safety_score: 95,
            eco_score: 88,
            overall_score: 91,
        });

        expect(result.trip_id).toBe('t1');
        expect(result.status).toBe('COMPLETED');
    });

    it('end trip updates existing score', async()=>{
        (mock_prisma.trips.findUnique).mockResolvedValue({trip_id: 't1',
            user_id: 'u1',
            status: 'IN_PROGRESS',
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
            safety_score: 90,
            eco_score: 87,
            overall_score: 89,
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
                safety_score: 95,
                eco_score: 88,
                overall_score: 91,
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
                safety_score: 95,
                eco_score: 88,
                overall_score: 91,
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
                safety_score: 95,
                eco_score: 88,
                overall_score: 91,
            })
        ).rejects.toThrow('Cannot end a trip with status');
    });
});

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
});

describe('Trips services.events_log', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('logs event successfully', async () => {
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