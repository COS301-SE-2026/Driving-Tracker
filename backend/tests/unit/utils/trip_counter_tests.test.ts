jest.mock("../../../src/db/prisma", () => {
    const trips = {
        count: jest.fn(),
        findMany: jest.fn(),
    };
    const vehicles = {
        findUnique: jest.fn(),
        update: jest.fn(),
    };

    return {
        __esModule: true,
        default: {
            trips,
            vehicles,
        },
    };
});

import {describe, it, expect,jest,beforeEach} from "@jest/globals";
import prisma from "../../../src/db/prisma";
import { update_vehicle_efficiency } from "../../../src/utils/trip_counter";

const mock_prisma = prisma as any;

describe("update vehicle efficiency", () =>{
    const trip_id = "trip-123";
    const vehicle_id = "vehicle-123";
    const user_id = "user-123";

    beforeEach(()=>{ jest.clearAllMocks()});

    describe("trip count validation", ()=>{
        it("returns early when trip count is zero", async ()=>{
            mock_prisma.trips.count.mockResolvedValue(0);
            const result =await update_vehicle_efficiency(trip_id,vehicle_id,user_id);
            expect(result).toEqual({
                updated: false,
                trip_count: 0,
                fuel_efficiency: null,
            });
            expect(mock_prisma.vehicles.findUnique).not .toHaveBeenCalled();
        });
        it("return early when trip count is not a multiple of 5(fuel_eff not updated)", async ()=>{
            mock_prisma.trips.count.mockResolvedValue(4);
            const result = await update_vehicle_efficiency(trip_id,vehicle_id,user_id);

            expect(result).toEqual({
                updated: false,
                trip_count: 4,
                fuel_efficiency: null
            });
            expect(mock_prisma.vehicles.findUnique).not.toHaveBeenCalled();
        });
        it("when the trip count is a exactly of five(update to fuel eff)", async()=>{
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 50
            });
            mock_prisma.trips.findMany.mockResolvedValue([
                {
                        fuel_level_start: 80,
                        fuel_level_end: 60,
                        distance_km: 100,
                },
            ]);
            mock_prisma.vehicles.update.mockResolvedValue({
                fuel_efficiency: 10,
            });
            const result = await update_vehicle_efficiency(trip_id,vehicle_id,user_id);
            expect(result.updated).toBe(true);
            expect(mock_prisma.vehicles.findUnique).toHaveBeenCalled();
        });
        it("proceeds when trip count is multiple of 5 (10, 15, etc)", async () => {
            mock_prisma.trips.count.mockResolvedValue(10);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 50,
            });
            mock_prisma.trips.findMany.mockResolvedValue([]);
            mock_prisma.vehicles.update.mockResolvedValue({
                fuel_efficiency: null,
            });

            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(mock_prisma.vehicles.findUnique).toHaveBeenCalled();
            expect(result.trip_count).toBe(10);
        });
    });
    describe("vehicle validation", () =>{
        beforeEach(()=>{jest.clearAllMocks()});
    
        it("return early when the tank is null", async ()=>{
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique({
                fuel_tank: null
            });
            mock_prisma.trips.findMany.mockResolvedValue([]);
            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(result).toEqual({
                updated: false,
                trip_count: 5,
                fuel_efficiency: null,
            });
            expect(mock_prisma.vehicles.update).not.toHaveBeenCalled();
        });
         it("returns early when fuel tank is zero or negative", async () => {
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 0,
            });
            mock_prisma.trips.findMany.mockResolvedValue([]);

            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(result.updated).toBe(false);
            expect(mock_prisma.vehicles.update).not.toHaveBeenCalled();
        });
        it("throws error when vehicle not found", async ()=>{
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue(null);
            await expect(
                update_vehicle_efficiency(trip_id,vehicle_id,user_id)
            ).rejects.toThrow("Vehicle not found");
        });
        
    });
    describe("trip filtering and aggregation", () => {
        it("skips trips with null fuel levels", async () => {
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 50,
            });
            mock_prisma.trips.findMany.mockResolvedValue([
                {
                    fuel_level_start: null,
                    fuel_level_end: 60,
                    distance_km: 100,
                },
                {
                    fuel_level_start: 80,
                    fuel_level_end: null,
                    distance_km: 100,
                },
            ]);

            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(result.updated).toBe(false);
            expect(result.fuel_efficiency).toBeNull();
        });

        it("skips trips with null distance", async () => {
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 50,
            });
            mock_prisma.trips.findMany.mockResolvedValue([
                {
                    fuel_level_start: 80,
                    fuel_level_end: 60,
                    distance_km: null,
                },
            ]);

            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(result.updated).toBe(false);
        });

        it("skips trips where fuel increased (start < end)", async () => {
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 50,
            });
            mock_prisma.trips.findMany.mockResolvedValue([
                {
                    fuel_level_start: 50,
                    fuel_level_end: 80,
                    distance_km: 100,
                },
            ]);

            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(result.updated).toBe(false);
        });

        it("skips trips with zero or negative fuel used", async () => {
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 50,
            });
            mock_prisma.trips.findMany.mockResolvedValue([
                {
                    fuel_level_start: 80,
                    fuel_level_end: 80,
                    distance_km: 100,
                },
            ]);

            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(result.updated).toBe(false);
        });

        it("aggregates multiple valid trips correctly", async () => {
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 50,
            });
            mock_prisma.trips.findMany.mockResolvedValue([
                {
                    fuel_level_start: 80,
                    fuel_level_end: 60,
                    distance_km: 100,
                },
                {
                    fuel_level_start: 60,
                    fuel_level_end: 40,
                    distance_km: 100,
                },
                {
                    fuel_level_start: 40,
                    fuel_level_end: 30,
                    distance_km: 50,
                },
            ]);
            mock_prisma.vehicles.update.mockResolvedValue({
                fuel_efficiency: 10,
            });

            const result = await update_vehicle_efficiency(vehicle_id, vehicle_id, vehicle_id);

            expect(result.updated).toBe(true);
            expect(mock_prisma.vehicles.update).toHaveBeenCalledWith({
                where: { vehicle_id: vehicle_id },
                data: { fuel_efficiency: 10 },
            });
        });
    });
     describe("fuel efficiency calculation", () => {
        it("calculates efficiency correctly from single trip", async () => {
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 50,
            });
            mock_prisma.trips.findMany.mockResolvedValue([
                {
                    fuel_level_start: 80,
                    fuel_level_end: 60,
                    distance_km: 100,
                },
            ]);
            mock_prisma.vehicles.update.mockResolvedValue({
                fuel_efficiency: 10,
            });

            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(result.updated).toBe(true);
            expect(result.fuel_efficiency).toBe(10);
        });

        it("rounds efficiency to 2 decimal places", async () => {
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 50,
            });
            mock_prisma.trips.findMany.mockResolvedValue([
                {
                    fuel_level_start: 85.5,
                    fuel_level_end: 60.3,
                    distance_km: 123.456,
                },
            ]);
            mock_prisma.vehicles.update.mockResolvedValue({});

            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(result.fuel_efficiency).toEqual(10.21);
        });

        it("handles Prisma Decimal types", async () => {
            const MockDecimal = class {
                constructor(private value: number) {}
                toNumber() {
                    return this.value;
                }
            };

            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: new MockDecimal(50),
            });
            mock_prisma.trips.findMany.mockResolvedValue([
                {
                    fuel_level_start: new MockDecimal(80),
                    fuel_level_end: new MockDecimal(60),
                    distance_km: new MockDecimal(100),
                },
            ]);
            mock_prisma.vehicles.update.mockResolvedValue({
                fuel_efficiency: 10,
            });

            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(result.updated).toBe(true);
            expect(result.fuel_efficiency).toBe(10);
        });

        it("calculates efficiency with very small distances", async () => {
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 50,
            });
            mock_prisma.trips.findMany.mockResolvedValue([
                {
                    fuel_level_start: 80,
                    fuel_level_end: 79,
                    distance_km: 1,
                },
            ]);
            mock_prisma.vehicles.update.mockResolvedValue({});

            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(result.updated).toBe(true);
            expect(result.fuel_efficiency).toBeGreaterThan(0);
        });

        it("calculates efficiency with very small fuel amounts", async () => {
            mock_prisma.trips.count.mockResolvedValue(5);
            mock_prisma.vehicles.findUnique.mockResolvedValue({
                fuel_tank: 50,
            });
            mock_prisma.trips.findMany.mockResolvedValue([
                {
                    fuel_level_start: 50.5,
                    fuel_level_end: 50.1,
                    distance_km: 100,
                },
            ]);
            mock_prisma.vehicles.update.mockResolvedValue({});

            const result = await update_vehicle_efficiency(trip_id, vehicle_id, user_id);

            expect(result.updated).toBe(true);
            expect(result.fuel_efficiency).toBeDefined();
        });
    });
   
})