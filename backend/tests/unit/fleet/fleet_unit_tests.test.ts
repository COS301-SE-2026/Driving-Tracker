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
        get_fleet_event_counts: jest.fn(),
        update_fleet_vehicle: jest.fn(),
        remove_fleet_vehicle: jest.fn(),
        delete_fleet_driver: jest.fn(),
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
        send: jest.fn(),
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

        it.each([
            ["Driver not found", 404],
            ["Driver not available", 409],
            ["Driver has a scheduled trip that overlaps this time", 409],
            ["Missing required fields", 422],
            ["Unknown start location", 422],
            ["Unknown end location", 422],
            ["Database crashed", 500]
        ])("maps error '%s' to status %i", async (errorMessage, expectedStatus) =>{
            mockFleetServices.schedule_trip.mockRejectedValueOnce(new Error(errorMessage));

            const response = makeResponse();

            await fleet_controller.schedule_trip(
                makeRequest({ body: valid_schedule_payload}),
                response as any
            );

            expectStatus(response, expectedStatus);
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

        it.each([
            ["Scheduled trip not found", 404],
            ["Trip already in progress", 409],
            ["DTrip no longer available to start", 409],
            ["Invalid start time", 422],
            ["Internal error", 500],
        ])("maps error '%s' to status %i", async (errorMessage, expectedStatus) =>{
            mockFleetServices.start_scheduled_trip.mockRejectedValueOnce(new Error(errorMessage));

            const response = makeResponse();

            await fleet_controller.start_scheduled_trip(
                makeRequest({ params: { trip_id: "trip-1" }, body: valid_start_payload}),
                response as any
            );

            expectStatus(response, expectedStatus);
        });
        
    });

    describe("get_fleet_event_counts", () => {

        const mockCounts = {
            harsh_brake: 10,
            harsh_acceleration: 4,
            sharp_corner: 1,
            crash_like: 0,
        }

        it("returns 401 when unauthenticated", async () => {

            const response = makeResponse();

            await fleet_controller.get_fleet_event_counts(
                makeRequest({ user: undefined }),
                response as any
            );
          
          expectStatus(response, 401);
        });
      
      it("returns 403 when user is driver", async () => {

            const response = makeResponse();

            await fleet_controller.get_fleet_event_counts(
                makeRequest({ user: { sub: "user-1", org_id: "org-1", org_role: OrganizationRole.DRIVER } }),
                response as any
              );

            expectStatus(response, 403);
        });
      
      it("returns 200 and event counts when successful with query dates", async () => {

            mockFleetServices.get_fleet_event_counts.mockResolvedValueOnce(mockCounts as any);

            const response = makeResponse();

            await fleet_controller.get_fleet_event_counts(
                makeRequest({
                    query: { 
                        start_date: "2026-10-01T00:00:00Z" ,
                        end_date: "2026-10-05T00:00:00Z"
                    }
                }),
                response as any
            );

            expectStatus(response, 200);

            expect(response.json).toHaveBeenCalledWith({
                message: "Trip event counts retrieved successfully",
                data: mockCounts,
            });

            expect(mockFleetServices.get_fleet_event_counts).toHaveBeenCalledWith(
                "user-1",
                "org-1",
                {
                    start_date: new Date("2026-10-01T00:00:00Z") ,
                    end_date: new Date("2026-10-05T00:00:00Z"),
                }
            );

            
        });

        it.each([
            [ "ValidationError",
                new ValidationError("Invalid start date", "start_date"),
                422,
                "INVALID_START_DATE"
            ],
            [
                "Permission Error",
                new Error("You do not have permission to view fleet event stats"),
                403,
                "UNAUTHORIZED"
            ],
            [
                "Internal Error",
                new Error("Database offline"),
                500,
                "INTERNAL_SERVER_ERROR"
            ],

        ])("maps %s to status %i", async(_name, serviceError, expectedStatus, expecteErrorCode)=>{
            mockFleetServices.get_fleet_event_counts.mockRejectedValueOnce(serviceError);

            const response = makeResponse();
            await fleet_controller.get_fleet_event_counts(
                makeRequest({ query: {}}),
                response as any
            );

            expectStatus(response, expectedStatus);
            expect(response.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: expecteErrorCode })
            );
        });
        
    });
      
    describe("update_fleet_vehicle", () => {
        const valid_update_body = {
            name: "Updated Fleet Van",
            registration: "REG-999",
            make: "Toyota",
            model: "Quantum",
            year: 2022,
            fuel_type: "DIESEL",
            fuel_tank: 70.0
        };

        it("returns 401 when unauthorized", async () => {
            const response = makeResponse();

            await fleet_controller.update_fleet_vehicle(
                makeRequest({ user: undefined, params: { vehicle_id: "v-1"}}),
                response as any,
        );

            expectStatus(response, 401);
        });

      
        it("returns 403 when user does not have permission to edit fleet vehicles", async () => {
            const response = makeResponse();

            await fleet_controller.update_fleet_vehicle(
                makeRequest({ 
                    user: {sub: "user-1", org_id: "org-1", org_role: OrganizationRole.DRIVER },
                    params: { vehicle_id: "v-1"},
                    body: valid_update_body,
                }),
                response as any,
            );

            expectStatus(response, 403);
        });


        it("returns 400 when required fields are missing", async () => {
            const response = makeResponse();

            await fleet_controller.update_fleet_vehicle(
                makeRequest({ 
                    params: { vehicle_id: "v-1"},
                    body: { make: "Toyota" },
                }),
                response as any,
            );

            expectStatus(response, 400);
            expect(response.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: "MISSING_REQUIRED_FIELDS"})
            );
        });

        it("returns 200 when vehicle is successfully updated", async () => {
            const updatedVehicle = { vehicle_id: "v-1", name: "Updated Fleet Van" };
            mockFleetServices.update_fleet_vehicle.mockResolvedValueOnce(updatedVehicle as any);
            const response = makeResponse();

            await fleet_controller.update_fleet_vehicle(
                makeRequest({ 
                    params: { vehicle_id: "v-1"},
                    body: valid_update_body,
                }),
                response as any,
            );

            expectStatus(response, 200);
            expect(response.json).toHaveBeenCalledWith({ data: updatedVehicle });
            expect(mockFleetServices.update_fleet_vehicle).toHaveBeenCalledWith(
                "user-1",
                "org-1",
                "v-1",
                valid_update_body,
            );
        });

        it("returns 404 when vehicle is not found", async () => {
            mockFleetServices.update_fleet_vehicle.mockRejectedValueOnce(new Error("Fleet vehicle not found"));
            const response = makeResponse();

            await fleet_controller.update_fleet_vehicle(
                makeRequest({ 
                    params: { vehicle_id: "missing-v"},
                    body: valid_update_body,
                }),
                response as any,
            );

            expectStatus(response, 404);
            expect(response.json).toHaveBeenCalledWith({ 
                error: "VEHICLE_NOT_FOUND",
                message: "Fleet vehicle not found",
            });
        });

        it("returns 500 when vehicle service fails unexpectedly", async () => {
            mockFleetServices.update_fleet_vehicle.mockRejectedValueOnce(new Error("Database crash"));
            const response = makeResponse();

            await fleet_controller.update_fleet_vehicle(
                makeRequest({ 
                    params: { vehicle_id: "v-1"},
                    body: valid_update_body,
                }),
                response as any,
            );

            expectStatus(response, 500);
            expect(response.json).toHaveBeenCalledWith({ 
                error: "INTERNAL_SERVER_ERROR",
                message: "Failed to update fleet vehicle",
            });
        });
    });

    describe("remove_fleet_vehicle", () => {
        it("returns 401 when unauthorized", async () => {
            const response = makeResponse();

            await fleet_controller.remove_fleet_vehicle(
                makeRequest({ user: undefined, params: { vehicle_id: "v-1"}}),
                response as any,
        );
            expectStatus(response, 401);
        });

        it("returns 403 when user does not have permission to remove fleet vehicles", async () => {
            const response = makeResponse();

            await fleet_controller.remove_fleet_vehicle(
                makeRequest({ 
                    user: {sub: "user-1", org_id: "org-1", org_role: OrganizationRole.DRIVER },
                    params: { vehicle_id: "v-1"},
                }),
                response as any,
            );

            expectStatus(response, 403);
        });

        it("returns 200 when vehicle is successfully removed", async () => {
            const result = { message: "Fleet vehicle removed successfully" };
            mockFleetServices.remove_fleet_vehicle.mockResolvedValueOnce(result as any);
            const response = makeResponse();

            await fleet_controller.remove_fleet_vehicle(
                makeRequest({ 
                    params: { vehicle_id: "v-1"},
                }),
                response as any,
            );

            expectStatus(response, 200);
            expect(response.json).toHaveBeenCalledWith( result );
            expect(mockFleetServices.remove_fleet_vehicle).toHaveBeenCalledWith(
                "user-1",
                "org-1",
                "v-1",
            );
        });

        it("returns 404 when fleet vehicle is not found", async () => {
            mockFleetServices.remove_fleet_vehicle.mockRejectedValueOnce(new Error("Fleet vehicle not found"));
            const response = makeResponse();

            await fleet_controller.remove_fleet_vehicle(
                makeRequest({ 
                    params: { vehicle_id: "missing-v"},
                }),
                response as any,
            );

            expectStatus(response, 404);
            expect(response.json).toHaveBeenCalledWith({ 
                error: "VEHICLE_NOT_FOUND",
                message: "Fleet vehicle not found",
            });
        });

        it("returns 500 when vehicle service fails unexpectedly", async () => {
            mockFleetServices.remove_fleet_vehicle.mockRejectedValueOnce(new Error("Database crash"));
            const response = makeResponse();

            await fleet_controller.remove_fleet_vehicle(
                makeRequest({ 
                    params: { vehicle_id: "v-1"},
                }),
                response as any,
            );

            expectStatus(response, 500);
            expect(response.json).toHaveBeenCalledWith({ 
                error: "INTERNAL_SERVER_ERROR",
                message: "Failed to update fleet vehicle",
            });
        });
    });

    describe("delete_fleet_driver", () => {
        
        it("returns 401 when unauthenticated", async()=> {

            const response = makeResponse();

            await fleet_controller.delete_fleet_driver(
                makeRequest({user: undefined, params: { driver_id: "driver-1"}}),
                response as any,
            );

            expectStatus(response, 401);
            expect (mockFleetServices.delete_fleet_driver).not.toHaveBeenCalled();
        });

        it("returns 403 when user does not have permission to delete fleet drivers", async () => {

            const response = makeResponse();

            await fleet_controller.delete_fleet_driver(
                makeRequest({
                    user: {sub: "user-1", org_id: "org-1", org_role: OrganizationRole.DRIVER},
                    params: {driver_id: "driver-1"},
                }),
                response as any,
            );

            expectStatus(response, 403);
            expect(mockFleetServices.delete_fleet_driver).not.toHaveBeenCalled();
        });

        it("returns 204 when the driver is successfully deleted", async () => {

            mockFleetServices.delete_fleet_driver.mockResolvedValueOnce(undefined as never);
            const response = makeResponse();

            await fleet_controller.delete_fleet_driver(
                makeRequest({
                    params: {driver_id: "driver-1"},
                }),
                response as any,
            );

            expect(mockFleetServices.delete_fleet_driver).toHaveBeenCalledWith(
                "user-1", "org-1", "driver-1",
            );

            expectStatus(response, 204);
            expect(response.send).toHaveBeenCalled();
        });

        it.each([

            ["Not authorized to delete fleet drivers", 403, "UNAUTHORIZED"],
            ["Fleet driver not found", 404, "DRIVER_NOT_FOUND"],
            ["Cancel the driver's scheduled or active trips first.", 409, "DRIVER_HAS_PENDING_TRIPS"],

        ])("maps service error '%s' to %i", async (message, status, error) => {
            
            mockFleetServices.delete_fleet_driver.mockRejectedValueOnce(new Error(message),);
            const response = makeResponse();
            await fleet_controller.delete_fleet_driver(
                makeRequest({params: {driver_id: "driver-1"}}),
                response as any,
            );

            expectStatus(response, status);
            expect(response.json).toHaveBeenCalledWith({error, message});
        });

        it("maps unexpected errors to 500", async () => {

            mockFleetServices.delete_fleet_driver.mockRejectedValueOnce(
                new Error("Database crash"),
            );

            const response = makeResponse();

            await fleet_controller.delete_fleet_driver(
                makeRequest({
                    params: {driver_id: "driver-1"},
                }),
                response as any,
            );

            expectStatus(response, 500);
            expect(response.json).toHaveBeenCalledWith({
                error: "INTERNAL_SERVER_ERROR",
            });
        });

        
    })

});