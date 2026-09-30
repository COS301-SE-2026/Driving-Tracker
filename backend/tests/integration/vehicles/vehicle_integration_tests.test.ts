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
        const { user, vehicle,token } = await seedUserAndLogin(unique);

        const res = await request(app).delete(`/vehicle/${vehicle}`).set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Vehicle removed successfully');

        const link = await prisma.users_vehicles.findUnique({
            where: { 
                user_id_vehicle_id: {
                    user_id: user.user_id,
                    vehicle_id: vehicle
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
                fuel_type: 'PETROL',
                fuel_tank:60,
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
describe("PATCH /vehicle/:vehicle_id integration test", ()=>{
    beforeEach(async () => {
		await cleanTripsData();
	});

	afterAll(async () => {
		await prisma.$disconnect();
	});

    it('Returns throws 401 when the user is unauthorized', async ()=>{
        const res = await request(app)
            .patch('/vehicle/some-uuid')
            .send({ name: 'Hack attempt' });

        expect(res.status).toBe(401);
    });
    it("Returns 200 when update is successful", async()=>{
        const unique = Date.now();
        const { user, vehicle:vehicle_id,token } = await seedUserAndLogin(unique);

        const update_data ={
            name: 'Updated Luxury SUV',
            registration: 'NEW-REG-123',
            make: 'BMW',
            model: 'X5',
            year: 2024,
            fuel_type: 'DIESEL',
        };
        const res = await request(app)
            .patch(`/vehicle/${vehicle_id}`) 
            .set('Authorization', `Bearer ${token}`)
            .send(update_data);

        expect(res.status).toBe(200);

        // Verify the database was updated
        const updated_vehicle = await prisma.vehicles.findUnique({
            where: { vehicle_id: vehicle_id }
        });

        expect(updated_vehicle?.name).toBe(update_data.name);
        expect(updated_vehicle?.registration).toBe(update_data.registration);
        expect(updated_vehicle?.model).toBe(update_data.model);
        expect(updated_vehicle?.year).toBe(update_data.year);
        
    })
})