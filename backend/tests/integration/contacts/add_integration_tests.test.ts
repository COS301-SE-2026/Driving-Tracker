import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData, seedContactUser } from '../helpers';

describe('POST /contacts integration test', () => {
	beforeEach(async () => {
		await cleanTripsData();
	});

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

	it('adds a trusted contact by email', async () => {
		const unique = Date.now();
		const { token } = await seedUserAndLogin(unique);
		const contact_user = await seedContactUser(unique + 1);

		const res = await request(app).post('/contacts').set('Authorization', `Bearer ${token}`)
			.send({identifier: contact_user.email});

		expect(res.status).toBe(201);
		expect(res.body.data.username).toBe(contact_user.username);
	});

	it('returns 409 when contact already exists', async () => {
		const unique = Date.now();
		const { user, token } = await seedUserAndLogin(unique);
		const contact_user = await seedContactUser(unique + 1);

		//add once
		await prisma.trusted_contacts.create({
			data: {
				user_id: user.user_id,
				contact_user_id: contact_user.user_id,
				name: 'Contact Person',
				email: contact_user.email,
			},
		});

		//try add again
		const res = await request(app).post('/contacts').set('Authorization', `Bearer ${token}`)
			.send({identifier: contact_user.username});

		expect(res.status).toBe(409);
		expect(res.body.error).toBe('ALREADY_TRUSTED_CONTACT');
	});

	it('returns 404 when identifier does not match any user', async () => {
		const unique = Date.now();
		const { token } = await seedUserAndLogin(unique);

		const res = await request(app).post('/contacts').set('Authorization', `Bearer ${token}`)
			.send({identifier: 'user_that_does_not_exist'});

		expect(res.status).toBe(404);
		expect(res.body.error).toBe("USER_NOT_FOUND");
	});

	it('returns 400 when trying to add self', async () => {
		const unique = Date.now();
		const { user, token } = await seedUserAndLogin(unique);

		const res = await request(app).post('/contacts').set('Authorization', `Bearer ${token}`)
			.send({identifier: user.username});

		expect(res.status).toBe(400);
		expect(res.body.error).toBe("CANNOT_ADD_USER");
	});

	it('returns 401 when no token is provided - unauthorized', async () => {
		const res = await request(app).post('/contacts').send({identifier: 'someone'});

		expect(res.status).toBe(401);
		expect(res.body.error).toBe("UNAUTHORIZED");
	});

});