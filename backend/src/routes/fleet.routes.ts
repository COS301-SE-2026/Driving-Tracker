import { Router } from 'express';
import leaderboard_controller from '../controllers/leaderboard.controller';
import { verify_token } from '../middleware/auth';
import { get_fuel_leaderboard } from "../controllers/fuel_leaderboard.controller";
import { create_user_based_limiter } from '../middleware/rate_limit';
import fleet_controller from '../controllers/fleet.controller';
import * as vehicle_router from "../controllers/vehicle.controller";

const fleet_router = Router();

/**
 * @openapi
 * /api/fleet/add_organization:
 *   post:
 *     tags:
 *       - Fleet
 *     summary: Add new organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: MegaCorp
 *     responses:
 *       201:
 *         description: Organization successfully added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                  type: object
 *                  properties:
 *                      org_id:
 *                          type: string
 *                          format: uuid
 *                 message:
 *                  type: string
 *                  example: Organization successfully added 
 *       422:
 *         description: Invalid name parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_NAME
 *               message: Name cannot be empty
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
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
 *               message: Failed to add organization
 */
fleet_router.post('/add_organization', verify_token, create_user_based_limiter(), fleet_controller.add_organization);

/**
 * @openapi
 * /api/fleet/add_fleet_vehicle:
 *   post:
 *     tags:
 *       - Fleet
 *     summary: Add a vehicle to the organization fleet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [make, model, year, fuel_type, fuel_tank]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Delivery Van
 *               registration:
 *                 type: string
 *                 example: ABC-123
 *               make:
 *                 type: string
 *                 example: Toyota
 *               model:
 *                 type: string
 *                 example: Corolla
 *               year:
 *                 type: integer
 *                 example: 2022
 *               fuel_type:
 *                 type: string
 *                 example: PETROL
 *               fuel_tank:
 *                 type: number
 *                 example: 50
 *     responses:
 *       201:
 *         description: Fleet vehicle successfully added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FleetVehicleCreateResponse'
 *             example:
 *               data:
 *                 vehicle_id: vehicle-123
 *                 name: Delivery Van
 *                 registration: ABC-123
 *                 make: Toyota
 *                 model: Corolla
 *                 year: 2022
 *                 fuel_tank: 50
 *                 fuel_efficiency: 7.2
 *                 fuel_type: PETROL
 *                 org_id: org-123
 *               warning: null
 *       400:
 *         description: Missing vehicle fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: MISSING_REQUIRED_FIELDS
 *               message: 'Missing required fields: make, model, year, fuel_type, fuel_tank'
 *       403:
 *         description: Insufficient organization permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: You do not have the permissions to add a fleet vehicle
 *       404:
 *         description: Member was not found or is not in that organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: MEMBER_NOT_FOUND
 *               message: Member not found
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
fleet_router.post("/add_fleet_vehicle",verify_token, create_user_based_limiter(), fleet_controller.add_fleet_vehicle);


fleet_router.post("/schedule_trip", verify_token, create_user_based_limiter(), fleet_controller.schedule_trip);

/**
 * @openapi
 * /api/fleet/:trip_id/start_scheduled_trip:
 *   patch:
 *     tags: [Fleet]
 *     summary: Start a scheduled fleet trip
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: trip_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: trip-123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicle_id, start_time, start_location]
 *             properties:
 *               vehicle_id:
 *                 type: string
 *                 format: uuid
 *                 example: vehicle-123
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-09-24T09:00:00.000Z
 *               start_location:
 *                 type: object
 *                 required: [lat, lng]
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: -26.2041
 *                   lng:
 *                     type: number
 *                     example: 28.0473
 *               fuel_level_start:
 *                 type: number
 *                 example: 48.5
 *     responses:
 *       200:
 *         description: Scheduled trip started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, data]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Scheduled trip started successfully
 *                 data:
 *                   $ref: '#/components/schemas/ScheduledTrip'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       404:
 *         description: Driver or scheduled trip was not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               driverNotFound:
 *                 value:
 *                   error: USER_NOT_FOUND
 *                   message: Driver not found
 *               tripNotFound:
 *                 value:
 *                   error: TRIP_NOT_FOUND
 *                   message: Scheduled trip not found
 *       409:
 *         description: Trip cannot be started
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               activeTrip:
 *                 value:
 *                   error: TRIP_IN_PROGRESS
 *                   message: Trip already in progress
 *               unavailable:
 *                 value:
 *                   error: CANNOT_START_TRIP
 *                   message: Trip no longer available to start
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Failed to start scheduled trip
 */
fleet_router.patch("/:trip_id/start_scheduled_trip", verify_token, create_user_based_limiter(), fleet_controller.start_scheduled_trip);

/**
 * @openapi
 * /api/fleet/add_driver:
 *   post:
 *     tags: [Fleet]
 *     summary: Add a driver to the organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, username, name, surname, phone_number, dob]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: driver@example.com
 *               username:
 *                 type: string
 *                 example: driver123
 *               name:
 *                 type: string
 *                 example: Jane
 *               surname:
 *                 type: string
 *                 example: Doe
 *               phone_number:
 *                 type: string
 *                 example: "0123456789"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-01
 *     responses:
 *       201:
 *         description: Driver successfully added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully added driver
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       403:
 *         description: User is not authorized to add drivers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Not authorized to add drivers
 *       409:
 *         description: Email or username conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: EMAIL_TAKEN
 *               message: You already have an account with this email address
 *       422:
 *         description: Invalid driver details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_PHONE
 *               message: Invalid phone number. Should be 0603456789 format
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
fleet_router.post("/add_driver", verify_token, create_user_based_limiter(), fleet_controller.add_driver);


/**
 * @openapi
 * /api/fleet/fleet_drivers:
 *   get:
 *     tags: [Fleet]
 *     summary: List organization fleet drivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fleet drivers successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, data]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fleet drivers successfully retrieved
 *                 data:
 *                   type: object
 *                   required: [drivers]
 *                   properties:
 *                     drivers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FleetDriver'
 *             example:
 *               message: Fleet drivers successfully retrieved
 *               data:
 *                 drivers:
 *                   - user_id: user-123
 *                     username: janedoe42
 *                     name: Jane
 *                     surname: Doe
 *                     email: jane.doe@example.com
 *                     phone_number: "0123456789"
 *                     profile_picture_url: null
 *                     joined_at: 2026-09-01T08:30:00.000Z
 *                     status: AVAILABLE
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       403:
 *         description: User is not authorized to list drivers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: You do not have the permissions to list fleet drivers
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *               error: UNAUTHORIZED
 *               message: You do not have the permissions to list fleet drivers
 */
fleet_router.get('/fleet_drivers', verify_token, create_user_based_limiter(), fleet_controller.list_fleet_drivers);


/**
 * @openapi
 * /api/fleet/fleet_vehicles:
 *   get:
 *     tags: [Fleet]
 *     summary: List organization fleet vehicles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fleet vehicles successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, data]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fleet vehicles successfully retrieved
 *                 data:
 *                   type: object
 *                   required: [vehicles]
 *                   properties:
 *                     vehicles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FleetVehicle'
 *             example:
 *               message: Fleet vehicles successfully retrieved
 *               data:
 *                 vehicles:
 *                   - vehicle_id: vehicle-123
 *                     name: Delivery Van
 *                     registration: ABC-123
 *                     make: Toyota
 *                     model: Corolla
 *                     year: 2022
 *                     engine_type: null
 *                     fuel_type: PETROL
 *                     fuel_tank: 50
 *                     fuel_efficiency: 7.2
 *                     image_url: null
 *                     org_id: org-123
 *                     status: AVAILABLE
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       403:
 *         description: User is not authorized to list vehicles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *                   error: UNAUTHORIZED
 *                   message: You do not have permission to list fleet vehicles
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

fleet_router.get('/fleet_vehicles', verify_token, create_user_based_limiter(), fleet_controller.list_fleet_vehicles);

/**
 * @openapi
 * /api/fleet/fleet_trips:
 *   get:
 *     tags: [Fleet]
 *     summary: List fleet trips
 *     parameters:
 *       - name: driver_id
 *         in: query
 *         required: false
 *         description: Filter trips by driver. This is read from the query by the controller.
 *         schema:
 *           type: string
 *           format: uuid
 *         example: user-123
 *     responses:
 *       200:
 *         description: Fleet trips retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, data]
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fleet trips retrieved successfully
 *                 data:
 *                   type: object
 *                   required: [trips]
 *                   properties:
 *                     trips:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FleetTrip'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       403:
 *         description: User is not authorized to list these trips
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notMember:
 *                 value:
 *                   error: UNAUTHORIZED
 *                   message: Not a member of this organization
 *               driverAccess:
 *                 value:
 *                   error: UNAUTHORIZED
 *                   message: Not authorized to view another driver's trips
 *       422:
 *         description: Invalid trip filter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_START_DATE
 *               message: Invalid start date
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
fleet_router.get('/fleet_trips', verify_token, create_user_based_limiter(), fleet_controller.list_fleet_trips);



export default fleet_router;