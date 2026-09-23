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


fleet_router.post("/add_fleet_vehicle",verify_token, create_user_based_limiter(), fleet_controller.add_fleet_vehicle);

fleet_router.patch("/:trip_id/start_scheduled_trip", verify_token, create_user_based_limiter(), fleet_controller.start_scheduled_trip);

fleet_router.post("/add_driver", verify_token, create_user_based_limiter(), fleet_controller.add_driver);

fleet_router.get('/fleet_drivers', verify_token, create_user_based_limiter(), fleet_controller.list_fleet_drivers);

fleet_router.get('/fleet_vehicles', verify_token, create_user_based_limiter(), fleet_controller.list_fleet_vehicles);

fleet_router.get('/fleet_trips', verify_token, create_user_based_limiter(), fleet_controller.list_fleet_trips);



export default fleet_router;