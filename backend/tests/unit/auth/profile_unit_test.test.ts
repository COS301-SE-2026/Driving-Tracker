import { describe, expect, it, jest,beforeEach } from '@jest/globals';
import auth_controller from '../../../src/controllers/auth.controller';
const { get_profile } = auth_controller;
import { auth_services } from '../../../src/services/auth_services';

describe('Auth get_profile endpoint', () => {
    beforeEach(async () => jest.clearAllMocks());

    it('returns 200 and profile data on success', async () => {
        const mockProfile = {
            user_id: 'user-1',
            username: 'tester',
            name: 'Test',
            surname: 'User',
            email: 'test@example.com',
            phone_number: '+27123456789',
            dob: new Date('2000-01-01'),
            trip_count: 5,
            badge_count: 2,
            vehicle_count: 1
        };

        jest.spyOn(auth_services, 'get_profile').mockResolvedValueOnce(mockProfile);
        
        const req: any = {
            user: { sub: 'user-1'}
        };

        const json = jest.fn();
        const status = jest.fn().mockReturnValueOnce({ json });
        const res: any = { status };

        await get_profile(req, res);

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            data: mockProfile,
            message: 'Profile retrieved successfully'
        });
    }); 

    it('returns 401 when user_id is missing', async () => {
        const req: any = {
            user: {}
        };

        const json = jest.fn();
        const status = jest.fn().mockReturnValueOnce({ json });
        const res: any = { status };

        await get_profile(req, res);

        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith({
            error: 'UNAUTHORIZED'
        });
    }); 

    it('returns 500 on unexpected error', async () => {
        jest.spyOn(auth_services, 'get_profile').mockRejectedValueOnce(new Error('Database error'));
        
        const req: any = {
            user: {sub: 'user-1'}
        };

        const json = jest.fn();
        const status = jest.fn().mockReturnValueOnce({ json });
        const res: any = { status };

        await get_profile(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve profile'
        });
    }); 
});
