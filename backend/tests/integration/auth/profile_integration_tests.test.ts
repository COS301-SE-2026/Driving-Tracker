import request from 'supertest';
import { describe, expect, it, beforeEach, afterAll } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData } from '../helpers';


describe('GET /api/auth/profile integration test', () => {
    beforeEach(async () => {
		await cleanTripsData();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

    it('returns the logged-in user profile successfully', async () => {
        const unique = Date.now();
        const { user, token } = await seedUserAndLogin(unique);

        const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);
    
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Profile retrieved successfully');
        expect(res.body.data.user_id).toBe(user.user_id);
        expect(res.body.data.username).toBe(user.username);
        expect(res.body.data.trip_count).toBeDefined();
    });

    it('returns 401 when no token is provided', async () => {
        const res = await request(app).get('/api/auth/profile');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('UNAUTHORIZED');
    });
});