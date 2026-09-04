jest.mock('../../../src/db/prisma', () => ({
    __esModule: true,
    default: {
        trips: {
        findUnique: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        },
        badges: {
        findMany: jest.fn(),
        },
        user_badges: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        },
        leaderboard: {
        upsert: jest.fn(),
        },
    },
}));

jest.mock('../../../src/utils/notification', () => ({
    add_notification: jest.fn(),
}));

jest.mock('../../../src/services/user_devices_services', () => ({
    user_devices_services: {
        get_user_fcm_tokens: jest.fn(),
    },
}));

jest.mock('../../../src/services/notification_service', () => ({
    notification_services: {
        send_badge_notification: jest.fn(),
    },
}));

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import prisma from '../../../src/db/prisma';
import { badges_leaderboard_services } from '../../../src/services/badges_leaderboard_services';
import { add_notification } from '../../../src/utils/notification';
import { user_devices_services } from '../../../src/services/user_devices_services';
import { notification_services } from '../../../src/services/notification_service';

const mock_prisma = prisma as any;
class MockDecimal{
    constructor(private value: number){}
    toNumber(){
        return this.value
    }
}

describe('evaluate badges ',()=>{
    beforeEach(() => { 
        jest.clearAllMocks();
    });
    it('evaluates trip and awards badges', async () => {

        jest.mocked(user_devices_services.get_user_fcm_tokens)
            .mockResolvedValue(['test-fcm-token']);

        jest.mocked(notification_services.send_badge_notification)
            .mockResolvedValue(undefined);

        jest.mocked(add_notification).mockResolvedValue(undefined);

        mock_prisma.trips.findUnique.mockResolvedValue({
            trip_id: 't1',
            user_id: 'u1',
            distance_km: 100,
            duration_minutes: 90,
            fuel_estimate: 5.5,
            trip_scores: [
                { safety_score: new MockDecimal(95), eco_score: new MockDecimal(88), overall_score: new MockDecimal(91) },
            ],
            trip_events: [
                { type: 'HARSH_BRAKE' },
                { type: 'SHARP_CORNER' },
            ],
            trip_location_shares: [{ share_id: 'sh1' }],
        });

        mock_prisma.trips.count.mockResolvedValue(5);

        mock_prisma.trips.findMany.mockResolvedValue([]);

        mock_prisma.badges.findMany.mockResolvedValue([
            {
                badge_id: 'b1',
                badge_criteria: [
                { 
                    metric: 'distance_km', 
                    operator: '>=', 
                    threshold: 50 },
                ],
            },
        ]);

        mock_prisma.user_badges.findUnique.mockResolvedValue(null);
        
        mock_prisma.user_badges.create.mockResolvedValue({
            badge_id: 'b1',
            earned_at: new Date(),
            badges: {
                name: 'Long Distance',
                description: 'Drive 50km+',
                category: 'DISTANCE',
                icon_url: 'icon.png',
            },
        });

        const result = await badges_leaderboard_services.evaluate({
            user_id: 'u1',
            trip_id: 't1',
        });

        expect(result.data.evaluated).toBe(true);

        expect(add_notification).toHaveBeenCalledWith({
            user_ids: ['u1'],
            type: 'BADGE_UNLOCKED',
            title: 'New Badge Unlocked',
            body: "You've earned the Long Distance badge!",
            reference_ids: ['b1'],
            reference_type: 'badges',
        });

    expect(user_devices_services.get_user_fcm_tokens)
        .toHaveBeenCalledWith('u1');

    expect(notification_services.send_badge_notification)
        .toHaveBeenCalledWith(
            ['test-fcm-token'],
            'New Badge Unlocked',
            "You've earned the Long Distance badge!",
            'b1',
            ''
        );

        expect(Array.isArray(result.data.new_badges)).toBe(true);
    });

    it('throws when trip not found', async () => {
        mock_prisma.trips.findUnique.mockResolvedValue(null);

        await expect(
            badges_leaderboard_services.evaluate({
            user_id: 'u1',
            trip_id: 't1',
            })
        ).rejects.toThrow('Trip not found');
    });
});
describe('get badges', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('returns earned badges for user', async () => {
        mock_prisma.user_badges.findMany.mockResolvedValue([
            {
                badge_id: 'b1',
                earned_at: new Date(),
                badges: {
                badge_id: 'b1',
                name: 'Safe Driver',
                category: 'SAFETY',
                description: 'Achieved 95+ safety score',
                },
            },
            {
                badge_id: 'b2',
                earned_at: new Date(),
                badges: {
                badge_id: 'b2',
                name: 'Eco Champion',
                category: 'ECO',
                description: 'Achieved 90+ eco score',
                },
            },
        ]);

        const result = await badges_leaderboard_services.get_badges({
            user_id: 'u1',
        });

        expect(result.data.earned.length).toBe(2);
        expect(result.data.summary.Total_earned).toBe(2);
        expect(result.data.summary.categories.length).toBe(2);
    });

    it('returns empty badges when user has none', async () => {
        mock_prisma.user_badges.findMany.mockResolvedValue([]);

        const result = await badges_leaderboard_services.get_badges({
            user_id: 'u1',
        });

        expect(result.data.earned.length).toBe(0);
        expect(result.data.summary.Total_earned).toBe(0);
    });
});
describe('get_badge definitions', () => {
    beforeEach(async() => jest.clearAllMocks());

    it('returns all badge definitions', async () => {
        mock_prisma.badges.findMany.mockResolvedValue([
            {
                badge_id: 'b1',
                name: 'Safe Driver',
                category: 'SAFETY',
                description: 'Safety champion',
                icon_url: 'icon1.png',
                badge_criteria: [
                { metric: 'safety_score', operator: '>=', threshold: new MockDecimal(95) },
                ],
            },
        ]);

        const result = await badges_leaderboard_services.get_badge_definitions();

        expect(result.data.badges.length).toBe(1);
        expect(result.data.badges[0].name).toBe('Safe Driver');
    });

    it('returns empty array when no badges', async () => {
        mock_prisma.badges.findMany.mockResolvedValue([]);

        const result = await badges_leaderboard_services.get_badge_definitions();

        expect(result.data.badges.length).toBe(0);
    });
});