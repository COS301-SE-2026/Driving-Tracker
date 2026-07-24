import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData, seedApprovedContact, seedContactUser } from '../helpers';

describe('POST /contacts integration test', () => {
	beforeEach(async () => {
		await cleanTripsData();
	})

	afterAll(async () => {
		await prisma.$disconnect();
	});

	it('adds a trusted contact by username and writes to trusted_contacts table', async () => {
		const unique = Date.now();
		const { user, token } = await seedUserAndLogin(unique);
		const contact_user = await seedContactUser(unique + 1);

		const res = await request(app).post('/contacts').set('Authorization', `Bearer ${token}`)
			.send({identifier: contact_user.username});
			
		expect(res.status).toBe(201);
		expect(res.body.data.contact_id).toBeDefined();
		expect(res.body.data.username).toBe(contact_user.username);

		//verify DB
		const record = await prisma.trusted_contacts.findFirst({
			where: {
				user_id: user.user_id,
				contact_user_id: contact_user.user_id,
			},
		});

		expect(record).not.toBeNull();
		expect(record?.consent_status).toBe('PENDING');
	});
});