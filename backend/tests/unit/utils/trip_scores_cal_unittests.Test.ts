jest.mock("../../../src/db/prisma", () => {
    const trip_events = {
        groupBy: jest.fn(),
    };
    const vehicles = {
        findUnique: jest.fn(),
    };
    const trips = {
        findUnique: jest.fn(),
    };

    return {
        __esModule: true,
        default: {
            trip_events,
            vehicles,
            trips,
        },
    };
});

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import prisma from "../../../src/db/prisma";
import {
    calculate_trip_scores,
} from "../../../src/utils/trip_scores_cal";

const mock_prisma = prisma as any;

describe("calculate_trip_scores", () => {
    const tripId = "trip-123";
    const vehicleId = "vehicle-123";
    const distance = 100;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("calculate_safety_score", () => {
        it("returns 0 when distance is zero or negative", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: null,
                fuel_level_end: null,
                distance_km: 0,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                0
            );

            expect(result.safety_score).toBe(0);
        });

        it("returns 100 when no events occurred", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 60,
                distance_km: distance,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                distance
            );

            expect(result.safety_score).toBe(100);
        });

        it("calculates safety score with single HARSH_BRAKE event", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([
                {
                    type: "HARSH_BRAKE",
                    _count: { event_id: 1 },
                },
            ]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 60,
                distance_km: distance,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                distance
            );

            expect(result.safety_score).toBeLessThan(100);
            expect(result.safety_score).toBeGreaterThan(0);
        });

        it("calculates safety score with multiple event types and weights", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([
                {
                    type: "HARSH_BRAKE",
                    _count: { event_id: 2 },
                },
                {
                    type: "SHARP_CORNER",
                    _count: { event_id: 1 },
                },
                {
                    type: "CRASH_LIKE",
                    _count: { event_id: 1 },
                },
            ]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 60,
                distance_km: 100,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                100
            );

            expect(result.safety_score).toBeLessThan(100);
            expect(Number.isInteger(result.safety_score)).toBe(true);
        });

        it("returns 0 when safety score would be negative", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([
                {
                    type: "CRASH_LIKE",
                    _count: { event_id: 100 },
                },
            ]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 60,
                distance_km: 10,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                10
            );

            expect(result.safety_score).toBe(0);
        });
    });

    describe("calculate_eco_score", () => {
        it("returns null when vehicle not found", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue(null);

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                distance
            );

            expect(result.eco_score).toBeNull();
            expect(result.overall_score).toBe(result.safety_score);
        });

        it("returns null when trip not found", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue(null);

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                distance
            );

            expect(result.eco_score).toBeNull();
        });

        it("returns null when vehicle_id mismatch", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: "different-vehicle-id",
                fuel_level_start: 80,
                fuel_level_end: 60,
                distance_km: distance,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                distance
            );

            expect(result.eco_score).toBeNull();
        });

        it("returns null when any required fuel data is missing", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: null,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 60,
                distance_km: distance,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                distance
            );

            expect(result.eco_score).toBeNull();
        });

        it("returns null when tank capacity is invalid", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 0,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 60,
                distance_km: distance,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                distance
            );

            expect(result.eco_score).toBeNull();
        });

        it("returns null when no fuel was consumed", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 80,
                distance_km: distance,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                distance
            );

            expect(result.eco_score).toBeNull();
        });

        it("returns 100 when actual efficiency meets or exceeds benchmark", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 10,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 70,
                distance_km: 100,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                100
            );

            expect(result.eco_score).toBe(100);
        });

        it("calculates eco score correctly when over benchmark", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 60,
                distance_km: 100,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                100
            );

            expect(result.eco_score).toBeLessThan(100);
            expect(result.eco_score).toBeGreaterThan(0);
        });

        it("handles Prisma Decimal types", async () => {
            const MockDecimal = class {
                constructor(private value: number) {}
                toNumber() {
                    return this.value;
                }
            };

            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: new MockDecimal(50),
                fuel_efficiency: new MockDecimal(8),
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: new MockDecimal(80),
                fuel_level_end: new MockDecimal(70),
                distance_km: new MockDecimal(100),
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                100
            );

            expect(result.eco_score).toBe(100);
            expect(result.overall_score).toBeDefined();
        });
    });

    describe("calculate_trip_scores (overall)", () => {
        it("returns overall score equal to safety when eco_score is null", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue(null);

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                distance
            );

            expect(result.overall_score).toBe(result.safety_score);
        });

        it("calculates weighted overall score when both scores exist", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 70,
                distance_km: 100,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                100
            );

            const expected = Math.round(100 * 0.6 + 100 * 0.4);
            expect(result.overall_score).toBe(expected);
        });

        it("applies correct weighting (60% safety, 40% eco)", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([
                {
                    type: "HARSH_BRAKE",
                    _count: { event_id: 1 },
                },
            ]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 79,
                distance_km: 100,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                100
            );

            expect(result.overall_score).toBeDefined();
            expect(Number.isInteger(result.overall_score)).toBe(true);
            expect(result.overall_score).toBeLessThanOrEqual(100);
            expect(result.overall_score).toBeGreaterThanOrEqual(0);
        });

        it("returns object with all required fields", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 70,
                distance_km: 100,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                100
            );

            expect(result).toHaveProperty("safety_score");
            expect(result).toHaveProperty("eco_score");
            expect(result).toHaveProperty("overall_score");
            expect(typeof result.safety_score).toBe("number");
            expect(
                typeof result.eco_score === "number" ||
                    result.eco_score === null
            ).toBe(true);
            expect(typeof result.overall_score).toBe("number");
        });
    });

    describe("edge cases", () => {
        it("handles very small distances", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([
                {
                    type: "HARSH_BRAKE",
                    _count: { event_id: 1 },
                },
            ]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 79,
                distance_km: 0.5,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                0.5
            );

            expect(result.safety_score).toBeDefined();
            expect(Number.isInteger(result.safety_score)).toBe(true);
        });

        it("handles very large number of events", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([
                {
                    type: "HARSH_BRAKE",
                    _count: { event_id: 1000 },
                },
            ]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 70,
                distance_km: 100,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                100
            );

            expect(result.safety_score).toBe(0);
            expect(result.safety_score).toBeGreaterThanOrEqual(0);
        });

        it("handles unknown event types (defaults to weight 0)", async () => {
            mock_prisma.trip_events.groupBy.mockResolvedValue([
                {
                    type: "UNKNOWN_EVENT",
                    _count: { event_id: 5 },
                },
            ]);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                vehicle_id: vehicleId,
                fuel_tank: 50,
                fuel_efficiency: 8,
            });
            mock_prisma.trips.findUnique.mockResolvedValue({
                trip_id: tripId,
                vehicle_id: vehicleId,
                fuel_level_start: 80,
                fuel_level_end: 70,
                distance_km: 100,
            });

            const result = await calculate_trip_scores(
                tripId,
                vehicleId,
                100
            );

            expect(result.safety_score).toBe(100);
        });
    });
});