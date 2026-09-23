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
    planned_start_time: new Date("2026-09-23T10:00:00Z"),
    planned_start_location: { lat: -26.1, lng: 28.1 },
    planned_end_location: { lat: -26.2, lng: 28.2 },
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

});












 