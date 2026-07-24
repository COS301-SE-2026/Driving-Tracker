import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData, seedApprovedContact, seedContactUser, seedTrip, seedTripEVent } from '../helpers';

describe('POST /contacts/alerts integration test', () => {
    beforeEach(async () => {
		await cleanTripsData();
	})

	afterAll(async () => {
		await prisma.$disconnect();
	});

    it('creates an alert and alert_notifications when valid data is provided', async () => {
        const unique = Date.now();
		const { user, vehicle, token } = await seedUserAndLogin(unique);
		const contact_user = await seedContactUser(unique + 1);

        const contact = await seedApprovedContact(user.user_id, contact_user.user_id, contact_user.email!);
        const trip = await seedTrip(user.user_id, vehicle);
        const event = await seedTripEVent(trip.trip_id);

        const res = await request(app).post('/contacts/alerts').set('Authorization', `Bearer ${token}`)
        .send({
            event_type: 'HARSH_BRAKE',
            event_id: event.event_id,
            message: 'Harsh braking event has occurred',
            contacts: [{contact_id: contact.contact_id}],
        });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Contacts successfully alerted');

        const alert = await prisma.alerts.findFirst({
            where: { trip_id: trip.trip_id, user_id: user.user_id },
        });

        expect(alert).not.toBeNull();
        expect(alert?.alert_type).toBe("HARSH_BRAKE");

        const notification = await prisma.alert_notifications.findFirst({
            where: { alert_id: alert!.alert_id, contact_id: contact.contact_id },
        });
        expect(notification).not.toBeNull();
    });

    it('returns 404 when event_id does not exist', async () => {
        const unique = Date.now();
		const { user, token } = await seedUserAndLogin(unique);
		const contact_user = await seedContactUser(unique + 1);
        const contact = await seedApprovedContact(user.user_id, contact_user.user_id, contact_user.email!);

        const res = await request(app).post('/contacts/alerts').set('Authorization', `Bearer ${token}`)
        .send({
            event_type: 'HARSH_BRAKE',
            event_id: '00000000-0000-0000-0000-000000000000',
            message: 'test message',
            contacts: [{contact_id: contact.contact_id}],
        });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('EVENT_NOT_FOUND');

        const alerts = await prisma.alerts.findMany({
            where: { user_id: user.user_id }
        });
        expect(alerts).toHaveLength(0);
    });

    it('returns 404 when contact_id does not exist', async () => {
        const unique = Date.now();
		const { user, vehicle, token } = await seedUserAndLogin(unique);
		const trip = await seedTrip(user.user_id, vehicle);
        const event = await seedTripEVent(trip.trip_id);

        const res = await request(app).post('/contacts/alerts').set('Authorization', `Bearer ${token}`)
        .send({
            event_type: 'HARSH_BRAKE',
            event_id: event.event_id,
            message: 'test message',
            contacts: [{contact_id: '00000000-0000-0000-0000-000000000000'}],
        });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('CONTACT_NOT_FOUND');
    });

    it('returns 403 when event belongs to a different user', async () => {
        const unique = Date.now();
		const { token } = await seedUserAndLogin(unique);
        const { user: other_user, vehicle: other_vehicle } = await seedUserAndLogin(unique + 1);
		const contact_user = await seedContactUser(unique + 2);

        const contact = await seedApprovedContact(other_user.user_id, contact_user.user_id, contact_user.email!);
        const trip = await seedTrip(other_user.user_id, other_vehicle);
        const event = await seedTripEVent(trip.trip_id);

        const res = await request(app).post('/contacts/alerts').set('Authorization', `Bearer ${token}`)
        .send({
            event_type: 'HARSH_BRAKE',
            event_id: event.event_id,
            message: 'Harsh braking event has occurred',
            contacts: [{contact_id: contact.contact_id}],
        });

        expect(res.status).toBe(403);
        expect(res.body.message).toBe('Cannot access these contacts');
    });

    it('returns 400 when event_type or event_id is missing', async () => {
        const unique = Date.now();
		const { token } = await seedUserAndLogin(unique);

        const res = await request(app).post('/contacts/alerts').set('Authorization', `Bearer ${token}`)
        .send({
            message: 'test message',
            contacts: [],
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('BAD_REQUEST');
    });

    it('returns 401 when no token is provided', async () => {
        const res = await request(app).post('/contacts/alerts').send({});

        expect(res.status).toBe(401);
    });
});