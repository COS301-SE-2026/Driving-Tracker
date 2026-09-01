import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { get_all_vehicles } from '../../../src/controllers/vehicle.controller';
import { vehicle_services } from '../../../src/services/vehicle.services';

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
			message: 'Unauthorized'
		});
	});

	it('returns 403 when the service reports missing fields', async () => {
		jest.spyOn(vehicle_services, 'get_all_vehicles').mockRejectedValueOnce(new Error('Missing required fields'));

		const req: any = {
			user: { sub: 'user-1' }
		};

		const json = jest.fn();
		const status = jest.fn().mockReturnValue({ json });
		const res: any = { status };

		await get_all_vehicles(req, res);

		expect(status).toHaveBeenCalledWith(403);
		expect(json).toHaveBeenCalledWith({
			message: 'user or vehicle not known'
		});
	});

	it('returns 403 when the service reports an unknown user', async () => {
		jest.spyOn(vehicle_services, 'get_all_vehicles').mockRejectedValueOnce(new Error('User not found'));

		const req: any = {
			user: { sub: 'unknown-user' }
		};

		const json = jest.fn();
		const status = jest.fn().mockReturnValue({ json });
		const res: any = { status };

		await get_all_vehicles(req, res);

		expect(status).toHaveBeenCalledWith(403);
		expect(json).toHaveBeenCalledWith({
			message: 'Unauthorized'
		});
	});
});