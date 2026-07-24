import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData, seedApprovedContact, seedContactUser, seedTrip, seedTripEVent } from '../helpers';

describe('POST /contacts/share_location integration test', () => {
    beforeEach(async () => {
		await cleanTripsData();
	})

	afterAll(async () => {
		await prisma.$disconnect();
	});

    it('shares location and writes trip_location_shares row to database', async () => {
        const unique = Date.now();
		const { user, vehicle, token } = await seedUserAndLogin(unique);
        const contact_user = await seedContactUser(unique + 1);
        const contact = await seedApprovedContact(user.user_id, contact_user.user_id, contact_user.email!);
		const trip = await seedTrip(user.user_id, vehicle);

        const res = await request(app).post('/contacts/share_location').set('Authorization', `Bearer ${token}`)
        .send({
            trip_id: trip.trip_id,
            contacts: [{ contact_id: contact.contact_id }],
        });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Location successfully shared');
        expect(res.body.data.trip_id).toBe(trip.trip_id);
        expect(res.body.data.shared_with).toHaveLength(1);
        expect(res.body.data.shared_with[0].contact_id).toBe(contact.contact_id);
        expect(res.body.data.shared_at).toBeDefined();

        const share = await prisma.trip_location_shares.findFirst({
            where: {
                trip_id: trip.trip_id,
                contact_id: contact.contact_id,
            },
        });
        expect(share).not.toBeNull();
        expect(share?.revoked_at).toBeNull();
    });

    it('returns 400 when no contacts are provided', async () => {
        const unique = Date.now();
		const { vehicle, token } = await seedUserAndLogin(unique);
        const { user: seed_user } = await seedUserAndLogin(unique + 1);

        const trip = await seedTrip(seed_user.user_id, vehicle);

        const res = await request(app).post('/contacts/share_location').set('Authorization', `Bearer ${token}`)
        .send({
            trip_id: trip.trip_id,
            contacts: [],
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('NO_CONTACTS_PROVIDED');
    });

    it('returns 404 when trip does not exist', async () => {
        const unique = Date.now();
		const { user, token } = await seedUserAndLogin(unique);
        const contact_user = await seedContactUser(unique + 1);
        const contact = await seedApprovedContact(user.user_id, contact_user.user_id, contact_user.email!);
        
        const res = await request(app).post('/contacts/share_location').set('Authorization', `Bearer ${token}`)
        .send({
            trip_id: '00000000-0000-0000-0000-000000000000',
            contacts: [{ contact_id: contact.contact_id }],
        });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('TRIP_NOT_FOUND');
    });

    it('returns 403 when contact is not a trusted contact', async () => {
        const unique = Date.now();
		const { user, vehicle, token } = await seedUserAndLogin(unique);
        const { user: other_user } = await seedUserAndLogin(unique + 1);
        const contact_user = await seedContactUser(unique + 2);
        const contact = await seedApprovedContact(other_user.user_id, contact_user.user_id, contact_user.email!);
		const trip = await seedTrip(user.user_id, vehicle);

        const res = await request(app).post('/contacts/share_location').set('Authorization', `Bearer ${token}`)
        .send({
            trip_id: trip.trip_id,
            contacts: [{ contact_id: contact.contact_id }],
        });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('NOT_TRUSTED_CONTACT');

        const share = await prisma.trip_location_shares.findMany({
            where: {
                trip_id: trip.trip_id,
            },
        });
        expect(share).toHaveLength(0);
    });

    it('returns 401 when no token is provided', async () => {
        const res = await request(app).post('/contacts/share_location').send({});

        expect(res.status).toBe(401);
    });
});