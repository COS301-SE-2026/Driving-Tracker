import {Router, request, response } from "express";
import badge_leaderboard_controller from "../controllers/badges_leaderboard.controller";
import {verify_token} from '../middleware/auth';
import { user_based_limiter } from "../middleware/rate_limit";

const badges_leaderBoard_router = Router();

 

//the way the route is called in the front end for example rout.__(what ever it is post,patch...)("/trips/...", ...)look at mp for reference
//will structure in crud operations 

//post
/**
 * @openapi
 * /api/badges/evaluate:
 *   post:
 *     tags:
 *       - Badges
 *     summary: Evaluate badges for a completed trip
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: object
 *                 required:
 *                   - user_id
 *                   - trip_id
 *                 properties:
 *                   user_id:
 *                     type: string
 *                     format: uuid
 *                   trip_id:
 *                     type: string
 *                     format: uuid
 *     responses:
 *       200:
 *         description: Badge evaluation completed successfully
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
 *                   example: Badge evaluation complete
 *                 data:
 *                   $ref: '#/components/schemas/BadgeEvaluationResponse'
 *       401:
 *         description: User not authenticated or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notAuthenticated:
 *                 value:
 *                   error: UNAUTHORIZED
 *               mismatchedUser:
 *                 value:
 *                   error: UNAUTHORIZED
 *       404:
 *         description: Trip not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: NOT_FOUND
 *               message: Trip not found
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
 *               message: Could not evaluate badges
 */
badges_leaderBoard_router.post("/evaluate", verify_token, user_based_limiter, badge_leaderboard_controller.evaluate_badges); 

//read basically get
 /**
 * @openapi
 * /api/badges:
 *   get:
 *     tags:
 *       - Badges
 *     summary: Get all earned badges for the authenticated user
 *     responses:
 *       200:
 *         description: User badges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/UserBadgesResponse'
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
 *               message: Could not retrieve badges
 */
badges_leaderBoard_router.get("/",verify_token, user_based_limiter, badge_leaderboard_controller.get_badges);

/**
 * @openapi
 * /api/badges/definitions:
 *   get:
 *     tags:
 *       - Badges
 *     summary: Get all badge definitions and their criteria
 *     responses:
 *       200:
 *         description: Badge definitions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/BadgeDefinitionsResponse'
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
 *               message: Could not retrieve badge definitions
 */
badges_leaderBoard_router.get("/definitions", verify_token, user_based_limiter, badge_leaderboard_controller.get_badge_definitions);
//delete 

//Update 

export default badges_leaderBoard_router;