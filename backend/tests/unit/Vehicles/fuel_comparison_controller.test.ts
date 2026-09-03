jest.mock("../../../src/services/vehicle.services");

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { get_fuel_comparison } from "../../../src/controllers/vehicle.controller";
import { vehicle_services } from "../../../src/services/vehicle.services";

describe("GET /vehicle/fuel_comparison", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const makeResponse = () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        return { status, json };
    };

    it("returns 200 with fuel comparison data", async () => {

        const comparison = {
            vehicle: {
                vehicle_id: "vehicles-1",
                make: "Toyota",
                model: "Corolla",
                year: 2016,
                fuel_type: "PETROL",
                registration: "ABC123",
            },
            manufacturer_standard: 6.8,
            user_average: 7.2,
            peer_leaderboard: [],
        };

        jest.spyOn(vehicle_services, "get_fuel_comparison")
            .mockResolvedValueOnce(comparison as any);

        const req: any = {
            user: { sub: "user-1" },
        };
        const res: any = makeResponse();

        await get_fuel_comparison(req, res);

        expect(vehicle_services.get_fuel_comparison).toHaveBeenCalledWith({ user_id: "user-1" });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ data: comparison, });

    });

    it("returns 401 when the user is unauthenticated", async () => {

        const req: any = {
            user: undefined,
        };
        const res: any = makeResponse();

        await get_fuel_comparison(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "UNAUTHORIZED",
        });

        expect(vehicle_services.get_fuel_comparison).not.toHaveBeenCalled();

    });

    it("returns 401 when the user id is missing", async () => {

        const req: any = {
            user: { sub: null},
        };
        const res: any = makeResponse();

        await get_fuel_comparison(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            error: "UNAUTHORIZED",
        });

    });

    it("returns 500 when the user has no vehicle", async () => {

        jest.spyOn(vehicle_services, "get_fuel_comparison")
            .mockRejectedValueOnce(new Error("No vehicle found for this user"));

        const req: any = {
            user: { sub: "user-1" },
        };
        const res: any = makeResponse();

        await get_fuel_comparison(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "INTERNAL_SERVER_ERROR",
            message: "No vehicle found for this user",
        });

    });

    it("returns 500 when the comparison service fails", async () => {

        jest.spyOn(vehicle_services, "get_fuel_comparison")
            .mockRejectedValueOnce(new Error("Database unavailable"));

        const req: any = {
            user: { sub: "user-1" },
        };
        const res: any = makeResponse();

        await get_fuel_comparison(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
        });

    });

});