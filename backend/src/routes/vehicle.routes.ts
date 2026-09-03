import {Router, request, response } from "express";
import * as vehicle from "../controllers/vehicle.controller";
import {verify_token} from '../middleware/auth';
import { create_user_based_limiter } from "../middleware/rate_limit";

const vehicle_router = Router();
//the way the route is called in the front end for example rout.__(what ever it is post,patch...)("/trips/...", ...)look at mp for reference
//will structure in crud operations 

//Create
/**
 * @openapi
 * /api/vehicle/assign_vehicle:
 *   post:
 *     tags:
 *       - Vehicles
 *     summary: Assign a new vehicle to the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - make
 *               - model
 *               - year
 *               - fuel_type
 *               - fuel_tank
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Car
 *               registration:
 *                 type: string
 *                 example: "CA 1234"
 *               make:
 *                 type: string
 *                 example: Toyota
 *               model:
 *                 type: string
 *                 example: Corolla
 *               year:
 *                 type: integer
 *                 example: 2020
 *               fuel_type:
 *                 type: string
 *                 example: Petrol
 *               fuel_tank:
 *                 type: number
 *                 example: 50
 *     responses:
 *       201:
 *         description: Vehicle assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleRecord'
 *       400:
 *         description: Missing required vehicle data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: MISSING_REQUIRED_FIELDS
 *               message: Missing required fields
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized
 *       404:
 *         description: User not found
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
 *               message: Internal server error
 */
 vehicle_router.post("/assign_vehicle",verify_token, create_user_based_limiter(), vehicle.assign_vehicle);
//read basically get 
/**
 * @openapi
 * /api/vehicle/get_all_vehicles:
 *   get:
 *     tags:
 *       - Vehicles
 *     summary: Get all vehicles for the authenticated user
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VehicleSummary'
 *       403:
 *         description: Unauthorized or missing user context
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized
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
 *               message: Internal server error
 */
vehicle_router.get("/get_all_vehicles", verify_token, create_user_based_limiter(), vehicle.get_all_vehicles);


/**
 * @openapi
 * /api/vehicle/{vehicle_id}:
 *   delete:
 *     tags:
 *       - Vehicles
 *     summary: Remove a vehicle owned by the user
 *     parameters:
 *       - in: path
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *         example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *     responses:
 *       200:
 *         description: Vehicle removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle removed successfully
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized
 *       404:
 *         description: Vehicle not found or not owned by the user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_VEHICLE
 *               message: Vehicle not found or not owned by you
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
vehicle_router.delete("/:vehicle_id", verify_token, vehicle.remove_vehicle);

/**
 * @openapi
 * /api/vehicle/{vehicle_id}/name:
 *   patch:
 *     tags:
 *       - Vehicles
 *     summary: Update the display name of a vehicle
 *     parameters:
 *       - in: path
 *         name: vehicle_id
 *         required: true
 *         schema:
 *           type: string
 *         example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
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
 *                 example: Family SUV
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VehicleRecord'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized
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
vehicle_router.patch("/:vehicle_id/name", verify_token, vehicle.update_name);
//read fuel analytics
vehicle_router.get("/fuel_analytics", verify_token, create_user_based_limiter(), vehicle.get_fuel_analytics);

vehicle_router.get("/fuel_comparison", verify_token, create_user_based_limiter(), vehicle.get_fuel_comparison);
export default vehicle_router;