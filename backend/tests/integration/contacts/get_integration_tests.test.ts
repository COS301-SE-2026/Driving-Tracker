import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData, seedApprovedContact, seedContactUser } from '../helpers';

describe('GET /contacts integration test', () => {
    beforeEach(async () => {
		await cleanTripsData();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

    it('returns only APPROVED contacts for the logged-in user', async () => {
        const unique = Date.now();
		const { user, token } = await seedUserAndLogin(unique);
		const contact_user = await seedContactUser(unique + 1);

        await seedApprovedContact(user.user_id, contact_user.user_id, contact_user.email!);

        const res = await request(app).get('/contacts').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Contacts successfully retrieved');
        expect(res.body.data.contacts).toHaveLength(1);
        expect(res.body.data.contacts[0].username).toBe(contact_user.username);
        expect(res.body.data.contacts[0].contact_id).toBeDefined();
        expect(res.body.data.contacts[0].name).toBeDefined();
        expect(res.body.data.contacts[0].email).toBeDefined();
    });

    it('does not return PENDING contacts', async () => {
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
                consent_status: 'PENDING',
			},
		});

		const res = await request(app).get('/contacts').set('Authorization', `Bearer ${token}`)
			.send({identifier: contact_user.username});

		expect(res.status).toBe(200);
		expect(res.body.data.contacts).toHaveLength(0);
	});

    it('returns 401 when no token is provided', async () => {
		const res = await request(app).get('/contacts');

		expect(res.status).toBe(401);
	});

});