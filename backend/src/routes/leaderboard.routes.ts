import { Router } from 'express';
import leaderboard_controller from '../controllers/leaderboard.controller';
import { verify_token } from '../middleware/auth';
import { create_user_based_limiter } from '../middleware/rate_limit';

const leaderboard_router = Router();


/**
 * @openapi
 * /api/leaderboard:
 *   get:
 *     tags:
 *       - Leaderboard
 *     summary: Get leaderboard rankings for a specific category and scope
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Leaderboard category
 *         example: safety
 *       - in: query
 *         name: scope
 *         required: true
 *         schema:
 *           type: string
 *         description: Scope of the leaderboard
 *         example: global
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/LeaderboardResponse'
 *       400:
 *         description: Missing or invalid category or scope parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: BAD_REQUEST
 *               message: Missing category or scope query parameters
 *       401:
 *         description: User not authenticated
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Could not retrieve leaderboard
 */
leaderboard_router.get('/', verify_token, create_user_based_limiter(), leaderboard_controller.get_leaderboard);

/**
 * @openapi
 * /api/leaderboard/categories:
 *   get:
 *     tags:
 *       - Leaderboard
 *     summary: Get all available leaderboard categories
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/CategoriesResponse'
 *       401:
 *         description: User not authenticated
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Could not retrieve categories
 */
leaderboard_router.get('/categories', verify_token, create_user_based_limiter(), leaderboard_controller.get_categories);

/**
 * @openapi
 * /api/leaderboard/scopes:
 *   get:
 *     tags:
 *       - Leaderboard
 *     summary: Get all available leaderboard scopes
 *     responses:
 *       200:
 *         description: Scopes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ScopesResponse'
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
 *               message: Could not retrieve scopes
 */
leaderboard_router.get('/scopes', verify_token, create_user_based_limiter(), leaderboard_controller.get_scopes);

export default leaderboard_router;
