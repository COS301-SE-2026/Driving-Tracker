jest.mock('../../../src/db/prisma', () => ({
    __esModule: true,
    default: {
        leaderboard: {
        findMany: jest.fn(),
        },
        users: {
        findUnique: jest.fn(),
        },
    },
}));

import {describe, it, expect, jest, beforeEach} from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { leaderboard_services } from '../../../src/services/leaderboard_services';

const mock_prisma = prisma as any ;

class MockDecimal{
    constructor(private value: number) {}
    toNumber() {
        return this.value;
    }
}

describe('Leaderboard servies', () => {

    beforeEach(async()=>{jest.clearAllMocks()});

    describe('Leaderboard services get leaderboard',()=>{
        
        it('returns leaderboard with the user rank when user exists in leaderboard', async()=>{
            mock_prisma.leaderboard.findMany.mockResolvedValue([
                {
                    leaderboard_id: 'lb1',
                    user_id: 'u1',
                    category: 'SAFETY',
                    scope: 'ALL_TIME',
                    score: new MockDecimal(95.5),
                    users: {
                    user_id: 'u1',
                    name: 'John',
                    surname: 'Doe',
                    username: 'johndoe',
                    },
                },
                {
                    leaderboard_id: 'lb2',
                    user_id: 'u2',
                    category: 'SAFETY',
                    scope: 'ALL_TIME',
                    score: new MockDecimal(90.0),
                    users: {
                    user_id: 'u2',
                    name: 'Jane',
                    surname: 'Smith',
                    username: 'janesmith',
                    },
                },
                {
                    leaderboard_id: 'lb3',
                    user_id: 'u3',
                    category: 'SAFETY',
                    scope: 'ALL_TIME',
                    score: new MockDecimal(85.5),
                    users: {
                    user_id: 'u3',
                    name: null,
                    surname: 'Brown',
                    username: 'brownie',
                    },
                },
            ]);

            const result = await leaderboard_services.get_leaderboard({
                user_id: 'u2',
                category:'SAFETY',
                scope:'ALL_TIME',
            });

            expect(result.data.category).toBe('SAFETY');
            expect(result.data.scope).toBe('ALL_TIME');
            expect(result.data.entries.length).toBe(3);
            expect(result.data.my_rank).toBe(2);
            expect(result.data.my_score).toBe(90);
        });
        it('returns null rank when the user not in leaderboard', async()=>{
            mock_prisma.leaderboard.findMany.mockResolvedValue([
                {
                    leaderboard_id: 'lb1',
                    user_id: 'u1',
                    category: 'ECO',
                    scope: 'WEEKLY',
                    score: new MockDecimal(88.0),
                    users: {
                        user_id: 'u1',
                        name: 'Alice',
                        surname: 'Johnson',
                        username: 'alice',
                    },
                },
            ]);

            const result = await leaderboard_services.get_leaderboard({
                user_id: 'u999',
                category:'ECO',
                scope:'WEEKLY',
            });

            expect(result.data.entries.length).toBe(1);
            expect(result.data.my_rank).toBeNull();
            expect(result.data.my_score).toBe(0);
        });
        it('throws when category is missing', async () => {
            await expect(
            leaderboard_services.get_leaderboard({
                user_id: 'u1',
                category: '',
                scope: 'ALL_TIME',
            })
            ).rejects.toThrow('Missing required fields');
        });
        it('throws when scope is missing', async () => {
            await expect(
            leaderboard_services.get_leaderboard({
                user_id: 'u1',
                category: 'SAFETY',
                scope: '',
            })
            ).rejects.toThrow('Missing required fields');
        });

        it('returns empty leaderboard when no entries', async () => {
            mock_prisma.leaderboard.findMany.mockResolvedValue([]);

            const result = await leaderboard_services.get_leaderboard({
                user_id: 'u1',
                category: 'SAFETY',
                scope: 'ALL_TIME',
            });

            expect(result.data.entries.length).toBe(0);
            expect(result.data.my_rank).toBeNull();
            expect(result.data.my_score).toBe(0);
        });
    });

    describe('get categories', () =>{

        it('returns list of categories', async () =>{
            // mock_prisma.leaderboard.findMany.mockResolvedValue([
            //     {category: 'SAFETY'},
            //     {category: 'ECO'},
            //     {category: 'OVERALL'},
            // ]);

            const result = await leaderboard_services.get_categories();

            expect(result.data.categories).toEqual(['OVERALL', 'ECO', 'SAFETY']);
            expect(result.data.categories.length).toBe(3);

        });

        // it('filters out null categories', async () =>{
        //     mock_prisma.leaderboard.findMany.mockResolvedValue([
        //         {category: 'SAFETY'},
        //         {category: null},
        //         {category: 'OVERALL'},
        //     ]);

        //     const result = await leaderboard_services.get_categories();

        //     expect(result.data.categories).toEqual(['SAFETY', 'OVERALL']);
        //     expect(result.data.categories.length).toBe(2);
        // });

    });

    describe('get scopes', () =>{

        it('returns list of scopes', async () =>{
            // mock_prisma.leaderboard.findMany.mockResolvedValue([
            //     {scope: 'WEEKLY'},
            //     {scope: 'ALL_TIME'},
            //     {scope: 'MONTHLY'},
            // ]);

            const result = await leaderboard_services.get_scopes();

            expect(result.data.scopes).toEqual(['ALL_TIME', 'MONTHLY', 'WEEKLY']);
            expect(result.data.scopes.length).toBe(3);

        });

        // it('filters out null scopes', async () =>{
        //     mock_prisma.leaderboard.findMany.mockResolvedValue([
        //         {scope: 'WEEKLY'},
        //         {scope: 'ALL_TIME'},
        //         {scope: null},
        //     ]);

        //     const result = await leaderboard_services.get_scopes();

        //     expect(result.data.scopes).toEqual(['WEEKLY', 'ALL_TIME']);
        //     expect(result.data.scopes.length).toBe(2);

        // });

    });

});