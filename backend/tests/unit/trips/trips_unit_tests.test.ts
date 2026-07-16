jest.mock('../../../src/services/trips_services');

import { describe, it, expect, jest ,beforeEach} from '@jest/globals';
import * as trips_controller from '../../../src/controllers/trips.controller';
import { trips_services } from '../../../src/services/trips_services';
import { ExtendedError } from '../../../src/utils/errors';

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

    describe('Record trip end point',()=>{
        it('Return 201 on successful call', async()=>{
            jest.spyOn(trips_services,'record').mockResolvedValueOnce(undefined);
            const req: any = {
                user: { sub: 'user-1' },
                body: {
                    trip_id: 't1',
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
            const req: any = { user: { sub: 'user-1' }, body: { trip_id: 'nope' } };
            const res: any = make_res();

            await trips_controller.record_trip(req,res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Trip not found' }));
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
    })

})