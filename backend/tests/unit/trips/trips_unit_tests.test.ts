jest.mock('../../../src/services/trips_services');

import { describe, it, expect, jest ,beforeEach} from '@jest/globals';
import * as trips_controller from '../../../src/controllers/trips.controller';
import { trips_services } from '../../../src/services/trips_services';
import { ExtendedError } from '../../../src/utils/errors';

function getReadingItem(){

    return {
            recorded_at: new Date().toISOString(),
            data_source: 'gps',
            location: { lat: 0, lon: 0 },
            speed_kmh: 76,
            accelerometer: 2.2,
            gyroscope_x: 0,
            gyroscope_y: 0,
            gyroscope_z: 0,
            rpm: 1500,
            coolant_temp: 80,
            fuel_trim_percent: 7,
            throttle_position: 80,
            dtc_codes: [],
        }
}

describe('Trips endpoints unit tests', ()=>{
    beforeEach(async () => jest.resetAllMocks());

    const make_res = () => {
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        return { status, json };
    };
    //Start trip endpoint
    describe('start trip endpoint',  () =>{
        it('Return 200 upon successful trip start(creates)', async ()=>{
            const mock_trip = {trip_id: 'T-10',data_source:'OBD'};
            jest.spyOn(trips_services,'create').mockResolvedValue(mock_trip as any);

            const req: any = {
                user: { sub: 'user-1' },
                body: { vehicle_id: 'v1', start_date: new Date().toISOString(), data_source: 'OBD', start_location: { lat: 0, lon: 0 } },
            };
            const res: any = make_res()

            await trips_controller.start_trip(req, res);
            expect(res.status).toHaveBeenLastCalledWith(200);
            expect(res.json).toHaveBeenLastCalledWith(expect.objectContaining({ message: expect.any(String), data: mock_trip}));
        });

        //case when  the body is invalid
        it('Returns 403 when the body is invalid', async()=>{
            const req: any = {
                user: undefined,
                body : {}
            };
            const res: any = make_res()

            await trips_controller.start_trip(req,res);

            expect(res.status).toHaveBeenCalledWith(403);
        });
        // error code test for when trip is already in progress 
        it('Returns 409 when trip is already in progress', async ()=>{
            jest.spyOn(trips_services, 'create').mockRejectedValueOnce(new Error('Trip already in progress'));
             const req: any = {
                user: { sub: 'user-1' },
                body: { vehicle_id: 'v1', start_date: new Date().toISOString(), data_source: 'OBD', start_location: { lat: 0, lon: 0 } },
            };
            const res: any = make_res();

            await trips_controller.start_trip(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Trip already in progress' }));
        });

        // error code test for when no fcm tokens are provided
        it('Returns 422 when no tokens provided', async ()=>{
            jest.spyOn(trips_services, 'create').mockRejectedValueOnce(new ExtendedError('No tokens provided','NO_TOKENS_PROVIDED'));
             const req: any = {
                user: { sub: 'user-2' },
                body: { vehicle_id: 'v1', start_date: new Date().toISOString(), data_source: 'OBD', start_location: { lat: 0, lng: 0 } },
            };
            const res: any = make_res();

            await trips_controller.start_trip(req, res);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'NO_TOKENS_PROVIDED', message: 'No tokens provided' }));
        });

        // error code test for when required fields are missing
        it('Returns 422 when missing required fields', async ()=>{
            jest.spyOn(trips_services, 'create').mockRejectedValueOnce(new Error('Missing required fields'));
             const req: any = {
                user: { sub: 'user-1' },
                body: { vehicle_id: null, start_date: new Date().toISOString(), data_source: 'OBD', start_location: { lat: 0, lon: 0 } },
            };
            const res: any = make_res();

            await trips_controller.start_trip(req, res);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'MISSING_REQUIRED_FIELDS' }));
        });

        // error code test for when required fields are missing
        it('Returns 403 when user not found', async ()=>{
            jest.spyOn(trips_services, 'create').mockRejectedValueOnce(new Error('User not found'));
             const req: any = {
                user: null,
                body: { vehicle_id: 'v1', start_date: new Date().toISOString(), data_source: 'OBD', start_location: { lat: 0, lon: 0 } },
            };
            const res: any = make_res();

            await trips_controller.start_trip(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED' }));
        });

        // error code test for when an ExtendedError is thrown
        it('Returns 500 when ExtendedError is thrown', async ()=>{
            jest.spyOn(trips_services, 'create').mockRejectedValueOnce(new ExtendedError('Error','ERROR'));
             const req: any = {
                user: { sub: 'user-1' },
                body: { vehicle_id: 'v1', start_date: new Date().toISOString(), data_source: 'OBD', start_location: { lat: 0, lon: 0 } },
            };
            const res: any = make_res();

            await trips_controller.start_trip(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'ERROR', message: 'Error' }));
        });
    });
    //this is the edge case of the end trip endpoint 
    describe('end_trip endpoint',()=>{
        it('Returns 200 upon successful end to a trip',async()=>{
            const mock_result = {trip_id: 't1',status: 'completed'}
            jest.spyOn(trips_services,'end_trip').mockResolvedValueOnce(mock_result as any);

            const req: any ={
                user: { sub: 'user-1' },
                params: { },
                body: { trip_id: 't1',end_time: new Date().toISOString() },
            };
            const res:any = make_res();

            await trips_controller.end_trip(req,res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String), data: mock_result }));
        });
        it('Returns 404 when trip not found (service throws)', async () => {
            jest.spyOn(trips_services, 'end_trip').mockRejectedValueOnce(new Error('Trip not found'));

            const req: any = { user: { sub: 'user-1' }, params: { trip_id: 'nope' }, body: {} };
            const res: any = make_res();

            await trips_controller.end_trip(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
        it('Returns 409 when a trip that is already end is tired to end again',async()=>{
            jest.spyOn(trips_services,'end_trip').mockRejectedValueOnce(new Error('Cannot end a trip with status'));
            const req: any = {
                user: { sub: 'user-1' },
                params: { trip_id: 't1' },
                body: { end_time: new Date().toISOString() },
            };
            const res: any = make_res();

            await trips_controller.end_trip(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'TRIP_ALREADY_COMPLETED' }));
        });

        it('Returns 403 when unauthorized', async () => {
            jest.spyOn(trips_services, 'end_trip').mockRejectedValueOnce(new Error('Unauthorized'));

            const req: any = { user: null, params: { trip_id: 'nope' }, body: {} };
            const res: any = make_res();

            await trips_controller.end_trip(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED' }));
        });

        it('Returns 403 when user does not own the trip', async () => {
            jest.spyOn(trips_services, 'end_trip').mockRejectedValueOnce(new Error('You do not own this trip'));

            const req: any = { user: { sub: 'user-1' }, params: { trip_id: 'nope' }, body: {} };
            const res: any = make_res();

            await trips_controller.end_trip(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'FORBIDDEN', message: 'You do not own this trip' }));
        });

        it('Returns 409 when a non-specific error is thrown',async()=>{
            jest.spyOn(trips_services,'end_trip').mockRejectedValueOnce(new Error('Error'));
            const req: any = {
                user: { sub: 'user-1' },
                params: { trip_id: 't1' },
                body: { end_time: new Date().toISOString() },
            };
            const res: any = make_res();

            await trips_controller.end_trip(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INTERNAL_SERVER_ERROR' }));
        });
    });
    describe("Get all active shares endpoint", ()=>{
        it('Returns 200 and the list of active shares', async()=>{
            const mock_shares = [
                { share_id: 's1', contact: { contact_id: 'c1', name: 'Jane', email: 'jane@example.com' } },
                { share_id: 's2', contact: { contact_id: 'c2', name: 'Bob', email: 'bob@example.com' } },
            ];
            jest.spyOn(trips_services,"get_trip_shares").mockResolvedValueOnce(mock_shares as any);

            const req: any = {
                user: {sub: 'user-1'},
                params:{ trip_id: 't1'},
            };
            const res: any = make_res();
            await trips_controller.get_all_active_shares(req,res);

            expect(trips_services.get_trip_shares).toHaveBeenLastCalledWith('user-1','t1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: mock_shares}));
        });
        it('Return 402 when user is unauthenticated', async ()=>{
            const req: any = {
                user:{sub: null},
                params: { trip_id: 't1'},
            };
            const res: any  = make_res();
            await trips_controller.get_all_active_shares(req,res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error:"UNAUTHORIZED"}));
            expect(trips_services.get_trip_shares).not.toHaveBeenCalled();
        });it('Returns 403 when trip is not found or not owen by the user', async () =>{
            jest.spyOn(trips_services,'get_trip_shares').mockRejectedValueOnce(new Error('trip not found or You do not own this trip'));
            const req: any = {
                user: {sub: 'user-1'},
                params:{ trip_id: 't1'}
            };
            const res: any = make_res();

            await trips_controller.get_all_active_shares(req,res);
            expect(res.status).toHaveBeenCalledWith(403);
        });
        it('Returns 500 on unexpected error', async ()=>{
            jest.spyOn(trips_services, 'get_trip_shares').mockRejectedValueOnce(new Error('Db crash'));

            const req: any = {
                user: { sub: 'user-1' },
                params: { trip_id: 't1' },
            };
            const res: any = make_res();

            await trips_controller.get_all_active_shares(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
    describe('Revoke trip shares endpoint', ()=>{
        it('Returns 200 when the trip as been  successfully removes share ', async ()=>{
            jest.spyOn(trips_services, 'revoke_share').mockResolvedValueOnce({ success: true } as any);

            const req: any = {
                user:{sub :'user-1'},
                params: { trip_id: 't1', contact_id: 'c1'}
            };
            const res: any = make_res() ;
            await trips_controller.revoke_trip_shares(req,res);
            expect(trips_services.revoke_share).toHaveBeenCalledWith('user-1', 'c1', 't1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'SUCCESSFUL'}))
        });
        it('Throws 403 when the user is unauthenticated', async()=>{
            const req: any = {
                user:{sub: null},
                params: {trip_id: 't1',contact_id: 'c1'}
            };
            const res: any = make_res();
            await trips_controller.revoke_trip_shares(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED' }));
            expect(trips_services.revoke_share).not.toHaveBeenCalled();
        });
        it('Returns 403 when trip not found or not owned by user', async () => {
            jest.spyOn(trips_services, 'revoke_share').mockRejectedValueOnce(
                new Error('trip not found or You do not own this trip')
            );

            const req: any = {
                user: { sub: 'user-1' },
                params: { trip_id: 't1', contact_id: 'c1' },
            };
            const res: any = make_res();

            await trips_controller.revoke_trip_shares(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED' }));
        });
    })
    describe('Record trip end point',()=>{
        it('Returns 201 on successful call', async()=>{
            jest.spyOn(trips_services,'record').mockResolvedValueOnce(undefined);
            const req: any = {
                user: { sub: 'user-1' },
				params: { trip_id: 't1' },
                body: {
                    recorded_at: new Date().toISOString(),
                    data_source: 'gps',
                    location: { lat: 0, lon: 0 },
                    speed_kmh: 60,
                    accelerometer: 1.2,
                    gyroscope_x: 0,
                    gyroscope_y: 0,
                    gyroscope_z: 0,
                    rpm: 3000,
                    coolant_temp: 90,
                    fuel_trim_percent: 5,
                    throttle_position: 50,
                    dtc_codes: [],
                },
            };
            const res: any = make_res();

            await trips_controller.record_trip(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({message: 'Recorded successfully'}));
        });
        it('Returns 404 when trip is not found', async()=>{
            jest.spyOn(trips_services,'record').mockRejectedValueOnce(new Error('Trip not found'));
            const req: any = { user: { sub: 'user-1' }, params: { trip_id: 'nope' }, body: {} };
            const res: any = make_res();

            await trips_controller.record_trip(req,res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'TRIP_NOT_FOUND', message: 'Trip not found' }));
        });

		it('returns 400 when missing required fields', async () => {
			//mocking service to throw error message
			jest.spyOn(trips_services, 'record').mockRejectedValueOnce(new Error('Missing required fields'));
			const req: any = { user: { sub: 'user-1' }, params: { trip_id: 't1' }, body: {}};
			const res: any = make_res();

			await trips_controller.record_trip(req, res);
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: 'MISSING_REQUIRED_FIELDS', message: 'Fill all valid fields'}));
		});

        it('returns 401 when user does not own trip', async () => {
			//mocking service to throw error message
			jest.spyOn(trips_services, 'record').mockRejectedValueOnce(new Error('You do not own this trip'));
			const req: any = { user: { sub: 'user-1' }, params: { trip_id: 't1' }, body: {}};
			const res: any = make_res();

			await trips_controller.record_trip(req, res);
			expect(res.status).toHaveBeenCalledWith(401);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: 'UNAUTHORIZED'}));
		});

		it('returns 500 for unexpected interal error', async () => {
			//mocking error that doesnt match any if/else block
			jest.spyOn(trips_services, 'record').mockRejectedValueOnce(new Error('Unexpected DB crash'));
			const req: any = { user: { sub: 'user-1' }, params: { trip_id: 't1' }, body: {}};
			const res: any = make_res();

			await trips_controller.record_trip(req, res);
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: 'INTERNAL_SERVER_ERROR'}));
		});
    });

    describe('Record batch trip endpoint',()=>{
        it('Returns 201 on successful call', async()=>{
            jest.spyOn(trips_services,'record_batch_trip_readings').mockResolvedValueOnce(0);
            const req: any = {
                user: { sub: 'user-1' },
				params: { trip_id: 't1' },
                body: {
                    readings: [
                        getReadingItem(),
                        getReadingItem(),
                    ]
                    
                },
            };
            const res: any = make_res();

            await trips_controller.record_batch_readings(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                 message: 'Readings added successfully',
                 data: { active_share_count: 0 }
                }));
            
        });

        it('Returns 404 when trip is not found', async()=>{
            jest.spyOn(trips_services,'record_batch_trip_readings').mockRejectedValueOnce(new Error('Trip not found'));
            const req: any = { user: { sub: 'user-1' }, params: { trip_id: 'nope' }, body: { 
                readings: [
                    getReadingItem(),
                    getReadingItem(),
                ]} };

            const res: any = make_res();

            await trips_controller.record_batch_readings(req,res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'TRIP_NOT_FOUND', message: 'Trip not found' }));
        });

		it('returns 400 when missing required fields', async () => {
			//mocking service to throw error message
			jest.spyOn(trips_services, 'record_batch_trip_readings').mockRejectedValueOnce(new Error('Missing required fields'));
			const req: any = { user: { sub: 'user-1' }, params: { trip_id: 't1' }, body: { }};
			const res: any = make_res();

			await trips_controller.record_batch_readings(req, res);
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: 'MISSING_REQUIRED_FIELDS'}));
		});

        it('returns 403 when unauthorized', async () => {
			//mocking service to throw error message
			
			const req: any = { user: { sub: null }, params: { trip_id: 't1' }, body: { readings: [] }};
			const res: any = make_res();

			await trips_controller.record_batch_readings(req, res);
			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: 'UNAUTHORIZED'}));
		});

        it('Returns 404 when trip is not found', async()=>{
            jest.spyOn(trips_services,'record_batch_trip_readings').mockRejectedValueOnce(new Error('You do not own this trip'));
            const req: any = { user: { sub: 'user-1' }, params: { trip_id: 'nope' }, body: { 
                readings: [
                    getReadingItem(),
                    getReadingItem(),
                ]} };

            const res: any = make_res();

            await trips_controller.record_batch_readings(req,res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED', message: "You do not own this trip" }));
        });

		it('returns 500 for unexpected interal error', async () => {
			//mocking error that doesnt match any if/else block
			jest.spyOn(trips_services, 'record').mockRejectedValueOnce(new Error('Unexpected DB crash'));
			const req: any = { user: { sub: 'user-1' }, params: { trip_id: 't1' }, body: { readings: [
                getReadingItem(),
                getReadingItem(),
            ]}};
			const res: any = make_res();

			await trips_controller.record_trip(req, res);
			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith(expect.objectContaining({error: 'INTERNAL_SERVER_ERROR'}));
		});
    });

    describe('Get history endpoint', ()=>{
        it('Returns 200 and history of trips the user had', async()=>{
            const mock_history = [
                { trip_id: 't1', start_date: new Date(), end_date: new Date(), status: 'completed' },
                { trip_id: 't2', start_date: new Date(), end_date: null, status: 'in_progress' },
            ];
            jest.spyOn(trips_services,'get_history').mockResolvedValueOnce(mock_history as any);
            const req: any = {
                user: { sub: 'user-1' },
                query: {
                    start_date: new Date('2026-01-01').toISOString(),
                    end_date: new Date('2026-05-20').toISOString(),
                    status: 'completed',
                },
            };
            const res: any = make_res();

            await trips_controller.get_history(req, res);            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String), data: mock_history }));
        });

        it('Returns 400 on invalid input', async () => {
            jest.spyOn(trips_services, 'get_history').mockRejectedValueOnce(new Error('Invalid date format'));

            const req: any = { user: { sub: 'user-1' }, query: { start_date: 'invalid' } };
            const res: any = make_res();

            await trips_controller.get_history(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid date format' }));
        });

        it('Returns 400 on missing sub', async () => {
            
            const req: any = { user: { sub: null }, query: { start_date: 'invalid' } };
            const res: any = make_res();

            await trips_controller.get_history(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED',
                message:"user not identified" }));
        });
    });
    describe('Get trip summary endpoint',()=>{
        it('Returns 200 and trip summary on success', async () => {
            const mock_summary = {
                trip_id: 't1',
                distance_km: 45.5,
                duration_minutes: 60,
                safety_score: 95,
                eco_score: 88,
            };
            jest.spyOn(trips_services, 'get_summary').mockResolvedValueOnce(mock_summary as any);

            const req: any = {
                user: { sub: 'user-1' },
                params: { trip_id: 't1' },
            };
            const res: any = make_res();

            await trips_controller.get_trip_summary(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mock_summary);
        });

        it('Returns 403 when user does not own the trip', async () => {
            jest.spyOn(trips_services, 'get_summary').mockRejectedValueOnce(new Error('You do not own this trip'));

            const req: any = { user: { sub: 'user-1' }, params: { trip_id: 't1' } };
            const res: any = make_res();

            await trips_controller.get_trip_summary(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'FORBIDDEN' }));
        });

        it('Returns 401 when sub is missing', async () => {

            const req: any = { user: { sub: null }, params: { trip_id: 't1' } };
            const res: any = make_res();

            await trips_controller.get_trip_summary(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED' }));
        });
    });

    describe('Log event endpoint', ()=>{
        it('Returns 201 when a event is logged', async()=>{
            const mock_result = {event_id: 'e1', trip_id: 't1', event_type: 'harsh_braking'};
            jest.spyOn(trips_services,'events_log').mockResolvedValueOnce(mock_result as any);

            const req:any = {
                user: { sub: 'user-1' },
                params: { trip_id: 't1' },
                body: {
                    event_type: 'harsh_braking',
                    location: { lat: 0, lon: 0 },
                    severity: 'high',
                    sensor_source: 'accelerometer',
                    timestamp: new Date().toISOString(),
                },
            };
            const res: any = make_res();

            await trips_controller.log_event(req,res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mock_result);
        });
        it('Returns 400 on invalid event type', async () => {
            jest.spyOn(trips_services, 'events_log').mockRejectedValueOnce(new Error('Invalid event type'));

            const req: any = {
                user: { sub: 'user-1' },
                params: { trip_id: 't1' },
                body: { event_type: 'invalid_type', timestamp: new Date().toISOString() },
            };
            const res: any = make_res();

            await trips_controller.log_event(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_EVENT_TYPE' }));
        });

        it('Returns 401 on missing sub', async () => {
            
            const req: any = {
                user: { sub: null },
                params: { trip_id: 't1' },
                body: { event_type: 'invalid_type', timestamp: new Date().toISOString() },
            };
            const res: any = make_res();

            await trips_controller.log_event(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED' }));
        });


        it('Returns 400 on invalid event type', async () => {
            jest.spyOn(trips_services, 'events_log').mockRejectedValueOnce(new Error('You do not own this trip'));

            const req: any = {
                user: { sub: 'user-1' },
                params: { trip_id: 't1' },
                body: { event_type: 'harsh_braking', timestamp: new Date().toISOString() },
            };
            const res: any = make_res();

            await trips_controller.log_event(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'FORBIDDEN', message: 'You do not own this trip' }));
        });

        it('Returns 500 on non-specific error', async () => {
            jest.spyOn(trips_services, 'events_log').mockRejectedValueOnce(new Error('Error'));

            const req: any = {
                user: { sub: 'user-1' },
                params: { trip_id: 't1' },
                body: { event_type: 'harsh_braking', timestamp: new Date().toISOString() },
            };
            const res: any = make_res();

            await trips_controller.log_event(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INTERNAL_SERVER_ERROR' }));
        });
    });

    describe('Get trip latest location endpoint', ()=>{
        it('Returns 200 and trip latest location data', async()=>{
            const mock_latest_data = { 
                    last_latitude: 25.23,
                    last_longitude: 26.08,
                    last_recorded_at: new Date().toISOString(),
                    last_speed_kmh: 87.8,
                    status: 'IN_PROGRESS'
                };

            jest.spyOn(trips_services,'get_trip_latest_location').mockResolvedValueOnce(mock_latest_data as any);
            const req: any = {
                user: { sub: 'user-1' },
                params: { trip_id: 't1' },
                
            };
            const res: any = make_res();

            await trips_controller.get_trip_latest_location(req, res);            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Latest location successfully retrieved", data: mock_latest_data as any }));
        });

        it('Returns 404 on unexpected error', async () => {
            jest.spyOn(trips_services, 'get_trip_latest_location').mockRejectedValueOnce(new Error('Trip not found'));

            const req: any = { user: { sub: 'user-1' }, params: { trip_id: 't1' }, };
            const res: any = make_res();

            await trips_controller.get_trip_latest_location(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                    error: "TRIP_NOT_FOUND", 
                    message: "Trip not found" 
                }));
        });

        it('Returns 401 on missing sub', async () => {
            

            const req: any = { user: { sub: null }, params: { trip_id: 't1' }, };
            const res: any = make_res();

            await trips_controller.get_trip_latest_location(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
                    error: "UNAUTHORIZED", 
                    message: "Can not view this trip" 
                }));
        });

        it('Returns 500 on unexpected error', async () => {
            jest.spyOn(trips_services, 'get_trip_latest_location').mockRejectedValueOnce(new Error('Db crash'));

            const req: any = { user: { sub: 'user-1' }, params: { trip_id: 't1' }, };
            const res: any = make_res();

            await trips_controller.get_trip_latest_location(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INTERNAL_SERVER_ERROR'  }));
        });
    });

    describe('Get trips shared with me endpoint', ()=>{
        it('Returns 200 and trip latest location data', async()=>{
            const mock_shared_data = [
                {
                trip_id: 'trip-1',
                owner: 'john',
                shared_at: new Date().toISOString(),
                status: 'IN_PROGRESS',
                started_at: new Date().toISOString(),
                start_latitude: 25.23,
                start_longitude: 26.08,
                fuel_estimate: 3.2
                },
                {
                trip_id: 'trip-2',
                owner: 'bob',
                shared_at: new Date().toISOString(),
                status: 'IN_PROGRESS',
                started_at: new Date().toISOString(),
                start_latitude: 25.23,
                start_longitude: 26.08,
                fuel_estimate: 3.2
                },
            ];

            jest.spyOn(trips_services,'get_trips_shared_with_me').mockResolvedValueOnce(mock_shared_data as any);
            const req: any = {
                user: { sub: 'user-1' },  
            };
            const res: any = make_res();

            await trips_controller.get_trips_shared_with_me(req, res);            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Successfully fetched trips shared with you", data: { trips: mock_shared_data } }));
        });

         it('Returns 401 on unauthorized', async()=>{
            const mock_shared_data = [
                {
                trip_id: 'trip-1',
                owner: 'john',
                shared_at: new Date().toISOString(),
                status: 'IN_PROGRESS',
                started_at: new Date().toISOString(),
                start_latitude: 25.23,
                start_longitude: 26.08,
                fuel_estimate: 3.2
                },
                {
                trip_id: 'trip-2',
                owner: 'bob',
                shared_at: new Date().toISOString(),
                status: 'IN_PROGRESS',
                started_at: new Date().toISOString(),
                start_latitude: 25.23,
                start_longitude: 26.08,
                fuel_estimate: 3.2
                },
            ];

            const req: any = {
                user: { sub: null },  
            };
            const res: any = make_res();

            await trips_controller.get_trips_shared_with_me(req, res);            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED', message:  "Can not view this trip"}));
        });

        it('Returns 500 on unexpected error', async () => {
            jest.spyOn(trips_services, 'get_trips_shared_with_me').mockRejectedValueOnce(new Error('Db crash'));

            const req: any = { user: { sub: 'user-1' }, };
            const res: any = make_res();

            await trips_controller.get_trips_shared_with_me(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INTERNAL_SERVER_ERROR'  }));
        });
    });

    describe('Check stop event endpoint', ()=>{
        it('returns 200 when stop checked successfully', async()=>{
            const mock_result = {
                stop_event_id: 'stop-1',
                classification: 'expected',
                location_context: {
                    address: 'Main Street',
                    poi_category: null,
                },
                should_prompt: true,
            };

            jest.spyOn(trips_services,'check_stop').mockResolvedValueOnce(mock_result as any);

            const req: any = {
                user: { sub: 'user-1' },  
                params: { trip_id: 'trip-1'},
                body: {
                    location: { lat: 25.23, lng: -26.93},
                    stopped_at: Date.now() - 5*60*1000,
                },
            };
            const res: any = make_res();

            await trips_controller.check_stop_event(req, res);

            expect(trips_services.check_stop).toHaveBeenCalledWith(
                'user-1',
                'trip-1',
                25.23,
                -26.93,
                req.body.stopped_at
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Stop event check completed successfully', data: mock_result}));
        });

         it('Returns 401 when user unauthenticated', async()=>{
            const req: any = {
                user: { sub: null },  
                params: { trip_id: 'trip-1'},
                body: {
                    location: { lat: 25.23, lng: -26.93},
                    stopped_at: Date.now() - 5*60*1000,
                },
            };

            const res: any = make_res();

            await trips_controller.check_stop_event(req, res);            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED', message:  "Unauthorized to log unexpected stop event"}));
        });

        it('Returns 400 when location coordinates are invalid', async () => {
            jest.spyOn(trips_services, 'check_stop').mockRejectedValueOnce(new Error('Location coordinates missing'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
                body: {
                    location: { lat: 0.0, lng: 0.0},
                    stopped_at: Date.now() - 5*60*1000,
                },
            };
            const res: any = make_res();

            await trips_controller.check_stop_event(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_LOCATION', message: 'Location coordinates missing or invalid'}));
        });

        it('Returns 422 when stopped_at is in the future', async () => {
            jest.spyOn(trips_services, 'check_stop').mockRejectedValueOnce(new Error('stopped_at cannot be in the future'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
                body: {
                    location: { lat: 0.0, lng: 0.0},
                    stopped_at: Date.now() + 5*60*1000,
                },
            };
            const res: any = make_res();

            await trips_controller.check_stop_event(req, res);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_STOP', message: 'Stopped_at cannot be in the future'}));
        });

        it('Returns 500 on unexpected error', async () => {
            jest.spyOn(trips_services, 'check_stop').mockRejectedValueOnce(new Error('Db crash'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { trip_id: 'trip-1'},
                body: {
                    location: { lat: 25.23, lng: -26.93},
                    stopped_at: Date.now() - 5*60*1000,
                },
            };
            const res: any = make_res();

            await trips_controller.check_stop_event(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INTERNAL_SERVER_ERROR', message: 'Could not successfully check stop'}));
        });
    });

    describe('Confirm stop event endpoint', ()=>{
        it('returns 200 when stop is confirmed successfully', async()=>{
            const mock_result = {
                status: 'confirmed',
                already_handled: false,
            };

            jest.spyOn(trips_services,'confirm_stop').mockResolvedValueOnce(mock_result as any);

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
            };
            const res: any = make_res();

            await trips_controller.confirm_stop_event(req, res);

            expect(trips_services.confirm_stop).toHaveBeenCalledWith(
                'user-1',
                'event-1',
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unexpected stop confirmed', data: mock_result}));
        });

         it('Returns 401 when user unauthenticated', async()=>{
            const req: any = {
                user: { sub: null },  
                params: { event_id: 'event-1'}, 
            };

            const res: any = make_res();

            await trips_controller.confirm_stop_event(req, res);            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED', message:  "Unauthorized to confirm unexpected stop event"}));
        });

        it('Returns 400 when the stop event is not found', async () => {
            jest.spyOn(trips_services, 'confirm_stop').mockRejectedValueOnce(new Error('event not found'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
            };
            const res: any = make_res();

            await trips_controller.confirm_stop_event(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'EVENT_NOT_FOUND', message: 'Unexpected stop event not found'}));
        });

         it('Returns 403 when the user is not found', async () => {
            jest.spyOn(trips_services, 'confirm_stop').mockRejectedValueOnce(new Error('user not found'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
            };
            const res: any = make_res();

            await trips_controller.confirm_stop_event(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'USER_NOT_FOUND', message: 'User not found'}));
        });

        it('Returns 500 on unexpected error', async () => {
            jest.spyOn(trips_services, 'confirm_stop').mockRejectedValueOnce(new Error('Db crash'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
            };
            const res: any = make_res();

            await trips_controller.confirm_stop_event(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INTERNAL_SERVER_ERROR', message: 'Could not successfully confirm stop'}));
        });
    });

    describe('Resolve stop event endpoint', ()=>{
        it('returns 200 when stop is resolved successfully', async()=>{
            const mock_result = {
                resolved: true,
            };

            jest.spyOn(trips_services,'resolve_stop').mockResolvedValueOnce(mock_result as any);

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
                body: { reason: 'moved' },
            };
            const res: any = make_res();

            await trips_controller.resolve_stop_event(req, res);

            expect(trips_services.resolve_stop).toHaveBeenCalledWith(
                'user-1',
                'event-1',
                'moved'
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unexpected stop resolved', data: mock_result}));
        });

         it('Returns 401 when user unauthenticated', async()=>{
            const req: any = {
                user: { sub: null },  
                params: { event_id: 'event-1'},
                body: { reason: 'moved'},
            };

            const res: any = make_res();

            await trips_controller.resolve_stop_event(req, res);            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED', message:  "Unauthorized to resolve unexpected stop event"}));
        });

        it('Returns 400 when the stop event is not found', async () => {
            jest.spyOn(trips_services, 'resolve_stop').mockRejectedValueOnce(new Error('event not found'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
                body: { reason: 'moved'}
            };
            const res: any = make_res();

            await trips_controller.resolve_stop_event(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'EVENT_NOT_FOUND', message: 'Unexpected stop event not found'}));
        });

        it('Returns 422 when the reason is missing', async () => {
            jest.spyOn(trips_services, 'resolve_stop').mockRejectedValueOnce(new Error('reason missing'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
                body: {}
            };
            const res: any = make_res();

            await trips_controller.resolve_stop_event(req, res);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'REASON_MISSING', message: 'Reason parameter needed'}));
        });

        it('Returns 403 when user does not own the event or trip', async () => {
            jest.spyOn(trips_services, 'resolve_stop').mockRejectedValueOnce(new Error('cannot access event'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
                body: {}
            };
            const res: any = make_res();

            await trips_controller.resolve_stop_event(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED', message: 'Cannot access this event'}));
        });

         it('Returns 403 when the user is not found', async () => {
            jest.spyOn(trips_services, 'resolve_stop').mockRejectedValueOnce(new Error('user not found'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
                body: { reason: 'moved'},
            };
            const res: any = make_res();

            await trips_controller.resolve_stop_event(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'USER_NOT_FOUND', message: 'User not found'}));
        });

        it('Returns 500 on unexpected error', async () => {
            jest.spyOn(trips_services, 'confirm_stop').mockRejectedValueOnce(new Error('Db crash'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { event_id: 'event-1'},
                body: { reason: 'moved'},
            };
            const res: any = make_res();

            await trips_controller.confirm_stop_event(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INTERNAL_SERVER_ERROR', message: 'Could not successfully confirm stop'}));
        });
    });

     describe('Unusual duration event endpoint', ()=>{
        it('returns 200 when duration event is logged and notifications sent successfully', async()=>{
            const mock_result ='Unusual trip duration notifications successfully sent';

            jest.spyOn(trips_services,'alert_unusual_trip_duration').mockResolvedValueOnce(mock_result as any);

            const req: any = {
                user: { sub: 'user-1' },  
                params: { trip_id: 'trip-1'},
                body: { expected_seconds: 1000, moving_seconds: 1500},
            };
            const res: any = make_res();

            await trips_controller.alert_unusual_trip_duration(req, res);

            expect(trips_services.alert_unusual_trip_duration).toHaveBeenCalledWith(
                'user-1',
                'trip-1',
                1000,
                1500
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: mock_result}));
        });

         it('Returns 401 when user unauthenticated', async()=>{
            const req: any = {
                user: { sub: null },  
                params: { trip_id: 'trip-1'},
                body: { expected_seconds: 1000, moving_seconds: 1500},
            };

            const res: any = make_res();

            await trips_controller.alert_unusual_trip_duration(req, res);            
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'UNAUTHORIZED', message:  "Unauthorized to log unusual duration event"}));
        });

        it('Returns 422 when expected_seconds greater than moving_seconds', async () => {
            jest.spyOn(trips_services, 'alert_unusual_trip_duration').mockRejectedValueOnce(new Error('Expected greater than moving'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { trip_id: 'trip-1'},
                body: { expected_seconds: 1500, moving_seconds: 1000},
            };
            const res: any = make_res();

            await trips_controller.alert_unusual_trip_duration(req, res);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_PARAMETERS', message: 'Moving seconds cannot be greater than expected'}));
        });

        it('Returns 422 when expected_seconds invalid', async () => {
            jest.spyOn(trips_services, 'alert_unusual_trip_duration').mockRejectedValueOnce(new Error('expected_seconds invalid'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { trip_id: 'trip-1'},
                body: { expected_seconds: -1000, moving_seconds: 1000},
            };
            const res: any = make_res();

            await trips_controller.alert_unusual_trip_duration(req, res);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_EXPECTED_SECONDS', message: 'Expected_seconds missing or invalid'}));
        });

        it('Returns 422 when moving_seconds invalid', async () => {
            jest.spyOn(trips_services, 'alert_unusual_trip_duration').mockRejectedValueOnce(new Error('moving_seconds invalid'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { trip_id: 'trip-1'},
                body: { expected_seconds: 1000, moving_seconds: -1000},
            };
            const res: any = make_res();

            await trips_controller.alert_unusual_trip_duration(req, res);

            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_MOVING_SECONDS', message: 'Moving_seconds missing or invalid'}));
        });

         it('Returns 403 when the user is not found', async () => {
            jest.spyOn(trips_services, 'alert_unusual_trip_duration').mockRejectedValueOnce(new Error('user not found'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { trip_id: 'event-1'},
                body: { expected_seconds: 1000, moving_seconds: 1500},
            };
            const res: any = make_res();

            await trips_controller.alert_unusual_trip_duration(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'USER_NOT_FOUND', message: 'User not found'}));
        });

        it('Returns 500 on unexpected error', async () => {
            jest.spyOn(trips_services, 'alert_unusual_trip_duration').mockRejectedValueOnce(new Error('Db crash'));

            const req: any = {
                user: { sub: 'user-1' },  
                params: { trip_id: 'trip-1'},
                body: { expected_seconds: 1000, moving_seconds: 1500},
            };
            const res: any = make_res();

            await trips_controller.alert_unusual_trip_duration(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INTERNAL_SERVER_ERROR', message: 'Could not successfully log unusual duration'}));
        });
    });



});