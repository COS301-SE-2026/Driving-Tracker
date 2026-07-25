import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData, } from '../helpers';

describe('PATCH /contacts/:contact_id/respond integration test', () => {
    beforeEach(async () => {
		await cleanTripsData();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

    it('approves a pending contact request and updates consent_status in database', async () => {
        const unique = Date.now();
		const { user: owner } = await seedUserAndLogin(unique);
		const { user: contact_user, token: contact_token } = await seedUserAndLogin(unique + 1);
    
        const contact = await prisma.trusted_contacts.create({
			data: {
				user_id: owner.user_id,
				contact_user_id: contact_user.user_id,
				name: 'Owner',
				email: owner.email,
                consent_status: 'PENDING',
			},
		});

        const res = await request(app).patch(`/contacts/${contact.contact_id}/respond`).set('Authorization', `Bearer ${contact_token}`)
			.send({status: 'APPROVED'});
        
        expect(res.status).toBe(200);
        expect(res.body.data.contact_id).toBe(contact.contact_id);

        const updated = await prisma.trusted_contacts.findUnique({
            where: { contact_id: contact.contact_id },
        });

        expect(updated?.consent_status).toBe('APPROVED');
    });

    it('denies a pending contact request and updates consent_status in database', async () => {
        const unique = Date.now();
		const { user: owner } = await seedUserAndLogin(unique);
		const { user: contact_user, token: contact_token } = await seedUserAndLogin(unique + 1);
    
        const contact = await prisma.trusted_contacts.create({
			data: {
				user_id: owner.user_id,
				contact_user_id: contact_user.user_id,
				name: 'Owner',
				email: owner.email,
                consent_status: 'PENDING',
			},
		});

        const res = await request(app).patch(`/contacts/${contact.contact_id}/respond`).set('Authorization', `Bearer ${contact_token}`)
			.send({status: 'DENIED'});
        
        expect(res.status).toBe(200);

        const updated = await prisma.trusted_contacts.findUnique({
            where: { contact_id: contact.contact_id },
        });

        expect(updated?.consent_status).toBe('DENIED');
    });

    it('returns 422 for an invalid status value', async () => {
        const unique = Date.now();
		const { user: owner } = await seedUserAndLogin(unique);
		const { user: contact_user, token: contact_token } = await seedUserAndLogin(unique + 1);
    
        const contact = await prisma.trusted_contacts.create({
			data: {
				user_id: owner.user_id,
				contact_user_id: contact_user.user_id,
				name: 'Owner',
				email: owner.email,
			},
		});

        const res = await request(app).patch(`/contacts/${contact.contact_id}/respond`).set('Authorization', `Bearer ${contact_token}`)
			.send({status: 'MAYBE'});
        
        expect(res.status).toBe(422);
        expect(res.body.error).toBe('INVALID_STATUS');
    });

    it('returns 401 when no token is provided', async () => {
        const res = await request(app).patch('/contacts/some-id/respond').send({status: 'APPROVED'});
        
        expect(res.status).toBe(401);
    });
});