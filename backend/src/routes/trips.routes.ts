import {Router, request, response } from "express";
import * as trips_controller from "../controllers/trips.controller";
import {verify_token} from '../middleware/auth';
import {requireTripAccess} from '../middleware/trip_access';
import { create_user_based_limiter, trip_event_limiter, create_trip_reading_limiter, create_map_token_limiter } from "../middleware/rate_limit";

const trips_router = Router();

//Create 
/**
 * @openapi
 * /api/trips:
 *   post:
 *     tags:
 *       - Trips
 *     summary: Start a new trip
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_id
 *               - start_date
 *               - data_source
 *               - start_location
 *             properties:
 *               vehicle_id:
 *                 type: string
 *                 example: vehicle-1
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-31T10:00:00.000Z"
 *               data_source:
 *                 type: string
 *                 enum: [OBD, PHONE]
 *                 example: PHONE
 *               start_location:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 25.7128
 *                   lng:
 *                     type: number
 *                     example: -24.0060
 *               end_location:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               fuel_level_start:
 *                 type: number
 *                 nullable: true
 *                 example: 75
 *               share_with_contacts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Trip started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: trip successfully started
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       403:
 *         description: Missing required fields or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 value:
 *                   error: MISSING_REQUIRED_FIELDS
 *                   message: Missing required fields
 *               userNotFound:
 *                 value:
 *                   error: USER_NOT_FOUND
 *                   message: User not found
 *       409:
 *         description: Trip already in progress
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: TRIP_ALREADY_IN_PROGRESS
 *               message: Trip already in progress
 *       422:
 *         description: No FCM tokens provided for push notifications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: NO_TOKENS_PROVIDED
 *               message: No tokens provided
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 */
trips_router.post("/start_trip",verify_token, create_user_based_limiter(), trips_controller.start_trip);

/**
 * @openapi
 * /api/trips/{trip_id}/readings/record:
 *   post:
 *     tags:
 *       - Trips
 *     summary: Record a single trip reading
 *     parameters:
 *       - in: path
 *         name: trip_id
 *         required: true
 *         schema:
 *           type: string
 *         example: trip-1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recorded_at
 *               - data_source
 *               - location
 *               - speed_kmh
 *               - accelerometer
 *               - gyroscope_x
 *               - gyroscope_y
 *               - gyroscope_z
 *               - rpm
 *               - coolant_temp_c
 *               - fuel_trim_percent
 *               - throttle_position
 *               - dtc_codes
 *             properties:
 *               recorded_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-31T10:15:00.000Z"
 *               data_source:
 *                 type: string
 *                 enum: [OBD, PHONE]
 *                 example: PHONE
 *               location:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 25.7128
 *                   lng:
 *                     type: number
 *                     example: -24.0060
 *               speed_kmh:
 *                 type: number
 *                 example: 65.5
 *               accelerometer:
 *                 type: number
 *                 example: 0.98
 *               gyroscope_x:
 *                 type: number
 *                 example: 0.01
 *               gyroscope_y:
 *                 type: number
 *                 example: 0.02
 *               gyroscope_z:
 *                 type: number
 *                 example: 0.15
 *               rpm:
 *                 type: integer
 *                 example: 2500
 *               coolant_temp_c:
 *                 type: number
 *                 example: 92.5
 *               fuel_trim_percent:
 *                 type: number
 *                 example: 2.1
 *               throttle_position:
 *                 type: number
 *                 example: 35.0
 *               dtc_codes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *     responses:
 *       201:
 *         description: Trip reading recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Recorded successfully
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: MISSING_REQUIRED_FIELDS
 *               message: Fill all valid fields
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       404:
 *         description: Trip not found or not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tripNotFound:
 *                 value:
 *                   error: TRIP_NOT_FOUND
 *                   message: Trip not found
 *               tripNotOwned:
 *                 value:
 *                   error: UNAUTHORIZED
 *                   message: You do not own this trip
 *       429:
 *         description: Rate limit triggered for trip readings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Internal server error
 */
trips_router.post("/:trip_id/readings/record",verify_token, create_trip_reading_limiter(), trips_controller.record_trip);

/**
 * @openapi
 * /api/trips/{trip_id}/events/log:
 *   post:
 *     tags:
 *       - Trips
 *     summary: Log a trip driving event
 *     parameters:
 *       - in: path
 *         name: trip_id
 *         required: true
 *         schema:
 *           type: string
 *         example: trip-1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_type
 *               - location
 *               - severity
 *               - sensor_source
 *               - timestamp
 *             properties:
 *               event_type:
 *                 type: string
 *                 enum: [HARSH_BRAKE, HARSH_ACCELERATION, SHARP_CORNER, CRASH_LIKE]
 *                 example: HARSH_BRAKE
 *               location:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 25.7128
 *                   lng:
 *                     type: number
 *                     example: -24.0060
 *               severity:
 *                 type: number
 *                 example: 8.5
 *               sensor_source:
 *                 type: string
 *                 enum: [ACCELEROMETER, GYROSCOPE, OBD]
 *                 example: ACCELEROMETER
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-31T10:30:00.000Z"
 *     responses:
 *       201:
 *         description: Event logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event logged successfully
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized
 *       400:
 *         description: Invalid event type or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_EVENT_TYPE
 *               message: Invalid event type
 *       404:
 *         description: Trip not found or not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tripNotFound:
 *                 value:
 *                   error: TRIP_NOT_FOUND
 *                   message: Trip not found
 *               tripNotOwned:
 *                 value:
 *                   error: UNAUTHORIZED
 *                   message: You do not own this trip
 *       429:
 *         description: Rate limit triggered for trip events
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Internal server error
 */
trips_router.post("/:trip_id/events/log", verify_token, trip_event_limiter, trips_controller.log_event);

/**
 * @openapi
 * /api/trips/{trip_id}/batch_readings/record:
 *   post:
 *     tags:
 *       - Trips
 *     summary: Record multiple trip readings in batch
 *     parameters:
 *       - in: path
 *         name: trip_id
 *         required: true
 *         schema:
 *           type: string
 *         format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - readings
 *             properties:
 *               readings:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - recorded_at
 *                     - data_source
 *                     - location
 *                     - speed_kmh
 *                     - accelerometer
 *                     - gyroscope_x
 *                     - gyroscope_y
 *                     - gyroscope_z
 *                     - rpm
 *                     - coolant_temp_c
 *                     - fuel_trim_percent
 *                     - throttle_position
 *                     - dtc_codes
 *                   properties:
 *                     recorded_at:
 *                       type: string
 *                       format: date-time
 *                     data_source:
 *                       type: string
 *                       enum: [OBD, PHONE]
 *                     location:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *                     speed_kmh:
 *                       type: number
 *                     accelerometer:
 *                       type: number
 *                     gyroscope_x:
 *                       type: number
 *                     gyroscope_y:
 *                       type: number
 *                     gyroscope_z:
 *                       type: number
 *                     rpm:
 *                       type: integer
 *                     coolant_temp_c:
 *                       type: number
 *                     fuel_trim_percent:
 *                       type: number
 *                     throttle_position:
 *                       type: number
 *                     dtc_codes:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Batch readings recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Readings added successfully
 *                 data:
 *                   type: object
 *                   required:
 *                     - active_share_count
 *                   properties:
 *                     active_share_count:
 *                       type: integer
 *                       example: 2
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: MISSING_REQUIRED_FIELDS
 *               message: Missing required fields
 *       403:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized
 *       404:
 *         description: Trip not found or not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tripNotFound:
 *                 value:
 *                   error: TRIP_NOT_FOUND
 *                   message: Trip not found
 *               tripNotOwned:
 *                 value:
 *                   error: UNAUTHORIZED
 *                   message: You do not own this trip
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Could not record readings
 */
trips_router.post("/:trip_id/batch_readings/record", verify_token, create_trip_reading_limiter(), trips_controller.record_batch_readings);

/**
 * @openapi
 * /api/trips/{trip_id}/stop_event/check:
 *   post:
 *     tags:
 *       - Trips
 *     summary: Check and classify a potential unexpected stop event
 *     parameters:
 *       - in: path
 *         name: trip_id
 *         required: true
 *         schema:
 *           type: string
 *         format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - stopped_at
 *             properties:
 *               location:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 25.7128
 *                   lng:
 *                     type: number
 *                     example: -24.0060
 *               stopped_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-31T10:45:00.000Z"
 *     responses:
 *       200:
 *         description: Stop event checked and classified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Stop event check completed successfully
 *                 data:
 *                   $ref: '#/components/schemas/StopEvent'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized to log unexpected stop event
 *       400:
 *         description: Invalid location coordinates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_LOCATION
 *               message: Invalid location coordinates
 *       422:
 *         description: stopped_at timestamp is in the future
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_TIMESTAMP
 *               message: Stopped_at cannot be in the future
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *             example:
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Could not successfully check stop
 */
trips_router.post("/:trip_id/stop_event/check", verify_token, create_map_token_limiter(), requireTripAccess, trips_controller.check_stop_event);

/**
 * @openapi
 * /api/trips/stop_event/{event_id}/confirm:
 *   post:
 *     tags:
 *       - Trips
 *     summary: Confirm an unexpected stop event
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: Stop event confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unexpected stop confirmed
 *                 data:
 *                   type: object
 *                   properties:
 *                      status:
 *                          type: string
 *                          example: confirmed
 *                      already_handled:
 *                          type: boolean
 *                          example: false
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized to confirm unexpected stop event
 *       400:
 *         description: Stop event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: EVENT_NOT_FOUND
 *               message: Unexpected stop event not found
 *       403:
 *         description: User not found or event validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: USER_NOT_FOUND
 *               message: User not found
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Could not successfully confirm stop
 */
trips_router.post("/:event_id/stop_event/confirm", verify_token, create_map_token_limiter(), trips_controller.confirm_stop_event);

/**
 * @openapi
 * /api/trips/stop_event/{event_id}/resolve:
 *   post:
 *     tags:
 *       - Trips
 *     summary: Resolve a stop event with a reason
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Stopped at gas station
 *     responses:
 *       200:
 *         description: Stop event resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unexpected stop resolved
 *                 data:
 *                   type: object
 *                   properties:
 *                      resolved:
 *                          type: boolean
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized to resolve unexpected stop event
 *       400:
 *         description: Stop event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: EVENT_NOT_FOUND
 *               message: Unexpected stop event not found
 *       403:
 *         description: User does not own the event or associated trip
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Cannot access this event
 *       422:
 *         description: Missing required reason field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: REASON_MISSING
 *               message: Reason parameter needed
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Could not successfully resolve stop
 */
trips_router.post("/:event_id/stop_event/resolve", verify_token, create_map_token_limiter(), trips_controller.resolve_stop_event);
//read basically get

/**
 * @openapi
 * /api/trips/history:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get trip history for the authenticated user
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [COMPLETED, IN_PROGRESS, ABORTED]
 *     responses:
 *       200:
 *         description: Trip history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Trip history retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TripHistoryItem'
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
trips_router.get("/history",verify_token, create_user_based_limiter(), trips_controller.get_history);

/**
 * @openapi
 * /api/trips/{trip_id}/summary:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get summary details for a specific trip
 *     parameters:
 *       - in: path
 *         name: trip_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Trip summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TripSummary'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User does not own this trip
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
trips_router.get("/:trip_id/summary", verify_token, create_user_based_limiter(), trips_controller.get_trip_summary);

/**
 * @openapi
 * /api/trips/{trip_id}/latest_location:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get the latest recorded location for an active trip
 *     parameters:
 *       - in: path
 *         name: trip_id
 *         required: true
 *         schema:
 *           type: string
 *         format: uuid
 *     responses:
 *       200:
 *         description: Latest trip location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Latest location successfully retrieved
 *                 data:
 *                   type: object
 *                   required:
 *                     - last_latitude
 *                     - last_longitude
 *                     - last_recorded_at
 *                   properties:
 *                     last_latitude:
 *                       type: number
 *                       example: 25.7128
 *                     last_longitude:
 *                       type: number
 *                       example: -24.0060
 *                     last_recorded_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-08-31T10:45:00.000Z"
 *                     last_speed_kmh:
 *                       type: number
 *                       example: 65.5
 *                     status:
 *                       type: string
 *                       enum: [IN_PROGRESS, COMPLETED, ABORTED]
 *                       example: IN_PROGRESS
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Can not view this trip
 *       404:
 *         description: Trip not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: TRIP_NOT_FOUND
 *               message: Trip not found
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *             example:
 *               error: TOO_MANY_REQUESTS
 *               message: Too many requests, please try again later
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 */
trips_router.get("/:trip_id/latest_location", verify_token, create_trip_reading_limiter() , requireTripAccess, trips_controller.get_trip_latest_location);

/**
 * @openapi
 * /api/trips/shared_with_me:
 *   get:
 *     tags:
 *       - Trips
 *     summary: Get trips currently being shared with the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shared trips retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully fetched trips shared with you
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       trip_id:
 *                         type: string
 *                         format: uuid
 *                       shared_by_user_id:
 *                         type: string
 *                         format: uuid
 *                       shared_at:
 *                         type: string
 *                         format: date-time
 *                       trip_status:
 *                         type: string
 *                         enum: [IN_PROGRESS, COMPLETED, ABORTED]
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Can not view this trip
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 */
trips_router.get("/shared_with_me", verify_token, create_user_based_limiter(), trips_controller.get_trips_shared_with_me);
//delete 

//Update
/**
 * @openapi
 * /api/trips/{trip_id}/end_trip:
 *   patch:
 *     tags:
 *       - Trips
 *     summary: End an active trip
 *     parameters:
 *       - in: path
 *         name: trip_id
 *         required: true
 *         schema:
 *           type: string
 *         example: trip-1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - end_time
 *               - route_polyline
 *               - distance_km
 *               - duration_minutes
 *               - fuel_estimate
 *               - status
 *             properties:
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-31T11:30:00.000Z"
 *               route_polyline:
 *                 type: object
 *               distance_km:
 *                 type: number
 *                 example: 25.5
 *               duration_minutes:
 *                 type: integer
 *                 example: 90
 *               fuel_estimate:
 *                 type: number
 *                 example: 2.1
 *               status:
 *                 type: string
 *                 enum: [COMPLETED, ABORTED]
 *                 example: COMPLETED
 *               end_location:
 *                 type: object
 *                 nullable: true
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 23.78
 *                   lng:
 *                     type: number
 *                     example: -28.36
 *               fuel_level_end:
 *                 type: number
 *                 example: 46
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Trip ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *                 - data
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Trip completed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Trip'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       403:
 *         description: Trip not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: FORBIDDEN
 *               message: You do not own this trip
 *       404:
 *         description: Trip not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: TRIP_NOT_FOUND
 *               message: Trip not found
 *       409:
 *         description: Trip cannot be ended (already completed or invalid status)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *                error: TRIP_ALREADY_COMPLETED
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 */
trips_router.get("/:trip_id/shares", verify_token, create_user_based_limiter(), trips_controller.get_all_active_shares);
trips_router.delete("/:trip_id/shares/:contact_id", verify_token, create_user_based_limiter(), trips_controller.revoke_trip_shares);
trips_router.patch("/:trip_id/end_trip",verify_token, create_user_based_limiter(), trips_controller.end_trip);
export default trips_router;