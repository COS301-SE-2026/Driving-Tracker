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