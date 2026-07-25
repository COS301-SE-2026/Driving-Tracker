import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData, seedApprovedContact, seedContactUser, seedTrip } from '../helpers';

describe('GET /notifications integration test', () => {
    beforeEach(async () => {
		await cleanTripsData();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('fetches a list of notifications for the logged-in user', async () => {
		const unique = Date.now();
		const { user, token } = await seedUserAndLogin(unique);

		await prisma.notifications.create({
			data: {
				user_id: user.user_id,
				type: 'TRUSTED_CONTACT_REQUEST',
				title: 'New Request',
				body: 'Someone wants to add you',
				is_read: false
			}
		});

		const res = await request(app).get('/notifications').set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.data.notifications).toHaveLength(1);
		expect(res.body.data.notifications[0].title).toBe('New Request');
	});

	it('returns 401 when no token is provided', async () =>{
		const res = await request(app).get('/notifications');
		expect(res.status).toBe(401);
	});
});