import { Router } from "express";
import notifications_controller from "../controllers/notifications.controller"
import { verify_token } from "../middleware/auth";
import { user_based_limiter } from "../middleware/rate_limit";

const notifications_router = Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Fetch notifications for the authenticated user
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                   example: Notifications retrieved successfully
 *                 data:
 *                   type: object
 *                   required:
 *                     - notifications
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/NotificationItem'
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized
 *       429:
 *         description: Too many requests for this user
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
 *               message: Could not fetch notifications
 */
notifications_router.get("/", verify_token, user_based_limiter, notifications_controller.fetch_notifications);

/**
 * @openapi
 * /api/notifications/delete:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete all notifications for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications deleted successfully
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
 *                   example: Notifications deleted successfully
 *                 data:
 *                   type: object
 *                   required:
 *                     - deleted_count
 *                   properties:
 *                     deleted_count:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Unauthorized
 *       429:
 *         description: Too many requests for this user
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
 *               message: Could not delete notifications
 */
notifications_router.delete("/delete", verify_token, user_based_limiter, notifications_controller.delete_notifications);

export default notifications_router;