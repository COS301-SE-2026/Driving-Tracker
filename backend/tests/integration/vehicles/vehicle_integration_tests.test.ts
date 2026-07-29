import request from 'supertest';
import { describe, expect, it, afterAll, beforeEach } from '@jest/globals';
import app from '../../../src/app';
import prisma from '../../../src/db/prisma';
import { seedUserAndLogin, cleanTripsData } from '../helpers';

describe('DELETE /vehicle/:vehicle_id integration test', () => {
	beforeEach(async () => {
		await cleanTripsData();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

    it('successfully removes a vehicle from the user account', async () => {
        const unique = Date.now();
        const { user, token } = await seedUserAndLogin(unique);

        const vehicleRes = await request(app).post('/vehicle/assign_vehicle').set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Test Car',
                make: 'Toyota',
                model: 'Corolla',
                year: 2020,
                fuel_type: 'PETROL'
            });

        const vehicleId = vehicleRes.body.data.vehicle_id;

        const res = await request(app).delete(`/vehicle/${vehicleId}`).set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Vehicle removed successfully');

        const link = await prisma.users_vehicles.findUnique({
            where: { 
                user_id_vehicle_id: {
                    user_id: user.user_id,
                    vehicle_id: vehicleId
                }
            }
        });

        expect(link).toBeNull();
    });

    it('returns 404 when trying to remove a vehicle not owned by the user', async () => {
        const unique = Date.now();
        const { token: token1 } = await seedUserAndLogin(unique);
        const { user: other_user } = await seedUserAndLogin(unique + 1);

        const vehicle = await prisma.vehicles.create({
            data:{
                name: 'My Car',
                make: 'Ford',
                model: 'Fiesta',
                year: 2019,
                fuel_type: 'PETROL'
            }
        });

        await prisma.users_vehicles.create({
            data:{
                user_id: other_user.user_id, vehicle_id: vehicle.vehicle_id
            }
        });

        const res = await request(app).delete(`/vehicle/${vehicle.vehicle_id}`).set('Authorization', `Bearer ${token1}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe('Vehicle not found or not owned by you');
    });
});