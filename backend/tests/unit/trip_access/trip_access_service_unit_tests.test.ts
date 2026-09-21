jest.mock('../../../src/db/prisma', () => {

    const trip_location_shares = {
        findFirst: jest.fn(),
    };

    const trips = {
        findUnique: jest.fn(),
    };
 
    return {
        __esModule: true,
        default: {
            trip_location_shares,
            trips
        },
    };
});


import { describe, it, expect, jest, beforeEach,afterAll,afterEach } from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { check_trip_access } from '../../../src/middleware/trip_access';
import { requireTripAccess } from '../../../src/middleware/trip_access';


const mock_prisma = prisma as any;

describe('trip_access middleware ', () => {

    const make_res = () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        return { status, json };
    };
    
    describe('check trip access ', () => {
        beforeEach(async()=> jest.clearAllMocks());

        it("returns owner when user is trip owner", async()=>{

            (mock_prisma.trips.findUnique).mockResolvedValue({
                user_id: 'user-1',
            });

            const result = await check_trip_access('user-1', 'trip-1');

            expect(result).toBe('owner');
        });

        it("returns shared when user had the trip shared with them", async()=>{

            (mock_prisma.trips.findUnique).mockResolvedValue({
                user_id: 'user-3',
            });

            (mock_prisma.trip_location_shares.findFirst).mockResolvedValue({
                trip_id: 'trip-2',
            });

            const result = await check_trip_access('user-2', 'trip-2');

            expect(result).toBe('shared');
        });

        it("returns null when user does not have access to the trip", async()=>{

            (mock_prisma.trips.findUnique).mockResolvedValue({
                user_id: 'user-5',
            });

            (mock_prisma.trip_location_shares.findFirst).mockResolvedValue(null);

            const result = await check_trip_access('user-4', 'trip-3');

            expect(result).toBe(null);
        });

    });

    describe('require trip access ', () => {
        beforeEach(async()=> jest.clearAllMocks());

        it("calls next when user owns trip", async()=>{

            mock_prisma.trips.findUnique.mockResolvedValue({
                user_id: 'user-1',
            });

            const req: any = {
                user: { sub: 'user-1' },
                params: { trip_id: 'trip-1' },
            };

            const res: any = make_res();
            const next = jest.fn();

            await requireTripAccess(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("returns 403 when the user has no access", async()=>{

            mock_prisma.trips.findUnique.mockResolvedValue({
                user_id: 'diff-user',
            });

            mock_prisma.trip_location_shares.findFirst.mockResolvedValue(null);

            const req: any = {
                user: { sub: 'user-1' },
                params: { trip_id: 'trip-1' },
            };

            const res: any = make_res();
            const next = jest.fn();

            await requireTripAccess(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                error: "UNAUTHORIZED",
                message: "You are not authorized to view this trip",
            });

        });

    });

});