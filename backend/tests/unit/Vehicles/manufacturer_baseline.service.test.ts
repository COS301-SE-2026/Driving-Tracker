jest.mock("../../../src/services/vehicle.services", () => ({
    fetch_vehicle_benchmark: jest.fn(),
}));

jest.mock("../../../src/db/prisma", () => ({
    __esModule: true,
    default: {
        vehicles: {
            aggregate: jest.fn(),
        },
    },
}));

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { fetch_vehicle_benchmark } from "../../../src/services/vehicle.services";
import prisma from "../../../src/db/prisma";
import { manufacturer_baseline_service } from "../../../src/services/manufacturer_baseline.service";

describe("manufacturer_baseline_service", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("uses the average CAR API efficiency for make, model, and year", async () => {
        jest.mocked(fetch_vehicle_benchmark).mockResolvedValueOnce([
            { combined_mpg: 25 } as any,
            { combined_mpg: 30 } as any,
        ]);

        const result = await manufacturer_baseline_service.get_efficiency({
            make: "Toyota",
            model: "Corolla",
            year: 2016,
        });

        const expectedMpg = (25 + 30) / 2;
        const expectedEfficiency = Number(
            (235.215 / expectedMpg).toFixed(4)
        );

        expect(result).toBe(expectedEfficiency);
        expect(prisma.vehicles.aggregate).not.toHaveBeenCalled();
    });

    it("uses the database average when CAR API fails", async () => {
        jest.mocked(fetch_vehicle_benchmark).mockRejectedValueOnce(new Error("CAR API failed"));

        jest.mocked(prisma.vehicles.aggregate)
            .mockResolvedValueOnce({
                _avg: {
                    fuel_efficiency: 7.4,
                },
            } as any);

        const result = await manufacturer_baseline_service.get_efficiency({
            make: "Toyota",
            model: "Corolla",
            year: 2016,
        });

        expect(result).toBe(7.4);

        expect(prisma.vehicles.aggregate).toHaveBeenCalledWith({
            where: {
                make: {
                    equals: "toyota",
                    mode: "insensitive",
                },
                model: {
                    equals: "corolla",
                    mode: "insensitive",
                },
                year: 2016,
                fuel_efficiency: {
                    not: null,
                },
            },
            _avg: {
                fuel_efficiency: true,
            },
        });
    });

    it("returns null when CAR API and database have no efficiency", async () => {
        jest.mocked(fetch_vehicle_benchmark).mockRejectedValueOnce(new Error("CAR API failed"));

        jest.mocked(prisma.vehicles.aggregate)
            .mockResolvedValueOnce({
                _avg: {
                    fuel_efficiency: null,
                },
            } as any);

        const result = await manufacturer_baseline_service.get_efficiency({
            make: "Toyota",
            model: "Corolla",
            year: 2016,
        });

        expect(result).toBeNull();

    });
});