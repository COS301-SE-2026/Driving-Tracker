import { describe, expect, it, beforeEach, jest } from "@jest/globals";

process.env.JWT_SECRET = "test-secret";

jest.mock("socket.io", () => {
    const mockIo = {
        use: jest.fn(),
        on: jest.fn(),
        to: jest.fn(() => ({
            emit: jest.fn(),
        })),
        in: jest.fn(() => ({
            fetchSockets: jest
            .fn<() => Promise<Array<{ leave: jest.Mock }>>>()
            .mockResolvedValue([]),
            socketsLeave: jest.fn(),
        })),
    };

    return {
        Server: jest.fn(() => mockIo),
    };
});

jest.mock("jsonwebtoken", () => {
    const verify = jest.fn();

    return {
        __esModule: true,
        default: {
            verify,
            TokenExpiredError: class TokenExpiredError extends Error {},
        },
        verify,
    };
});

jest.mock("../../../src/middleware/trip_access", () => ({
    check_trip_access: jest.fn(),
}));

jest.mock("../../../src/services/fleet_services", () => ({
    fleet_services: {
        get_org_id_for_trip: jest.fn(),
        get_view_permission: jest.fn(),
    },
}));

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import {
    initSocket,
    force_revoke_trip_access,
    broadcast_trip_ended,
} from "../../../src/socket";
import { check_trip_access } from "../../../src/middleware/trip_access";
import { fleet_services } from "../../../src/services/fleet_services";


type MockRoom = {
    emit: jest.Mock;
};

type MockSocket = {
    leave: jest.Mock;
};

type MockIo = {
    use: jest.Mock;
    on: jest.Mock;
    to: jest.MockedFunction<(room: string | string[]) =>
        MockRoom>;
    in: jest.MockedFunction<
            (room: string)=> {
                fetchSockets: jest.MockedFunction<
                () => Promise<MockSocket[]>>;
                socketsLeave: jest.Mock;
            }>
};

type AuthMiddleware = (
    socket: {
        handshake: {
            auth: {
                token?: string;
            };
        };
    },
    next: (error?: Error) => void,
) => void;

type ConnectionHandler = (
    socket: ReturnType<typeof createSocket>,
) => void;

function getConnectionHandler(
    io: MockIo,
): ConnectionHandler{

    const calls = io.on.mock.calls as Array<[string, ConnectionHandler]>;
    const handler = calls.find(([event])=> event === "connection")?.[1];

    if(!handler){
        throw new Error("Connection handler was not registered");
    }

    return handler;
}

const mockServer = Server as unknown as jest.Mock;
const mockVerify = jwt.verify as jest.Mock;
const mockCheckTripAccess = check_trip_access as jest.MockedFunction<typeof check_trip_access>;
const mockFleetServices = fleet_services as {
    get_org_id_for_trip: jest.MockedFunction<typeof fleet_services.get_org_id_for_trip>;
    get_view_permission: jest.MockedFunction<typeof fleet_services.get_view_permission>;
    add_organization: jest.MockedFunction<typeof fleet_services.add_organization>;
    list_fleet_drivers: jest.MockedFunction<typeof fleet_services.list_fleet_drivers>;
};

function getMockIo(): MockIo {
    return mockServer.mock.results[mockServer.mock.results.length - 1].value as MockIo;
}

type TestSocket = {
    handshake: {
        auth: {
            token?: string;
        };
    };
    data: {
        user_id: string;
        role: "admin" | "user";
        trip_id: string | null;
        org_id: string | null;
        fleet_org_id: string | null;
        is_trip_owner: boolean | undefined;
    };
    join: jest.Mock;
    leave: jest.Mock;
    emit: jest.Mock;
    on: jest.Mock;
};

function createSocket(): TestSocket {
    return {
        handshake: {
            auth: {
                token: "valid-token",
            },
        },
        data: {
            user_id: "user-1",
            role: "user",
            trip_id: null,
            org_id: null,
            fleet_org_id: null,
            is_trip_owner: undefined,
        },
        join: jest.fn(),
        leave: jest.fn(),
        emit: jest.fn(),
        on: jest.fn(),
    };
}

function getSocketHandlers(socket: ReturnType<typeof createSocket>) {
    return Object.fromEntries(
        socket.on.mock.calls.map(([event, handler]) => [event, handler]),
    );
}


describe("socket", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("authentication", () => {
        it("accepts a valid token", () => {
            mockVerify.mockImplementation(() => ({
                sub: "user-1",
                role: "user",
            }));

            initSocket({} as any);

            const io = getMockIo();
            const authMiddleware = io.use.mock.calls[0][0] as AuthMiddleware;
            const next = jest.fn();

            const authSocket = {
                    handshake: {
                        auth: {
                            token: "valid-token",
                        },
                    },
                    data: {
                        user_id: "",
                        role: "user" as const,
                    },
                };

            authMiddleware(
                authSocket,
                next,
            );

            expect(mockVerify).toHaveBeenCalledWith(
                "valid-token",
                expect.anything(),
            );
            expect(next).toHaveBeenCalledTimes(1);
            expect(next).toHaveBeenCalledWith();
        });

        it("rejects a missing token", () => {
            initSocket({} as any);

            const io = getMockIo();
            const authMiddleware = io.use.mock.calls[0][0] as AuthMiddleware;
            const next = jest.fn();

            authMiddleware(
                {
                    handshake: {
                        auth: {},
                    },
                },
                next,
            );

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "UNAUTHORIZED",
                }),
            );
        });
    });

    describe("join_trip", () => {
        it("joins an authorized user to the trip room", async () => {
            const socket = createSocket();

            mockCheckTripAccess.mockResolvedValue("owner");
            mockFleetServices.get_org_id_for_trip.mockResolvedValue("org-1");

            initSocket({} as any);

            const io = getMockIo();
            const connectionHandler = getConnectionHandler(io);

            connectionHandler(socket);

            const handlers = getSocketHandlers(socket);

            await handlers.join_trip("trip-1");

            expect(mockCheckTripAccess).toHaveBeenCalledWith(
                "user-1",
                "trip-1",
            );
            expect(socket.join).toHaveBeenCalledWith("trip:trip-1");
            expect(socket.data.trip_id).toBe("trip-1");
            expect(socket.data.org_id).toBe("org-1");
            expect(socket.data.is_trip_owner).toBe(true);
        });

        it("rejects a user without trip access", async () => {
            const socket = createSocket();

            mockCheckTripAccess.mockResolvedValue(null);

            initSocket({} as any);

            const io = getMockIo();
            const connectionHandler = getConnectionHandler(io);

            connectionHandler(socket);

            const handlers = getSocketHandlers(socket);

            await handlers.join_trip("trip-1");

            expect(socket.emit).toHaveBeenCalledWith("error", {
                code: "FORBIDDEN",
                event: "join_trip",
            });
            expect(socket.join).not.toHaveBeenCalledWith("trip:trip-1");
        });

        it("rejects joining another trip while already in a trip", async () => {
            const socket = createSocket();
            socket.data.trip_id = "existing-trip";

            initSocket({} as any);

            const io = getMockIo();
            const connectionHandler = getConnectionHandler(io);

            connectionHandler(socket);

            const handlers = getSocketHandlers(socket);

            await handlers.join_trip("trip-2");

            expect(socket.emit).toHaveBeenCalledWith("error", {
                code: "ALREADY_IN_TRIP",
                event: "join_trip",
                message: "Leave current trip before joining another",
            });
        });
    });

    describe("location:update", () => {
        it("broadcasts a valid location update from the trip owner", async () => {
            const socket = createSocket();
            socket.data.is_trip_owner = true;
            socket.data.org_id = "org-1";

            initSocket({} as any);

            const io = getMockIo();
            const connectionHandler = getConnectionHandler(io);

            connectionHandler(socket);

            const handlers = getSocketHandlers(socket);
            const data = {
                trip_id: "trip-1",
                location: {
                    lat: -29.85,
                    lng: 31.02,
                },
                recorded_at: "2026-09-18T12:00:00.000Z",
            };

            await handlers["location:update"](data);

            const broadcastRoom = io.to.mock.results[0].value as MockRoom;

            expect(io.to).toHaveBeenCalledWith([
                "trip:trip-1",
                "fleet:org-1",
            ]);
            expect(broadcastRoom.emit).toHaveBeenCalledWith(
                "location:update",
                data,
            );
        });

        it("rejects location updates from non-owners", async () => {
            const socket = createSocket();
            socket.data.is_trip_owner = false;

            initSocket({} as any);

            const io = getMockIo();
            const connectionHandler = getConnectionHandler(io);

            connectionHandler(socket);

            const handlers = getSocketHandlers(socket);

            await handlers["location:update"]({
                trip_id: "trip-1",
                location: {
                    lat: 1,
                    lng: 2,
                },
                recorded_at: "2026-09-18T12:00:00.000Z",
            });

            expect(socket.emit).toHaveBeenCalledWith("error", {
                code: "FORBIDDEN",
                event: "location:update",
                message: "Only the trip owner can send location updates",
            });
        });
    });

    describe("broadcast helpers", () => {
        it("revokes trip access and removes the user socket", async () => {
            initSocket({} as any);

            const io = getMockIo();
            const socket = {
                leave: jest.fn(),
            };

            const fetchSockets = jest.fn() as jest.MockedFunction<() => Promise<MockSocket[]>>;

            fetchSockets.mockResolvedValue([socket]);

            io.in.mockReturnValue({
                fetchSockets,
                socketsLeave: jest.fn(),
            });

            await force_revoke_trip_access("trip-1", "user-2");

            expect(io.to).toHaveBeenCalledWith("user:user-2");

            const userRoom = io.to.mock.results[0].value as MockRoom;
            expect(userRoom.emit).toHaveBeenCalledWith("access_revoked", {
                trip_id: "trip-1",
            });

            expect(socket.leave).toHaveBeenCalledWith("trip:trip-1");
        });

        it("broadcasts when a trip ends", async () => {
            initSocket({} as any);

            const io = getMockIo();

            await broadcast_trip_ended("trip-1");

            expect(io.to).toHaveBeenCalledWith("trip:trip-1");

            const tripRoom = io.to.mock.results[0].value as MockRoom;
            expect(tripRoom.emit).toHaveBeenCalledWith("trip_ended", {
                trip_id: "trip-1",
            });

            expect(io.in).toHaveBeenCalledWith("trip:trip-1");
        });
    });
});
