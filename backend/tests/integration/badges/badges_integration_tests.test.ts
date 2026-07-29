import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData, seedTrip, seedBadge, seedBadgeCriteria } from '../helpers';

describe('Badges integration tests', () => {
    beforeEach(async () => {
		await cleanTripsData();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

    describe('POST /badges/evaluate', () => {
        it('evaluates and awards a badge when criteria are met', async () => {
            const unique = Date.now();
            const { user, vehicle, token } = await seedUserAndLogin(unique);

            const badge = await seedBadge('Safe Driver', 'SAFETY');
            await seedBadgeCriteria(badge.badge_id, 'safety_score', '>', 80);

            const trip = await prisma.trips.create({
                data: {
                    user_id: user.user_id,
                    vehicle_id: vehicle,
                    status: 'COMPLETED',
                    distance_km: 10,
                    duration_minutes: 15,
                    trip_scores: {
                        create: {
                            safety_score: 90,
                            eco_score: 85,
                            overall_score: 88
                        }
                    }
                }
            });

            const res = await request(app).post('/badges/evaluate').set('Authorization', `Bearer ${token}`)
                .send({
                    data: {
                        user_id: user.user_id,
                        trip_id: trip.trip_id
                    }
                });
            
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Badge evaluation complete');
            expect(res.body.data.data.evaluated).toBe(true);
            expect(res.body.data.data.new_badges).toHaveLength(1);
            expect(res.body.data.data.new_badges[0].name).toBe('Safe Driver');

            const userBadge = await prisma.user_badges.findUnique({
                where: {
                    user_id_badge_id: {
                        user_id: user.user_id,
                        badge_id: badge.badge_id
                    }
                }
            });

            expect(userBadge).not.toBeNull();
        });

        it('returns 404 when trip is not found', async () => {
            const unique = Date.now();
            const { user, token } = await seedUserAndLogin(unique);

            const res = await request(app).post('/badges/evaluate').set('Authorization', `Bearer ${token}`)
                .send({
                    data: {
                        user_id: user.user_id,
                        trip_id: '00000000-0000-0000-0000-000000000000'
                    }
                });
            
            expect(res.status).toBe(404);
            expect(res.body.error).toBe('NOT_FOUND');
        });

        it('returns 401 when user does not own the trip', async () => {
            const unique = Date.now();
            const { user: user, vehicle, token: token } = await seedUserAndLogin(unique);
            const { user: other_user } = await seedUserAndLogin(unique + 1);

            const trip = await seedTrip(other_user.user_id, vehicle);

            const res = await request(app).post('/badges/evaluate').set('Authorization', `Bearer ${token}`)
                .send({
                    data: {
                        user_id: user.user_id,
                        trip_id: trip.trip_id
                    }
                });
            
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('UNAUTHORIZED');
        });
    });

    describe('GET /badges', () => {
        it('returns list of earned badges and summary for the user', async () => {
            const unique = Date.now();
            const { user, token } = await seedUserAndLogin(unique);

            const badge = await seedBadge('Eco Warrior', 'ECO');
            await prisma.user_badges.create({
                data: {
                    user_id: user.user_id,
                    badge_id: badge.badge_id
                }
            });

            const res = await request(app).get('/badges').set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.earned).toHaveLength(1);
            expect(res.body.data.earned[0].name).toBe('Eco Warrior');
            expect(res.body.data.summary.Total_earned).toBe(1);
            expect(res.body.data.summary.categories).toContainEqual(expect.objectContaining({
                category: 'ECO',
                current: 1
            }));
        });
    });

    describe('GET /badges/definitions', () => {
        it('returns all available badge definitions', async () => {
            const unique = Date.now();
            const { token } = await seedUserAndLogin(unique);

            await seedBadge('Master Driver', 'SAFETY');
            await seedBadge('Night Own', 'ADVENTURE');

            const res = await request(app).get('/badges/definitions').set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.badges.length).toBeGreaterThanOrEqual(2);
            expect(res.body.data.badges).toContainEqual(expect.objectContaining({
                name: 'Master Driver'
            }));
        });
    });
});