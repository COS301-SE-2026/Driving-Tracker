import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { get_all_vehicles, update_vehicle, assign_vehicle, remove_vehicle } from '../../../src/controllers/vehicle.controller';
import { vehicle_services } from '../../../src/services/vehicle.services';
import { before } from 'node:test';

describe('Vehicle controller get_all_vehicles', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	it('returns 200 and the user vehicles', async() => {
		const vehicles = [
			{
				vehicle_id: 'vehicle-1',
				name: 'My BMW',
				registration: 'ABC123',
				make: 'BMW',
				model: 'M3',
				year: 2021,
				fuel_type: 'PETROL',
				image_url: null,
				mileage: 1000,
				trip_count: 1,
				avg_fuel_efficiency: 10
			}
		];

		jest.spyOn(vehicle_services, 'get_all_vehicles').mockResolvedValueOnce(vehicles);

		const req: any = {
			user: { sub: 'user-1' }
		};

		const json = jest.fn();
		const status = jest.fn().mockReturnValue({ json });
		const res: any = { status };

		await get_all_vehicles(req, res);

		expect(vehicle_services.get_all_vehicles).toHaveBeenCalledWith({ user_id: 'user-1' });

		expect(status).toHaveBeenCalledWith(200);
		expect(json).toHaveBeenCalledWith(vehicles);
	});

	it('returns 403 when the authenticated user id is missing', async () => {
		const req: any = {
			user: {}
		};

		const json = jest.fn();
		const status = jest.fn().mockReturnValue({ json });
		const res: any = { status };

		await get_all_vehicles(req, res);

		expect(json).toHaveBeenCalledWith({
			error: 'UNAUTHORIZED',
			message: 'Unauthorized'
		});
	});

	it('returns 403 when the service reports missing fields', async () => {
		await expectForbiddenVehicleResponse(
			new Error('Missing required fields'),
			{ sub: 'user-1' },
			{error: 'INVALID_FIELDS', message: 'user or vehicle not known'}
		);
	});

	it('returns 403 when the service reports an unknown user', async () => {
		await expectForbiddenVehicleResponse(
			new Error('User not found'),
			{ sub: 'unknown user' },
			{error: 'UNAUTHORIZED', message: 'Unauthorized'}
		);
	});

	const expectForbiddenVehicleResponse = async(
		error: Error,
		user: Record<string, string>,
		expectedBody: Record<string, string>
	) => {
		jest.spyOn(vehicle_services, 'get_all_vehicles').mockRejectedValueOnce(error);

		const req: any = {
			user: { sub: user.sub }
		};

		const json = jest.fn();
		const status = jest.fn().mockReturnValue({ json });
		const res: any = { status };

		await get_all_vehicles(req, res);

		expect(status).toHaveBeenCalledWith(403);
		expect(json).toHaveBeenCalledWith(expectedBody);
	}
});
describe('Vehicle controller update vehicle', ()=>{
	beforeEach(()=>{jest.clearAllMocks});
	it('Returns 200 when the update was successful', async()=>{
		const updated_vehicle = {
            vehicle_id: 'v1',
            name: 'New Name',
            registration: 'NEW-REG',
            make: 'BMW',
            model: 'M3',
            year: 2018,
            fuel_type: 'PETROL',
            fuel_tank: 50.0
        };

		const update_data = {
			vehicle_id: "v1",
            name: "Old Car",
            registration: "OLD123",
            make: "BMW",
            model: "M3",
            year: 2018,
            fuel_tank: 60,
            fuel_type: "PETROL",
		}
		// jest.spyOn(vehicle_services,'update_vehicle')
		const serviceSpy = jest.spyOn(vehicle_services, 'update_vehicle').mockResolvedValueOnce(updated_vehicle as any);

        const req: any = {
            user: { sub: 'user-1' },
            params: { vehicle_id: 'v1' },
            body: update_data
        };

        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = { status };

        await update_vehicle(req, res);

        expect(serviceSpy).toHaveBeenCalledWith({
            user_id: 'user-1',
            ...update_data
        });

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(updated_vehicle);
	});
	 it('returns 401 when the user is not authenticated', async () => {
        const req: any = {
            user: {}, 
            params: { vehicle_id: 'v1' },
            body: { name: 'New Name' }
        };

        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const res: any = { status };

        await update_vehicle(req, res);

        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith({
            error: "UNAUTHORIZED",
            message: "Unauthorized"
        });
    });
});

describe('Vehicle controller assign_vehicle', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const makeResponse = () => {
		const json = jest.fn();
		const status = jest.fn().mockReturnValue({ json });
		return { status, json };
	};

	const vehicleBody = {
		name: 'New Name',
		registration: 'NEW-REG',
		make: 'BMW',
		model: 'M3',
		year: 2018,
		fuel_type: 'PETROL',
		fuel_tank: 50.0
    };

	it('returns 201 when the vehicle is assigned successfully', async () => {
		const result = { data : { vehicle_id: 'vehicle-1' } };

		const serviceSpy = jest.spyOn(vehicle_services, 'assign_user_to_vehicle').mockResolvedValueOnce(result as any);

        const req: any = {
            user: { sub: 'user-1' },
            body: vehicleBody
        };

		const res: any = makeResponse();

        await assign_vehicle(req, res);

		expect(serviceSpy).toHaveBeenCalledWith({
			user_id: 'user-1',
			...vehicleBody,
		});
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith(result);
	});

	it('returns 403 when the user is not authenticated', async () => {
		const req: any = {
			user: {},
			body: vehicleBody,
		};

		const res: any = makeResponse();

		await assign_vehicle(req, res);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({
			error: 'UNAUTHORIZED',
			message: 'Unauthorized'
		});
	});

	it('returns 400 when required fields are missing', async () => {
		const req: any = {
			user: {sub: 'user-1' },
			body: {
				...vehicleBody,
				make: ''
			},
		};

		const res: any = makeResponse();

		await assign_vehicle(req, res);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({
			error: 'MISSING_REQUIRED_FIELDS',
			message: 'Missing required fields: make, model, year, fuel_type, fuel_tank'
		});
	});

	it('returns 404 when the user does not exist', async () => {

		jest.spyOn(vehicle_services, 'assign_user_to_vehicle').mockRejectedValueOnce(new Error('User does not exist'));

		const req: any = {
			user: {sub: 'unknown-user' },
			body: vehicleBody,
		};

		const res: any = makeResponse();

		await assign_vehicle(req, res);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			error: 'USER_NOT_FOUND',
			message: 'User not found',
		});
	});
});

describe('Vehicle controller remove_vehicle', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	const makeResponse = () => {
		const json = jest.fn();
		const status = jest.fn().mockReturnValue({ json });
		return { status, json };
	};

	it('returns 200 when the vehicle is successfully removed', async () => {
		const result = { message: 'Vehicle removed successfully' };

		const serviceSpy = jest.spyOn(vehicle_services, 'remove_vehicle').mockResolvedValueOnce(result as any);

		const req: any = {
			user: { sub: 'user-1' },
			params: { vehicle_id: 'vehicle-1' },
		};

		const res: any = makeResponse();

		await remove_vehicle(req, res);

		expect(serviceSpy).toHaveBeenCalledWith('user-1', 'vehicle-1');
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith(result);
	});

	it('returns 401 when the user is not authenticated', async () => {

		const req: any = {
			user: { },
			params: { vehicle_id: 'vehicle-1' },
		};

		const res: any = makeResponse();

		await remove_vehicle(req, res);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			error: 'UNAUTHORIZED',
			message: 'Unauthorized'
		});
	});

	it('returns 404 when the vehicle is not found or owned', async () => {

		jest.spyOn(vehicle_services, 'remove_vehicle').mockRejectedValueOnce(new Error('Vehicle not found or not owned by you'));

		const req: any = {
			user: { sub: 'user-1' },
			params: { vehicle_id: 'vehicle-1' },
		};

		const res: any = makeResponse();

		await remove_vehicle(req, res);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({
			error: 'INVALID_VEHICLE',
			message: 'Vehicle not found or not owned by you'
		});
	});

	it('returns 500 when the service fails unexpectedly', async () => {

		jest.spyOn(vehicle_services, 'remove_vehicle').mockRejectedValueOnce(new Error('Database unavailable'));

		const req: any = {
			user: { sub: 'user-1' },
			params: { vehicle_id: 'vehicle-1' },
		};

		const res: any = makeResponse();

		await remove_vehicle(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			error: 'INTERNAL_SERVER_ERROR',
			message: 'Internal server error'
		});
	});
});
