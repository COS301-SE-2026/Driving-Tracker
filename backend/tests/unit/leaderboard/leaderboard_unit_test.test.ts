jest.mock('../../../src/services/leaderboard_services');

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import leaderboard_controller from '../../../src/controllers/leaderboard.controller';
const { get_leaderboard } = leaderboard_controller;
import { leaderboard_services } from '../../../src/services/leaderboard_services';

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
                category: 'SAFETY',
                scope: 'ALL_TIME',
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
                query: { category: 'SAFETY', scope: 'ALL_TIME' },
            };
            const res: any = make_res();

            await get_leaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mock_leaderboard);
        });

        it('Returns 400 when category query parameter is missing', async () => {
            const req: any = { user: { sub: 'user-1' }, query: { scope: 'ALL_TIME' } };
            const res: any = make_res();

            await get_leaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(400);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'BAD_REQUEST',
                message: expect.stringContaining('Missing category or scope')
            }));
        });

        it('Returns 400 when scope query parameter is missing', async () => {
            const req: any = { user: { sub: 'user-1' }, query: { category: 'SAFETY' } };
            const res: any = make_res();

            await get_leaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'BAD_REQUEST' }));
        });

        it('Returns 400 when category is not a string', async () => {
            const req: any = {
                user: { sub: 'user-1' },
                query: { category: { nested: 'object' }, scope: 'WEEKLY' },
            };
            const res: any = make_res();

            await get_leaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'BAD_REQUEST' }));
        });

        it('Returns 200 and leaderboard with user not ranked when user not in leaderboard', async () => {
            const mockLeaderboard = {
                data: {
                category: 'SAFETY',
                scope: 'MONTHLY',
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
                query: { category: 'SAFETY', scope: 'MONTHLY' },
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
                    category: 'ECO',
                    scope: 'ALL_TIME',
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
                query: { category: 'ECO', scope: 'ALL_TIME' },
            };
            const res: any = make_res();

                await get_leaderboard(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(leaderboard_services.get_leaderboard).toHaveBeenCalledWith(expect.objectContaining({ category: 'ECO', scope: 'ALL_TIME' }));
        });
    });

    describe('Get categories endpoint', () =>{

        it('Returns 200 and categories list on success', async () => {
            const mock_categories = {
                data: {
                    categories: ['OVERALL','ECO','SAFETY']
                }
            };

            jest.spyOn(leaderboard_services, 'get_categories').mockResolvedValueOnce(mock_categories as any);

            const req: any = {
                user: {sub: 'user-1'}
            };

            const res: any = make_res();

            await leaderboard_controller.get_categories(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mock_categories);

        });

        it('Returns 500 when service throws error', async () =>{

            jest.spyOn(leaderboard_services, 'get_categories').mockRejectedValueOnce(new Error('Database error'));
            
            const req: any = {
                user: {sub: 'user-1'}
            };

            const res: any = make_res();

            await leaderboard_controller.get_categories(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: 'INTERNAL_SERVER_ERROR'}));

        });

        it('Returns 401 when user is not authenticated', async () =>{
            
            const req: any = {
                user: null
            };

            const res: any = make_res();

            await leaderboard_controller.get_categories(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({error: 'UNAUTHORIZED'});

        });

    });

    describe('Get scopes endpoint', () =>{

        it('Returns 200 and scopes list on success', async () => {
            const mock_scopes = {
                data: {
                    scopes: ['ALL_TIME','MONTHLY','WEEKLY']
                }
            };

            jest.spyOn(leaderboard_services, 'get_scopes').mockResolvedValueOnce(mock_scopes as any);

            const req: any = {
                user: {sub: 'user-1'}
            };

            const res: any = make_res();

            await leaderboard_controller.get_scopes(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mock_scopes);

        });

        it('Returns 500 when service throws error', async () =>{

            jest.spyOn(leaderboard_services, 'get_scopes').mockRejectedValueOnce(new Error('Database error'));
            
            const req: any = {
                user: {sub: 'user-1'}
            };

            const res: any = make_res();

            await leaderboard_controller.get_scopes(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: 'INTERNAL_SERVER_ERROR'}));

        });

        it('Returns 401 when user is not authenticated', async () =>{
            
            const req: any = {
                user: null
            };

            const res: any = make_res();

            await leaderboard_controller.get_scopes(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({error: 'UNAUTHORIZED'});

        });

    });
});
