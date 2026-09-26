import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { OrganizationRole } from "@prisma/client";
import {
    ConflictError,
    ExtendedError,
    ValidationError,
} from "../../../src/utils/errors";

jest.mock("../../../src/services/fleet_services", () =>({
    fleet_services: {
        add_organization: jest.fn(),
        list_fleet_drivers: jest.fn(),
        list_fleet_vehicles: jest.fn(),
        start_scheduled_trip: jest.fn(),
        list_fleet_trips: jest.fn(),
        schedule_trip: jest.fn(),
    },
}));

jest.mock("../../../src/services/vehicle.services", () =>({
    vehicle_services: {
        add_fleet_vehicle: jest.fn(),
    },
}));

jest.mock("../../../src/services/auth_services", () =>({
    auth_services: {
        add_driver_to_org: jest.fn(),
    },
}));

import fleet_controller from "../../../src/controllers/fleet.controller";
import { fleet_services } from "../../../src/services/fleet_services";
import { vehicle_services } from "../../../src/services/vehicle.services";
import { auth_services } from "../../../src/services/auth_services";
import { before } from "node:test";
import { response } from "express";

const mockFleetServices = fleet_services as jest.Mocked<typeof fleet_services>;
const mockVehicleServices = vehicle_services as jest.Mocked<typeof vehicle_services>;
const mockAuthServices = auth_services as jest.Mocked<typeof auth_services>;

const makeResponse = () =>{
    const response = {
        status: jest.fn(),
        json: jest.fn(),
    };

    response.status.mockReturnValue(response);

    return response;
};

const makeRequest = (overrides: any = {}) =>({
    user: {
        sub: "user-1",
        org_id: "org-1",
        org_role: OrganizationRole.MANAGER,
    },
    body: {},
    params: {},
    query: {},
    ...overrides,
});

const expectStatus = (response: ReturnType<typeof makeResponse>, status: number) => {
    expect(response.status).toHaveBeenCalledWith(status);
};

type AsyncServiceMock = jest.MockedFunction<
    (...args: any[]) => Promise<unknown>
>;

const expectServiceError =async (
    action: (response: ReturnType<typeof makeResponse>) => Promise<unknown>,
    service: AsyncServiceMock,
    error: unknown,
    status: number,
) => {
    service.mockRejectedValueOnce(error);

    const response = makeResponse();
    await action(response);

    expectStatus(response, status);
};

describe("Fleet controller", () =>{

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("add_organization", () => {

        it("returns 401 when unauthenticated", async () => {
            const response = makeResponse();

            await fleet_controller.add_organization(
                makeRequest({ user: undefined }),
                response as any,
            );

            expectStatus(response, 401);

        });

        it("creates an organization", async () => {

            mockFleetServices.add_organization.mockResolvedValueOnce({
                org_id: "org-1",
            });

            const response = makeResponse();

            await fleet_controller.add_organization(
                makeRequest({ body: { name: "Fleet One" } }),
                response as any,
            );

            expect(mockFleetServices.add_organization).toHaveBeenCalledWith(
                "user-1",
                "Fleet One",
            );

            expectStatus(response, 201);

            expect(response.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: { org_id: "org-1" },
                }),
            );
        });

        it.each([
            ["Name cannot be empty", 422, "INVALID_NAME"],
            ["Failed to create organization", 500, "INTERNAL_SERVER_ERROR"],
            ["Failed to add user to organization", 500, "INTERNAL_SERVER_ERROR"],
            ["Unexpected failure", 500, "INTERNAL_SERVER_ERROR"],

        ])("maps %s", async (message, status, error) => {
            mockFleetServices.add_organization.mockRejectedValueOnce(
                new Error(message),
            );

            const response = makeResponse();

            await fleet_controller.add_organization(
                makeRequest({ body: { name: "Fleet One" } }),
                response as any,
            );

            expectStatus(response, status);
            expect(response.json).toHaveBeenCalledWith(
                expect.objectContaining({ error }),
            );
        });

    });

    describe.each([
        [
            "list_fleet_drivers",
            fleet_controller.list_fleet_drivers,
            mockFleetServices.list_fleet_drivers,
            "You do not have permission to list fleet drivers",
            "You do not have the permissions to list fleet drivers",
            "Fleet drivers successfully retrieved",
            "drivers",
        ],
        [
            "list_fleet_vehicles",
            fleet_controller.list_fleet_vehicles,
            mockFleetServices.list_fleet_vehicles,
            "You do not have permission to list fleet vehicles",
            "You do not have the permissions to list fleet vehicles",
            "Fleet vehicles successfully retrieved",
            "vehicles",
        ],
    ])(
        "%s",
        (
            _name,
            controller,
            service,
            permissionError,
            forbiddenMessage,
            successMessage,
            dataKey,
        ) => {

            it("returns 401 when unauthenticated", async () => {
                const response = makeResponse();

                await controller(
                    makeRequest({ user: undefined }),
                    response as any,
                );

                expectStatus(response, 401);
            });

            it.each([
                {
                    user: {
                        sub: "user-1",
                        org_id: "org-1",
                        org_role: undefined,
                    },
                },
                {
                    user: {
                        sub: "user-1",
                        org_id: undefined,
                        org_role: OrganizationRole.MANAGER,
                    },
                },

            ])("returns 500 for an inconsistent session", async (request) => {
                const response = makeResponse();

                await controller(makeRequest(request), response as any);

                expectStatus(response, 500);
            });

            it("returns 403 when organization context is missing", async () => {

                const response = makeResponse();

                await controller(
                    makeRequest({
                        user: {
                            sub: "user-1",
                            org_id: undefined,
                            org_role: undefined,
                        },
                    }),
                    response as any,
                );

                expectStatus(response, 403);
            });

            it("returns the service result", async () => {

                const data = [{ id: "item-1" }];

                service.mockResolvedValueOnce(data as never);

                const response = makeResponse();

                await controller(makeRequest(), response as any);

                expectStatus(response, 200);
                expect(response.json).toHaveBeenCalledWith({
                    message: successMessage,
                    data: { [dataKey]: data },
                });
            });

            it("maps service permission errors to 403", async () => {

                await expectServiceError(
                    (response) => controller(makeRequest(), response as any),
                    service,
                    new Error(permissionError),
                    403,
                );

            });

            it("maps unexpected errors to 500", async () => {

                await expectServiceError(
                    (response) => controller(makeRequest(), response as any),
                    service,
                    new Error("Unexpected failure"),
                    500,
                );

            });
        },
    );

    describe("list_fleet_trips", () => {
        const request = makeRequest({
            query: { driver_id: "driver-1" },
        });

        it("returns 401 when unauthenticated", async () => {

            const response = makeResponse();

            await fleet_controller.list_fleet_trips(
                makeRequest({ user: undefined }),
                response as any,
            );

            expectStatus(response, 401);
        });

        it("returns 500 for an inconsistent session", async () => {

            const response = makeResponse();

            await fleet_controller.list_fleet_trips(
                makeRequest({
                    user: {
                        sub: "user-1",
                        org_id: "org-1",
                        org_role: undefined,
                    },
                }),
                response as any,
            );

            expectStatus(response, 500);
        });

        it("returns 403 without organization context", async () => {

            const response = makeResponse();

            await fleet_controller.list_fleet_trips(
                makeRequest({
                    user: {
                        sub: "user-1",
                        org_id: undefined,
                        org_role: undefined,
                    },
                }),
                response as any,
            );

            expectStatus(response, 403);
        });

        it("returns fleet trips", async () => {

            const trips = [{ trip_id: "trip-1" }];

            mockFleetServices.list_fleet_trips.mockResolvedValueOnce(trips as never);

            const response = makeResponse();

            await fleet_controller.list_fleet_trips(request, response as any);

            expect(mockFleetServices.list_fleet_trips).toHaveBeenCalledWith(
                "user-1",
                "org-1",
                { driver_id: "driver-1" },
            );

            expectStatus(response, 200);
            expect(response.json).toHaveBeenCalledWith({
                message: "Fleet trips retrieved successfully",
                data: { trips },
            });
        });

        it("maps validation errors to 422", async () => {

            mockFleetServices.list_fleet_trips.mockRejectedValueOnce(
                new ValidationError("Invalid start date", "start_date"),
            );

            const response = makeResponse();

            await fleet_controller.list_fleet_trips(request, response as any);

            expectStatus(response, 422);
            expect(response.json).toHaveBeenCalledWith({
                error: "INVALID_START_DATE",
                message: "Invalid start date",
            });
        });

        it.each([
            ["Not a member of this organization", 403],
            ["Unexpected failure", 500],
        ])("maps %s", async (message, status) => {
            mockFleetServices.list_fleet_trips.mockRejectedValueOnce(
                new Error(message),
            );

            const response = makeResponse();

            await fleet_controller.list_fleet_trips(request, response as any);

            expectStatus(response, status);
        });

    });

    describe("add_fleet_vehicle", () => {

        const body ={
            name: "Delivery Van",
            registration: "ABC-123",
            make: "Toyota",
            model: "Corolla",
            year: 2022,
            fuel_type: "PETROL",
            fuel_tank: 50,
        };

        it("returns 403 when unauthenticated", async () => {

            const response = makeResponse();

            await fleet_controller.add_fleet_vehicle(
                makeRequest({ user: undefined }),
                response as any,
            );

            expectStatus(response, 403);
        });

        it("returns 500 for an inconsistent session", async () => {

            const response = makeResponse();

            await fleet_controller.add_fleet_vehicle(
                makeRequest({
                    user: {
                        sub: "user-1",
                        org_id: "org-1",
                        org_role: undefined,
                    },
                }),
                response as any,
            );

            expectStatus(response, 500);
        });

        it("returns 403 without sufficient permissions", async () => {

            const response = makeResponse();

            await fleet_controller.add_fleet_vehicle(
                makeRequest({
                    user: {
                        sub: "user-1",
                        org_id: "org-1",
                        org_role: OrganizationRole.DRIVER,
                    },
                }),
                response as any,
            );

            expectStatus(response, 403);
        });

        it("returns 400 when required fields are missing", async () => {

            const response = makeResponse();

            await fleet_controller.add_fleet_vehicle(
                makeRequest({ body: { make: "Toyota" } }),
                response as any,
            );

            expectStatus(response, 400);
            expect(mockVehicleServices.add_fleet_vehicle).not.toHaveBeenCalled();
        });

        it("adds a fleet vehicle", async () => {

            const result = { vehicle_id: "vehicle-1" };
            mockVehicleServices.add_fleet_vehicle.mockResolvedValueOnce(result as never);

            const response = makeResponse();

            await fleet_controller.add_fleet_vehicle(
                makeRequest({ body }),
                response as any,
            );

            expect(mockVehicleServices.add_fleet_vehicle).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: "user-1",
                    make: "Toyota",
                    model: "Corolla",
                }),
                "org-1",
            );

            expectStatus(response, 201);
            expect(response.json).toHaveBeenCalledWith(result);
        });

        it.each([
            ["User does not exist", 404, "MEMBER_NOT_FOUND"],
            ["Missing field(s)", 400, "MISSING_REQUIRED_FIELDS"],
            ["You do not have access to add fleet vehicles", 403, "UNAUTHORIZED"],
            ["Unexpected failure", 500, "INTERNAL_SERVER"],
        ])("maps %s", async (message, status, error) => {
            mockVehicleServices.add_fleet_vehicle.mockRejectedValueOnce(
                new Error(message),
            );

            const response = makeResponse();

            await fleet_controller.add_fleet_vehicle(
                makeRequest({ body }),
                response as any,
            );

            expectStatus(response, status);
            expect(response.json).toHaveBeenCalledWith(
                expect.objectContaining({ error }),
            );
        });
    });

    describe("add_driver", () => {
        const body ={
            email: "driver@example.com",
            username: "driver1",
            name: "Jane",
            surname: "Doe",
            phone_number: "0601234567",
            dob: "1990-01-01",
        };

        it("returns 401 when unauthenticated", async () => {

            const response = makeResponse();

            await fleet_controller.add_driver(
                makeRequest({ user: undefined }),
                response as any,
            );

            expectStatus(response, 401);
        });

        it("returns 500 for an inconsistent session", async () => {

            const response = makeResponse();

            await fleet_controller.add_driver(
                makeRequest({
                    user: {
                        sub: "user-1",
                        org_id: "org-1",
                        org_role: undefined,
                    },
                }),
                response as any,
            );

            expectStatus(response, 500);
        });

        it("returns 403 without organization context", async () => {

            const response = makeResponse();

            await fleet_controller.add_driver(
                makeRequest({
                    user: {
                        sub: "user-1",
                        org_id: undefined,
                        org_role: undefined,
                    },
                }),
                response as any,
            );

            expectStatus(response, 403);
        });

        it("adds a driver", async () => {

            mockAuthServices.add_driver_to_org.mockResolvedValueOnce({} as never);

            const response =makeResponse();

            await fleet_controller.add_driver(
                makeRequest({ body }),
                response as any,
            );

            expect(mockAuthServices.add_driver_to_org).toHaveBeenCalledWith(
                "user-1",
                "org-1",
                body,
            );

            expectStatus(response, 201);
        });

        it.each([
            [
                new ValidationError("Invalid email", "email"),
                422,
                "INVALID_EMAIL",
            ],
            [
                new ConflictError("Email already exists", "email"),
                409,
                "EMAIL_TAKEN",
            ],
            [
                new ExtendedError("Not authorized", "UNAUTHORIZED"),
                403,
                "UNAUTHORIZED",
            ],
            [new Error("Unexpected failure"), 500, "INTERNAL_SERVER_ERROR"],
        ])("maps service errors", async (error, status, errorCode) =>{

            mockAuthServices.add_driver_to_org.mockRejectedValueOnce(error);

            const response = makeResponse();

            await fleet_controller.add_driver(
                makeRequest({ body }),
                response as any,
            );

            expectStatus(response, status);
            expect(response.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: errorCode }),
            );
        });

    });

    describe("schedule_trip", () => {
        const valid_schedule_payload = {
            vehicle_id: "vehicle-1",
            driver_id: "driver-1",
            planned_start_time: "2026-10-01T10:00:00Z",
            title: "Client Visit",
            task: "Deliver package",
            planned_start_location: { address: "15 Hemming St", lat: -26.2, lng: 28.0 },
            planned_end_location: { address: "25 Crown Road", lat: -26.3, lng: 28.1 },
            stops: [
                { address: "Stop 1", lat: -26.25, lng: 28.05, stop_order: 1 }
            ]
        };

        it("returns 401 when unauthenticated", async () => {
            const response = makeResponse();
            await fleet_controller.schedule_trip(
                makeRequest({ user: undefined }),
                response as any
            );
            expectStatus(response, 401);
        });

        it("returns 403 when user is DRIVER", async () => {
            const response = makeResponse();

            await fleet_controller.schedule_trip(
                makeRequest({
                    user: { sub: "user-1", org_id: "org-1", org_role: OrganizationRole.DRIVER }
                }),
                response as any
            );

            expectStatus(response, 403);
        });

        it("returns 201 when trip is successfully scheduled", async () => {

            const mockScheduledTrip = {
                trip: { trip_id: "trip-1", status: "SCHEDULED" },
                route: [{ lat: -26.2, lng: 28.0 }]
            };

            mockFleetServices.schedule_trip.mockResolvedValueOnce(mockScheduledTrip as any);

            const response = makeResponse();

            await fleet_controller.schedule_trip(
                makeRequest({ body: valid_schedule_payload }),
                response as any
            );

            expectStatus(response, 201);

            expect(response.json).toHaveBeenCalledWith({
                message: "Trip successfully scheduled",
                data: mockScheduledTrip
            });

            expect(mockFleetServices.schedule_trip).toHaveBeenCalledWith(
                "user-1",
                "org-1",
                {
                    vehicle_id: "vehicle-1",
                    driver_id: "driver-1",
                    planned_start_time: "2026-10-01T10:00:00Z",
                    title: "Client Visit",
                    description: "Deliver package",
                    planned_start_location: { address: "15 Hemming St", lat: -26.2, lng: 28.0 },
                    planned_end_location: { address: "25 Crown Road", lat: -26.3, lng: 28.1 },
                    stops: [{ address: "Stop 1", lat: -26.25, lng: 28.05, stop_order: 1 }]
                }
            );
        });

        it("returns 404 when driver is not found", async () => {
            mockFleetServices.schedule_trip.mockRejectedValueOnce(new Error("Driver not found"));

            const response = makeResponse();

            await fleet_controller.schedule_trip(
                makeRequest({ body: valid_schedule_payload }),
                response as any
            );
            expectStatus(response, 404);
        });

        it("returns 409 when driver is not available (active trip)", async () => {
            mockFleetServices.schedule_trip.mockRejectedValueOnce(new Error("Driver not available"));

            const response = makeResponse();

            await fleet_controller.schedule_trip(
                makeRequest({ body: valid_schedule_payload }),
                response as any
            );

            expectStatus(response, 409);
        });

        it("returns 409 when driver has overlapping scheduled trip", async () => {

            mockFleetServices.schedule_trip.mockRejectedValueOnce(
                new Error("Driver has a scheduled trip that overlaps this time")
            );

            const response = makeResponse();

            await fleet_controller.schedule_trip(
                makeRequest({ body: valid_schedule_payload }),
                response as any
            );

            expectStatus(response, 409);
        });

        it("returns 422 when required fields are missing", async () => {

            mockFleetServices.schedule_trip.mockRejectedValueOnce(new Error("Missing required fields"));
            
            const response = makeResponse();

            await fleet_controller.schedule_trip(
                makeRequest({ body: valid_schedule_payload }),
                response as any
            );

            expectStatus(response, 422);
        });

        it("returns 422 when start location is invalid", async () => {

            mockFleetServices.schedule_trip.mockRejectedValueOnce(new Error("Unknown start location"));

            const response = makeResponse();

            await fleet_controller.schedule_trip(
                makeRequest({ body: valid_schedule_payload }),
                response as any
            );

            expectStatus(response, 422);
        });

        it("returns 422 when end location is invalid", async () => {
            mockFleetServices.schedule_trip.mockRejectedValueOnce(new Error("Unknown end location"));

            const response = makeResponse();

            await fleet_controller.schedule_trip(
                makeRequest({ body: valid_schedule_payload }),
                response as any
            );

            expectStatus(response, 422);
        });

        it("returns 500 on unexpected error", async () => {

            mockFleetServices.schedule_trip.mockRejectedValueOnce(new Error("Database Crashed"));

            const response = makeResponse();

            await fleet_controller.schedule_trip(
                makeRequest({ body: valid_schedule_payload }),
                response as any
            );

            expectStatus(response, 500);
        });
    });

    describe("start_scheduled_trip", () => {

        const valid_start_payload = {
            vehicle_id: "vehicle-1",
            start_time: "2026-10-01T10:05:00Z",
            start_location: { lat: -26.2, lng: 28.0 },
            fuel_level_start: 85.5
        };

        it("returns 401 when unauthenticated", async () => {

            const response = makeResponse();

            await fleet_controller.start_scheduled_trip(
                makeRequest({ user: undefined, params: { trip_id: "trip-1" } }),
                response as any
            );

            expectStatus(response, 401);
        });

        it("returns 200 when scheduled trip starts successfully", async () => {

            const mockStartedTrip = { trip_id: "trip-1", status: "IN_PROGRESS" };

            mockFleetServices.start_scheduled_trip.mockResolvedValueOnce(mockStartedTrip as any);

            const response = makeResponse();

            await fleet_controller.start_scheduled_trip(
                makeRequest({
                    params: { trip_id: "trip-1" },
                    body: valid_start_payload
                }),
                response as any
            );

            expectStatus(response, 200);

            expect(response.json).toHaveBeenCalledWith({
                message: "Scheduled trip started successfully",
                data: mockStartedTrip
            });

            expect(mockFleetServices.start_scheduled_trip).toHaveBeenCalledWith(
                "user-1",
                "org-1",
                {
                    trip_id: "trip-1",
                    vehicle_id: "vehicle-1",
                    start_time: "2026-10-01T10:05:00Z",
                    start_location: { lat: -26.2, lng: 28.0 },
                    fuel_level_start: 85.5
                }
            );
        });

        it("returns 404 when scheduled trip is not found", async () => {

            mockFleetServices.start_scheduled_trip.mockRejectedValueOnce(
                new Error("Scheduled trip not found")
            );

            const response = makeResponse();

            await fleet_controller.start_scheduled_trip(
                makeRequest({ params: { trip_id: "trip-999" }, body: valid_start_payload }),
                response as any
            );

            expectStatus(response, 404);
        });

        it("returns 409 when trip is already in progress", async () => {

            mockFleetServices.start_scheduled_trip.mockRejectedValueOnce(
                new Error("Trip already in progress")
            );

            const response = makeResponse();

            await fleet_controller.start_scheduled_trip(
                makeRequest({ params: { trip_id: "trip-1" }, body: valid_start_payload }),
                response as any
            );

            expectStatus(response, 409);
        });

        it("returns 409 when trip is no longer available to start", async () => {

            mockFleetServices.start_scheduled_trip.mockRejectedValueOnce(
                new Error("Trip no longer available to start")
            );
            
            const response = makeResponse();

            await fleet_controller.start_scheduled_trip(
                makeRequest({ params: { trip_id: "trip-1" }, body: valid_start_payload }),
                response as any
            );

            expectStatus(response, 409);
        });

        it("returns 422 when start_time is invalid", async () => {

            mockFleetServices.start_scheduled_trip.mockRejectedValueOnce(
                new Error("Invalid start time")
            );
            
            const response = makeResponse();

            await fleet_controller.start_scheduled_trip(
                makeRequest({ params: { trip_id: "trip-1" }, body: valid_start_payload }),
                response as any
            );

            expectStatus(response, 422);
        });

        it("returns 500 on unexpected errors", async () => {

            mockFleetServices.start_scheduled_trip.mockRejectedValueOnce(
                new Error("Internal error")
            );

            const response = makeResponse();

            await fleet_controller.start_scheduled_trip(
                makeRequest({ params: { trip_id: "trip-1" }, body: valid_start_payload }),
                response as any
            );

            expectStatus(response, 500);
        });
    });

});