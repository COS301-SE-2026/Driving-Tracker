jest.mock('../../../src/db/prisma', () => ({
    __esModule: true,
    default: {
        leaderboard: {
            findMany: jest.fn(),
            upsert: jest.fn(),
        },
        users: {
            findUnique: jest.fn(),
        },
        trip_scores: {
            aggregate: jest.fn(),
        }
    },
}));

import {describe, it, expect, jest, beforeEach} from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { leaderboard_services } from '../../../src/services/leaderboard_services';
import { profile } from 'console';

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

        it('returns leaderboard with profile picture paths', async () => {
            mock_prisma.leaderboard.findMany.mockResolvedValue([{
                user_id: 'u1',
                score: new MockDecimal(95.5),
                users: {
                    user_id: 'u1',
                    name: 'John',
                    surname: 'Doe',
                    username: 'johndoe',
                    profile_picture_url: 'blob-abc.png'
                },
            }]);

            const result = await leaderboard_services.get_leaderboard({
                user_id: 'u1',
                category: 'SAFETY',
                scope: 'ALL_TIME'
            });
            expect(result.data.entries[0].profile_picture_url).toBe('upload/profile-picture/u1');
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

    describe('update_user_leaderboards', () =>{

        it('should update leaderboard for all scopes and categories when score exists', async () =>{
            mock_prisma.trip_scores.aggregate.mockResolvedValue({
                _avg: {
                    safety_score: 90.5,
                    eco_score: 88.0,
                    overall_score: 90.25
                }
            });

            mock_prisma.leaderboard.upsert.mockResolvedValue({
                leaderboard_id: 'lead-1',
                user_id: 'u1',
                category: 'SAFETY',
                scope: 'ALL_TIME',
                score: 92.5,
                updated_at: new Date(),
            });

            await leaderboard_services.update_user_leaderboards('u1');

            expect(mock_prisma.leaderboard.upsert).toHaveBeenCalledTimes(9);

        });

        it('should skip category when average score is null', async()=>{
            mock_prisma.trip_scores.aggregate.mockResolvedValue({
                _avg: {
                    safety_score: null,
                    eco_score: 88.0,
                    overall_score: null,
                }
            });

            mock_prisma.leaderboard.upsert.mockResolvedValue({});

            await leaderboard_services.update_user_leaderboards('u1');

            expect(mock_prisma.leaderboard.upsert).toHaveBeenCalledTimes(3);

            mock_prisma.leaderboard.upsert.mock.calls.forEach((call: any) => {
                expect(call[0].where.user_id_category_scope_period_start.category).toBe('ECO');
            });
        });

        it('should throw error when user_id is missing', async()=>{
            await expect(
                leaderboard_services.update_user_leaderboards('')
            ).rejects.toThrow('Missing required fields');

            await expect(
                leaderboard_services.update_user_leaderboards(null as any)
            ).rejects.toThrow('Missing required fields');
        });

        it('should handle Decimal to number conversion', async()=>{
            mock_prisma.trip_scores.aggregate.mockResolvedValue({
                _avg: {
                    safety_score: 87.654,
                    eco_score: 91.234,
                    overall_score: 89.567,
                }
            });

            mock_prisma.leaderboard.upsert.mockResolvedValue({});

            await leaderboard_services.update_user_leaderboards('u1');

            expect(mock_prisma.leaderboard.upsert).toHaveBeenCalledTimes(9);

            const calls = mock_prisma.leaderboard.upsert.mock.calls;
            const safety_call = calls.find((c: any) => c[0].where.user_id_category_scope_period_start.category === 'SAFETY');
            const eco_call = calls.find((c: any) => c[0].where.user_id_category_scope_period_start.category === 'ECO');

            expect(safety_call[0].update.score).toBe(87.65);
            expect(eco_call[0].update.score).toBe(91.23);
        });


        it('should set correct period_start for each scope', async()=>{
            mock_prisma.trip_scores.aggregate.mockResolvedValue({
                _avg: {
                    safety_score: 85.0,
                    eco_score: null,
                    overall_score: null,
                },
            });

            mock_prisma.leaderboard.upsert.mockResolvedValue({});

            await leaderboard_services.update_user_leaderboards('u1');

            const calls = mock_prisma.leaderboard.upsert.mock.calls;

            const all_time_call = calls.find((c: any) => c[0].where.user_id_category_scope_period_start.scope === 'ALL_TIME');
            expect(all_time_call[0].where.user_id_category_scope_period_start.period_start).toEqual(new Date('1970-01-01T00:00:00.000Z'));

            const weekly_call = calls.find((c: any) => c[0].where.user_id_category_scope_period_start.scope === 'WEEKLY');
            const monthly_call = calls.find((c: any) => c[0].where.user_id_category_scope_period_start.scope === 'MONTHLY');

            const now = new Date();

            expect(weekly_call[0].where.user_id_category_scope_period_start.period_start.getTime()).toBeLessThanOrEqual(now.getTime());
            expect(monthly_call[0].where.user_id_category_scope_period_start.period_start.getTime()).toBeLessThanOrEqual(now.getTime());
        });

        it('should skip all categories when aggregate returns no average', async()=>{
            mock_prisma.trip_scores.aggregate.mockResolvedValue({
                _avg: {
                    safety_score: null,
                    eco_score: null,
                    overall_score: null,
                },
            });

            mock_prisma.leaderboard.upsert.mockResolvedValue({});

            await leaderboard_services.update_user_leaderboards('u1');

            expect(mock_prisma.leaderboard.upsert).not.toHaveBeenCalled();
        });

        

    });

});