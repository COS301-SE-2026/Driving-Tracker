jest.mock('../../../src/db/prisma', () => {
    const users = {
        findUnique: jest.fn(),
        findMany: jest.fn(),
    };
    const trips = {
        findUnique: jest.fn(),
    };
    const organization_members = {
        findUnique: jest.fn(),
    };

    const $transaction = jest.fn(async (fn: any) => await fn({
        users,
        trips,
    }));
 
    return {
        __esModule: true,
        default: {
            users,
            trips,
            organization_members,
            $transaction
        },
    };
});


import { describe, it, expect, jest, beforeEach,afterAll,afterEach } from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { fleet_services } from '../../../src/services/fleet_services';


const mock_prisma = prisma as any;

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

});












 