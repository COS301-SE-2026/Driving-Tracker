

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { fetch_vehicle_benchmark } from '../../../src/services/vehicle.services';
import { calculate_trip_scores } from '../../../src/utils/trip_scores_cal';



jest.mock('../../../src/db/prisma', () => ({
    __esModule: true,
    default: {
        trip_events: {
            groupBy: jest.fn(),
        },
        vehicles: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock('../../../src/services/vehicle.services', () => ({
    fetch_vehicle_benchmark: jest.fn(),
}));



const mocked_prisma = prisma as jest.Mocked<typeof prisma>;
const mock_fetch_benchmark = fetch_vehicle_benchmark as jest.MockedFunction<
    typeof fetch_vehicle_benchmark
>;


describe('calculate_trip_scores', () => {
    const tripId = 'trip-123';
    const vehicleId = 'vehicle-123';
    const distance = 100;
    const fuelEstimate = 8;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('calls both scoring functions and computes overall score', async () => {
        
        mocked_prisma.trip_events.groupBy.mockResolvedValue([]);

        mocked_prisma.vehicles.findUnique.mockResolvedValue({
            vehicle_id: vehicleId,
            make: 'Toyota',
            model: 'Camry',
            year: 2018,
        } as any); // cast to any to bypass missing fields

        // Benchmark returns combined MPG
        mock_fetch_benchmark.mockResolvedValue([{ combined_mpg: 30 } as any]);

        const tripFuel = 9;
        const result = await calculate_trip_scores(tripId, vehicleId, distance, tripFuel);

        expect(result.safety_score).toBe(100);
        expect(result.eco_score).toBe(70);
        expect(result.overall_score).toBe(88); 
    });

    it('returns overall score equal to safety when eco_score is null', async () => {
        mocked_prisma.trip_events.groupBy.mockResolvedValue([]);

        mocked_prisma.vehicles.findUnique.mockResolvedValue({
            vehicle_id: vehicleId,
            make: 'Toyota',
            model: 'Camry',
            year: 2005,
        } as any);

        const result = await calculate_trip_scores(tripId, vehicleId, distance, fuelEstimate);

        expect(result.safety_score).toBe(100);
        expect(result.eco_score).toBeNull();
        expect(result.overall_score).toBe(100);
    });

    it('handles rounding correctly (overall_score is an integer)', async () => {
        
        mocked_prisma.trip_events.groupBy.mockResolvedValue([
            { type: 'HARSH_BRAKE', _count: { event_id: 2 } },
            { type: 'SHARP_CORNER', _count: { event_id: 1 } },
        ] as any); 


        mocked_prisma.vehicles.findUnique.mockResolvedValue({
            vehicle_id: vehicleId,
            make: 'Toyota',
            model: 'Corolla',
            year: 2016,
        } as any);
        mock_fetch_benchmark.mockResolvedValue([{ combined_mpg: 30 } as any]);

        const result = await calculate_trip_scores(tripId, vehicleId, 50, 10);

        expect(result.overall_score).toBe(44);
        expect(Number.isInteger(result.overall_score)).toBe(true);
    });

    it('returns 0 safety when distance is zero or negative', async () => {
      
        mocked_prisma.trip_events.groupBy.mockResolvedValue([]); 
        mocked_prisma.vehicles.findUnique.mockResolvedValue({
            vehicle_id: vehicleId,
            make: 'Toyota',
            model: 'Camry',
            year: 2018,
        } as any);
        mock_fetch_benchmark.mockResolvedValue([{ combined_mpg: 30 } as any]);

        const result = await calculate_trip_scores(tripId, vehicleId, 0, fuelEstimate);
        
        expect(result.safety_score).toBe(0);
    });
});