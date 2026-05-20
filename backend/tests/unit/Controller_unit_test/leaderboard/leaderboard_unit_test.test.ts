jest.mock('../../../../src/services/leaderboard_services');

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import leaderboard_controller from '../../../../src/controllers/leaderboard.controller';
const { get_leaderboard } = leaderboard_controller;
import { leaderboard_services } from '../../../../src/services/leaderboard_services';

describe('Leaderboard Controller', () => {
    beforeEach(() => {jest.clearAllMocks();});

    const make_res = () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        return { status, json };
    };

    describe('Get leaderboard endpoint', () => {
        it('Returns 200 and leaderboard data on success', async () => {
            const mock_leaderboard = {
                data: {
                category: 'safety_score',
                scope: 'global',
                entries: [
                    { rank: 1, user_id: 'user-2', display_name: 'John Doe', score: 98 },
                    { rank: 2, user_id: 'user-1', display_name: 'Jane Smith', score: 95 },
                    { rank: 3, user_id: 'user-3', display_name: 'Bob Johnson', score: 92 },
                ],
                my_rank: 2,
                my_score: 95,
                },
            };
            jest.spyOn(leaderboard_services, 'get_leaderboard').mockResolvedValueOnce(mock_leaderboard as any);

            const req: any = {
                user: { sub: 'user-1' },
                query: { category: 'safety_score', scope: 'global' },
            };
            const res: any = make_res();

            await get_leaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mock_leaderboard);
        });

        it('Returns 400 when category query parameter is missing', async () => {
            const req: any = { user: { sub: 'user-1' }, query: { scope: 'global' } };
            const res: any = make_res();

            await get_leaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'BAD_REQUEST',
                message: expect.stringContaining('Missing category or scope')
            }));
        });

        it('Returns 400 when scope query parameter is missing', async () => {
            const req: any = { user: { sub: 'user-1' }, query: { category: 'safety_score' } };
            const res: any = make_res();

            await get_leaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'BAD_REQUEST' }));
        });

        it('Returns 400 when category is not a string', async () => {
            const req: any = {
                user: { sub: 'user-1' },
                query: { category: { nested: 'object' }, scope: 'global' },
            };
            const res: any = make_res();

            await get_leaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'BAD_REQUEST' }));
        });

        it('Returns 200 and leaderboard with user not ranked when user not in leaderboard', async () => {
            const mockLeaderboard = {
                data: {
                category: 'safety_score',
                scope: 'global',
                entries: [
                    { rank: 1, user_id: 'user-2', display_name: 'John Doe', score: 98 },
                    { rank: 2, user_id: 'user-3', display_name: 'Bob Johnson', score: 92 },
                ],
                my_rank: null,
                my_score: 0,
                },
            };
            jest.spyOn(leaderboard_services, 'get_leaderboard').mockResolvedValueOnce(mockLeaderboard as any);

            const req: any = {
                user: { sub: 'user-1' },
                query: { category: 'safety_score', scope: 'global' },
            };
            const res: any = make_res();

            await get_leaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ my_rank: null })
            }));
        });

        it('Returns 200 with category eco_score and scope friends', async () => {
            const mock_leaderboard = {
                data: {
                    category: 'eco_score',
                    scope: 'friends',
                    entries: [
                        { rank: 1, user_id: 'user-1', display_name: 'Jane Smith', score: 88 },
                    ],
                    my_rank: 1,
                    my_score: 88,
                    },
                };
            jest.spyOn(leaderboard_services, 'get_leaderboard').mockResolvedValueOnce(mock_leaderboard as any);
            const req: any = {
                user: { sub: 'user-1' },
                query: { category: 'eco_score', scope: 'friends' },
            };
            const res: any = make_res();

                await get_leaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(leaderboard_services.get_leaderboard).toHaveBeenCalledWith(expect.objectContaining({ category: 'eco_score', scope: 'friends' }));
        });
    });
});
