jest.mock('../../../src/db/prisma', () => {
    const prisma ={

        users: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        },
        trips: {
            findUnique: jest.fn(),
            findUniqueOrThrow: jest.fn(),
            findMany: jest.fn(),
            updateMany: jest.fn(),
            create: jest.fn(),

        },
        organizations: {
            create: jest.fn(),
        },
        organization_members: {
            findUnique: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
        },
        vehicles: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
        $transaction: jest.fn(async (callback: (client: typeof prisma) => unknown) => 
            callback(prisma),
        ),
    };
    
    return {
        __esModule: true,
        default: prisma,
    };
});

jest.mock("../../../src/services/map_services", () => ({
    map_services: {
        suggested_routes: jest.fn(),
    },
}));


import { describe, it, expect, jest, beforeEach,afterAll,afterEach } from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { fleet_services } from '../../../src/services/fleet_services';
import { map_services } from '../../../src/services/map_services';
import { mock } from 'node:test';


const mock_map_services = map_services as jest.Mocked<typeof map_services>;
const mock_prisma = prisma as any;

const reset_mocks = () => {
    jest.clearAllMocks();
    mock_map_services.suggested_routes.mockResolvedValue({
        distance_km: 12,
        travel_time_seconds: 1800,
        traffic_delay_seconds: 0,
        points: [{ lat: -26.1, lng: 28.1 }],
    });
};

const schedule_data = {
    vehicle_id: "vehicle-1",
    driver_id: "driver-1",
    data_source: "PHONE" as const,
    title: "Bread Run",
    description: "Deliver bread to given locations",
    planned_start_time: "2026-09-23T10:00:00Z",
    planned_start_location: { address: "10 Canary Way",lat: -26.1, lng: 28.1 },
    planned_end_location: { address: "24 Avery Way ", lat: -26.2, lng: 28.2 },
    stops: [{ address: "25 Brookside Field",lat: -26.4, lng: 28.4, stop_order: 1 }, 
        { address: "80 Crew Avenue", lat: -26.5, lng: 28.5, stop_order: 2 }]
};

beforeEach(reset_mocks);

describe('fleet services ', () => {
    
    describe('get_org_id_for_trip ', () => {
        beforeEach(async()=> jest.clearAllMocks());

        it("fetches org id for trip fleet related trip", async()=>{

            (mock_prisma.trips.findUnique).mockResolvedValue({
                vehicles: {
                    org_id: 'org-1',
                },
            });

            const result = await fleet_services.get_org_id_for_trip('trip-1');

            expect(result).toBe('org-1');
        });

        it("returns null when trip is not fleet related", async()=>{

            (mock_prisma.trips.findUnique).mockResolvedValue({
                vehicles: {
                    org_id: null,
                },
            });

            const result = await fleet_services.get_org_id_for_trip('trip-2');

            expect(result).toBeNull();
        });

    });

    describe('get_view_permission ', () => {
        beforeEach(async()=> jest.clearAllMocks());

        it("returns true if found user is Admin or Manager", async()=>{

            (mock_prisma.organization_members.findUnique).mockResolvedValue({
                role: 'MANAGER',
            });

            const result = await fleet_services.get_view_permission('user-1','org-1');

            expect(result).toBe(true);
        });

        it("returns false if user is not found", async()=>{

            (mock_prisma.organization_members.findUnique).mockResolvedValue(null);

            const result = await fleet_services.get_view_permission('user-2','org-2');

            expect(result).toBe(false);
        });

        it("returns false if user is not Manager or Admin", async()=>{

            (mock_prisma.organization_members.findUnique).mockResolvedValue({
                role: 'DRIVER',
            });

            const result = await fleet_services.get_view_permission('user-3','org-3');

            expect(result).toBe(false);
        });

    });

    describe("add_organization", () => {

        it("creates an organization and adds creator as admin", async () => {

            mock_prisma.organizations.create.mockResolvedValue({
                org_id: "org-1",
                name: "Fleet One",
            });

            mock_prisma.organization_members.create.mockResolvedValue({
                org_id: "org-1",
                user_id: "user-1",
                role: "ADMIN",
            });

            await expect(
                fleet_services.add_organization("user-1", "Fleet One"),
            ).resolves.toEqual({ org_id: "org-1" });

            expect(mock_prisma.organizations.create).toHaveBeenCalledWith({
                data: { name: "Fleet One" },
            });

            expect(mock_prisma.organization_members.create).toHaveBeenCalledWith({
                data: {
                    org_id: "org-1",
                    user_id: "user-1",
                    role: "ADMIN",
                },
            });

        });

        it("rejects an empty organization name", async () => {

            await expect(
                fleet_services.add_organization("user-1", "  "),
            ).rejects.toThrow("Name cannot be empty");

            expect(mock_prisma.organizations.create).not.toHaveBeenCalled();
        });
    });

    describe("list_fleet_drivers", () => {
        it("returns drivers with availability statuses", async () => {

            mock_prisma.organization_members.findUnique.mockResolvedValue({
                role: "MANAGER",
            });

            mock_prisma.organization_members.findMany.mockResolvedValue([
                {
                    joined_at: new Date("2026-01-01"),
                    users: {
                        user_id: "driver-1",
                        username: "driver1",
                        name: "Jane",
                        surname: "Doe",
                        email: "jane@example.com",
                        phone_number: "08788890290",
                        profile_picture_url: null,
                        trips: [{ status: "IN_PROGRESS" }],
                    },
                },
                {
                    joined_at: new Date("2026-01-02"),
                    users: {
                        user_id: "driver-2",
                        username: "driver2",
                        name: "John",
                        surname: "Doe",
                        email: "john@example.com",
                        phone_number: "0678990490",
                        profile_picture_url: null,
                        trips: [{ status: "SCHEDULED" }],
                    },
                },
                {
                    joined_at: new Date("2026-01-03"),
                    users: {
                        user_id: "driver-3",
                        username: "driver3",
                        name: "Alex",
                        surname: "Doe",
                        email: "alex@example.com",
                        phone_number: "0878990494",
                        profile_picture_url: null,
                        trips: [],
                    },
                },
            ]);

            const result = await fleet_services.list_fleet_drivers("manager-1","org-1",);

            expect(result.map((driver) => driver.status)).toEqual([
                "UNAVAILABLE",
                "ASSIGNED",
                "AVAILABLE",
            ]);
        });

        it("rejects users without fleet view permission", async () => {

            mock_prisma.organization_members.findUnique.mockResolvedValue(null);

            await expect(
                fleet_services.list_fleet_drivers("user-1", "org-1"),
            ).rejects.toThrow("You do not have permission to list fleet drivers");

            expect(mock_prisma.organization_members.findMany).not.toHaveBeenCalled();
        });
    });

    describe("list_fleet_vehicles", () => {

        it("returns vehicles with availability statuses", async () => {

            mock_prisma.organization_members.findUnique.mockResolvedValue({
                role: "ADMIN",
            });

            mock_prisma.vehicles.findMany.mockResolvedValue([
                {
                    vehicle_id: "vehicle-1",
                    make: "Toyota",
                    model: "Corolla",
                    trips: [{ status: "IN_PROGRESS", scheduled_for: null }],
                },
                {
                    vehicle_id: "vehicle-2",
                    make: "Ford",
                    model: "Ranger",
                    trips: [{ status: "SCHEDULED", scheduled_for: new Date() }],
                },
                {
                    vehicle_id: "vehicle-3",
                    make: "VW",
                    model: "Polo",
                    trips: [],
                },
            ]);

            const result= await fleet_services.list_fleet_vehicles("admin-1", "org-1",);

            expect(result.map((vehicle) => vehicle.status)).toEqual([
                "UNAVAILABLE",
                "ASSIGNED",
                "AVAILABLE",
            ]);

            expect(result[0]).not.toHaveProperty("trips");

        });

        it("rejects non-members", async () => {

            mock_prisma.organization_members.findUnique.mockResolvedValue(null);

            await expect(
                fleet_services.list_fleet_vehicles("user-1", "org-1"),
            ).rejects.toThrow("You do not have permission to list fleet vehicles");
        });
    });

    describe("list_fleet_trips", () => {

        it("returns manager trips with driver and vehicle information", async () => {

            mock_prisma.organization_members.findUnique.mockResolvedValue({
                role: "MANAGER"
            });

            mock_prisma.trips.findMany.mockResolvedValue([
                {
                    trip_id: "trip-1",
                    status: "COMPLETED",
                    vehicle_id: "vehicle-1",
                    vehicles: { make: "Toyota", model: "Corolla", year: 2018 },
                    users: {
                        user_id: "driver-1",
                        name: "Jane",
                        surname: "Doe",
                        email: "jane@example.com",
                    },
                },
            ]);

            const result = await fleet_services.list_fleet_trips(
                "manager-1",
                "org-1",
                {},
            );

            expect(result[0]).toMatchObject({
                trip_id: "trip-1",
                driver: { user_id: "driver-1" },
            });

            expect(mock_prisma.trips.findMany).toHaveBeenCalled();
        });

        it("rejects non-members", async () => {

            mock_prisma.organization_members.findUnique.mockResolvedValue(null);

            await expect( 
                fleet_services.list_fleet_trips("nonmember-1", "org-1", {})
            ).rejects.toThrow("Not a member of this organization");

            expect(mock_prisma.trips.findMany).not.toHaveBeenCalled();
        });

        it("rejects invalid date ranges", async () => {

            await expect(
                fleet_services.list_fleet_trips("user-1", "org-1", {
                    start_date: new Date("invalid"),
                })
            ).rejects.toMatchObject({
                name: "ValidationError",
                field: "start_date",
            });

            await expect(
                fleet_services.list_fleet_trips("user-1", "org-1", {
                    end_date: new Date("invalid_end")
                })
            ).rejects.toMatchObject({
                name: "ValidationError",
                field: "end_date",
            });

            await expect(
                fleet_services.list_fleet_trips("user-1", "org-1", {
                    start_date: new Date("2026-09-24"),
                    end_date: new Date("2026-09-23"),
                })
            ).rejects.toMatchObject({
                name: "ValidationError",
                field: "dates",
            });

        });

        it("prevents drivers from viewing another driver's trips", async () => {

            mock_prisma.organization_members.findUnique.mockResolvedValue({
                role: "DRIVER"
            });

            await expect(
                fleet_services.list_fleet_trips("driver-1", "org-1", {
                    driver_id: "driver-2",
                }),
            ).rejects.toThrow("Not authorized to view another driver's trips");

            expect(mock_prisma.trips.findMany).not.toHaveBeenCalled();
        });
    });

    describe("schedule_trip", () => {
        it("creates a scheduled trip", async () => {

            mock_prisma.organization_members.findUnique.mockResolvedValue({
                joined_at: new Date("2026-01-01"),
                users: { trips: [] },
            });

            mock_prisma.trips.create.mockResolvedValue({
                trip_id: "trip-1",
                status: "SCHEDULED",
            });

            const result = await fleet_services.schedule_trip(
                "manager-1",
                "org-1",
                schedule_data,
            );

            expect(mock_map_services.suggested_routes).toHaveBeenCalled();

            expect(mock_prisma.trips.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: "Bread Run",
                        description: "Deliver bread to given locations",
                        user_id: "driver-1",
                        vehicle_id: "vehicle-1",
                        created_by: "manager-1",
                        status: "SCHEDULED",
                    }),
                }),
            );

            expect(result).toEqual({
                trip: { trip_id: "trip-1", status: "SCHEDULED" },
                route: [{ lat: -26.1, lng: 28.1 }],
            });
        });

        it("rejects a driver who already has an active trip", async () => {
            mock_prisma.organization_members.findUnique.mockResolvedValue({
                users: { trips: [{ status: "IN_PROGRESS" }] },
            });

            await expect(
                fleet_services.schedule_trip("manager-1", "org-1", schedule_data),
            ).rejects.toThrow("Driver not available");

            expect(mock_map_services.suggested_routes).not.toHaveBeenCalled();
        });

        it("rejects when stop coordinates are invalid", async () => {
            
            const invalid_stops = [{ address: "25 Brookside Field",lat: -26.4, lng: 28.4, stop_order: 1 }, 
        { address: "80 Crew Avenue", lat: -26.5, lng: NaN, stop_order: 2 }]

            await expect(
                fleet_services.schedule_trip("manager-1", "org-1", {...schedule_data, stops: invalid_stops }),
            ).rejects.toThrow("Invalid stop coordinates");

            expect(mock_map_services.suggested_routes).not.toHaveBeenCalled();
        });

        it("rejects when start location is invalid", async () => {
            
            const planned_start_location = { address: "25 Brookside Field", lat: NaN, lng: 28.4, stop_order: 1 };

            await expect(
                fleet_services.schedule_trip("manager-1", "org-1", {...schedule_data, planned_start_location }),
            ).rejects.toThrow("Unknown start location");

            expect(mock_map_services.suggested_routes).not.toHaveBeenCalled();
        });

        it("rejects overlapping scheduled trips", async () => {
            mock_prisma.organization_members.findUnique.mockResolvedValue({
                users: {
                    trips: [{
                        status: "SCHEDULED",
                        scheduled_for: new Date("2026-09-23T10:10:00Z"),
                        scheduled_end: new Date("2026-09-23T11:00:00Z"),
                    }],
                },
            });

            await expect(
                fleet_services.schedule_trip("manager-1", "org-1", schedule_data),
            ).rejects.toThrow("Driver has a scheduled trip that overlaps this time");

            expect(mock_prisma.trips.create).not.toHaveBeenCalled();
        });
    });

    describe("start_scheduled_trip", () => {
        it("starts a scheduled trip", async () => {

            const scheduledTrip ={
                trip_id: "trip-1",
                status: "SCHEDULED",
                planned_dest_lat: -26.2,
                planned_dest_lng: 28.2,
            };

            mock_prisma.organization_members.findUnique.mockResolvedValue({
                user_id: "driver-1",
            });

            mock_prisma.trips.findMany.mockResolvedValue([scheduledTrip]);

            mock_prisma.vehicles.findUnique.mockResolvedValue({
                make: "Toyota",
                model: "Corolla",
                year: 2022,
                fuel_efficiency: 8,
            });

            mock_prisma.trips.updateMany.mockResolvedValue({ count: 1 });

            mock_prisma.trips.findUniqueOrThrow.mockResolvedValue({
                ...scheduledTrip,
                status: "IN_PROGRESS",
            });

            const result = await fleet_services.start_scheduled_trip(
                "driver-1",
                "org-1",
                {
                    trip_id: "trip-1",
                    vehicle_id: "vehicle-1",
                    start_time: "2026-09-23T10:00:00Z",
                    start_location: { lat: -26.1, lng: 28.1 },
                    fuel_level_start: 50,
                },
            );

            expect(mock_prisma.trips.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { trip_id: "trip-1", status: "SCHEDULED" },
                    data: expect.objectContaining({
                        status: "IN_PROGRESS",
                        vehicle_id: "vehicle-1",
                        fuel_estimate: 0.96,
                    }),
                }),
            );

            expect(result.status).toBe("IN_PROGRESS");
        });

        it("rejects when another trip is active", async () => {
            mock_prisma.organization_members.findUnique.mockResolvedValue({
                user_id: "driver-1",
            });

            mock_prisma.trips.findMany.mockResolvedValue([
                { trip_id: "active-trip", status: "IN_PROGRESS" },
            ]);

            await expect(
                fleet_services.start_scheduled_trip("driver-1", "org-1", {
                    trip_id: "trip-1",
                    vehicle_id: "vehicle-1",
                    start_time: new Date().toDateString(),
                    start_location: { lat: -26.1, lng: 28.1 },
                }),
            ).rejects.toThrow("Trip already in progress");
        });

        it("rejects when start time is invalid", async () => {
            mock_prisma.organization_members.findUnique.mockResolvedValue({
                user_id: "driver-1",
            });

            mock_prisma.trips.findMany.mockResolvedValue([
                { trip_id: "scheduled-trip", status: "SCHEDULED" },
            ]);

            await expect(
                fleet_services.start_scheduled_trip("driver-1", "org-1", {
                    trip_id: "trip-1",
                    vehicle_id: "vehicle-1",
                    start_time: "",
                    start_location: { lat: -26.1, lng: 28.1 },
                }),
            ).rejects.toThrow("Invalid start time");
        });

        it("rejects when scheduled trip not found", async () => {
            mock_prisma.organization_members.findUnique.mockResolvedValue({
                user_id: "driver-1",
            });

            mock_prisma.trips.findMany.mockResolvedValue([]);

            await expect(
                fleet_services.start_scheduled_trip("driver-1", "org-1", {
                    trip_id: "trip-none",
                    vehicle_id: "vehicle-1",
                    start_time: new Date().toDateString(),
                    start_location: { lat: -26.1, lng: 28.1 },
                }),
            ).rejects.toThrow("Scheduled trip not found");
        });

        it("rejects when driver is not found", async () => {
            mock_prisma.organization_members.findUnique.mockResolvedValue(null);

            await expect(
                fleet_services.start_scheduled_trip("driver-null", "org-1", {
                    trip_id: "trip-1",
                    vehicle_id: "vehicle-1",
                    start_time: new Date().toDateString(),
                    start_location: { lat: -26.1, lng: 28.1 },
                }),
            ).rejects.toThrow("Driver not found");
        });

    });



});












 