jest.mock('../../../../src/services/badges_leaderboard_services');

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import badge_leaderboard_controller from '../../../../src/controllers/badges_leaderboard.controller';
const { evaluate_badges, get_badges, get_badge_definitions } = badge_leaderboard_controller;
import { badges_leaderboard_services } from '../../../../src/services/badges_leaderboard_services';

describe('Badge Leaderboard Controller', () => {
    beforeEach(() => {jest.clearAllMocks();});

    const make_res = () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        return { status, json };
    };

    describe('Evaluate badges endpoint', () => {
        it('Returns 200 and badge evaluation on success', async () => {
            const mockBadgeResult = {
                earned_badges: ['safe_driver', 'eco_champion'],
                trip_id: 't1',
                evaluation_timestamp: new Date(),
            };
            jest.spyOn(badges_leaderboard_services, 'evaluate').mockResolvedValueOnce(mockBadgeResult as any);

            const req: any = {
                user: { sub: 'user-1' },
                body: { data: { user_id: 'user-1', trip_id: 't1' } },
            };
            const res: any = make_res();

            await evaluate_badges(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({message: 'Badge evaluation complete',}));
        });

        it('Returns 401 when user is unauthenticated', async () => {
            const req: any = { user: undefined, body: { data: { trip_id: 't1' } } };
            const res: any = make_res();

            await evaluate_badges(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED' }));
        });

        it('Returns 404 when trip not found', async () => {
            jest.spyOn(badges_leaderboard_services, 'evaluate').mockRejectedValueOnce(new Error('Trip not found'));

            const req: any = {
                user: { sub: 'user-1' },
                body: { data: { user_id: 'user-1', trip_id: 'nope' } },
            };
            const res: any = make_res();

            await evaluate_badges(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'NOT_FOUND' }));
        });

        it('Returns 401 when user does not own the trip', async () => {
            jest.spyOn(badges_leaderboard_services, 'evaluate').mockRejectedValueOnce(new Error('You do not own this trip'));

            const req: any = {
                user: { sub: 'user-1' },
                body: { data: { user_id: 'user-1', trip_id: 't1' } },
            };
            const res: any = make_res();

            await evaluate_badges(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED' }));
        });

        it('Returns 500 on unexpected error', async () => {
            jest.spyOn(badges_leaderboard_services, 'evaluate').mockRejectedValueOnce(new Error('Database connection error'));

            const req: any = {
                user: { sub: 'user-1' },
                body: { data: { user_id: 'user-1', trip_id: 't1' } },
            };
            const res: any = make_res();

            await evaluate_badges(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INTERNAL_SERVER_ERROR' }));
        });
    });

    describe('Get badges endpoint', () => {
        it('Returns 200 and user badges on success', async () => {
            const mock_badges = {
                user_id: 'user-1',
                badges: [
                { badge_id: 'b1', name: 'Safe Driver', earned_date: new Date() },
                { badge_id: 'b2', name: 'Eco Champion', earned_date: new Date() },
                ],
            };
            jest.spyOn(badges_leaderboard_services, 'get_badges').mockResolvedValueOnce(mock_badges as any);

            const req: any = { user: { sub: 'user-1' } };
            const res: any = make_res();

            await get_badges(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mock_badges);
        });

        it('Returns 401 when user is unauthenticated', async () => {
            const req: any = { user: undefined };
            const res: any = make_res();

            await get_badges(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED' }));
        });
    });

    describe('Get badge definitions endpoint', () => {
        it('Returns 200 and badge definitions on success', async () => {
            const mock_definitions = {
                definitions: [
                { badge_id: 'b1', name: 'Safe Driver', description: 'No accidents in 5 trips', criteria: { max_events: 0 } },
                { badge_id: 'b2', name: 'Eco Champion', description: 'High eco score', criteria: { eco_score: '>=85' } },
                ],
            };
            jest.spyOn(badges_leaderboard_services, 'get_badge_definitions').mockResolvedValueOnce(mock_definitions as any);

            const req: any = { user: { sub: 'user-1' } };
            const res: any = make_res();

            await get_badge_definitions(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mock_definitions);
        });

        it('Returns 401 when user is unauthenticated', async () => {
            const req: any = { user: undefined };
            const res: any = make_res();

            await get_badge_definitions(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED' }));
        });
    });
});
