import { Router} from "express";
import {verify_token} from '../middleware/auth';
import user_devices_controller from "../controllers/user_devices.controller";
import { register_fcm_token_limiter } from "../middleware/rate_limit";


const user_devices_router = Router();

/**
 * @openapi
 * /api/devices/fcm_token:
 *   post:
 *     tags:
 *       - Devices
 *     summary: Register an FCM token for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcm_token
 *             properties:
 *               fcm_token:
 *                 type: string
 *                 example: "d2JjZ2E..." 
 *     responses:
 *       201:
 *         description: Device token registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registered successfully
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized
 *       422:
 *         description: Missing or invalid FCM token payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: MISSING_FCM_TOKEN
 *               message: Missing fcm token
 *       429:
 *         description: Too many FCM registration attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *             example:
 *               error: TOO_MANY_REQUESTS
 *               message: Too many fcm token requests, please try again later
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               generic:
 *                 value:
 *                   error: INTERNAL_SERVER_ERROR
 *               extended:
 *                 value:
 *                   error: INTERNAL_SERVER_ERROR
 *                   message: Could not register device token
 */
user_devices_router.post("/fcm_token", verify_token, register_fcm_token_limiter, user_devices_controller.register_device_token);

export default user_devices_router;