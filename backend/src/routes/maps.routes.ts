import { Router } from "express";
import map_controller from "../controllers/map.controller"
import { verify_token } from "../middleware/auth";
import { create_map_token_limiter, create_trip_reading_limiter, create_user_based_limiter } from "../middleware/rate_limit";

const map_router = Router();

/**
 * @openapi
 * /api/maps/token:
 *   get:
 *     tags:
 *       - Maps
 *     summary: Get Azure Maps authentication token
 *     responses:
 *       200:
 *         description: Map token retrieved successfully
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
 *                   example: Map token retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/MapToken'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Can not access map services
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *             example:
 *               error: TOO_MANY_REQUESTS
 *               message: Too many map token requests, please try again later
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Failed to retrieve map token
 */
map_router.get("/token", verify_token, create_map_token_limiter(), map_controller.get_map_token);

/**
 * @openapi
 * /api/maps/search:
 *   get:
 *     tags:
 *       - Maps
 *     summary: Search for an address and get coordinates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Address to search for
 *         example: "123 Main Street, New York, NY"
 *     responses:
 *       201:
 *         description: Address search results retrieved successfully
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
 *                   example: name translated to cooridinates
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AddressSearchResult'
 *       400:
 *         description: Missing or invalid address parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: BAD_REQUEST
 *               message: Address query parameter is required
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Can not access map services
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Failed to translate address to coordinates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Failed to translate address
 */
map_router.get('/search',verify_token, create_user_based_limiter(), map_controller.search_address);

/**
 * @openapi
 * /api/maps/route:
 *   get:
 *     tags:
 *       - Maps
 *     summary: Get suggested route between two locations
 *     parameters:
 *       - in: query
 *         name: start_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Starting latitude coordinate
 *         example: 40.7128
 *       - in: query
 *         name: start_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Starting longitude coordinate
 *         example: -74.0060
 *       - in: query
 *         name: dest_lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Destination latitude coordinate
 *         example: 40.7580
 *       - in: query
 *         name: dest_lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Destination longitude coordinate
 *         example: -73.9855
 *     responses:
 *       200:
 *         description: Suggested route retrieved successfully
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
 *                   example: Suggested route retrieved
 *                 data:
 *                   $ref: '#/components/schemas/RouteSummary'
 *       400:
 *         description: Invalid coordinates provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_COORDINATES
 *               message: Invalid coordinates provided
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Can not access map services
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Failed to retrieve route from Azure Maps
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Failed to retrieve route
 */
map_router.get('/route', verify_token, create_trip_reading_limiter() ,map_controller.suggested_route);

/**
 * @openapi
 * /api/maps/nearby/pois:
 *   get:
 *     tags:
 *       - Maps
 *     summary: Get points of interest nearby a location
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of center point
 *         example: 40.7128
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of center point
 *         example: -74.0060
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [stops, petrol, rest_area, parking, all]
 *           default: stops
 *         description: Type of POI to search for
 *         example: stops
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 5000
 *         description: Search radius in meters
 *         example: 5000
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *         example: 10
 *     responses:
 *       200:
 *         description: Points of interest retrieved successfully
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
 *                   example: Pois succesfully retrieved
 *                 data:
 *                   type: object
 *                   required:
 *                     - pois
 *                   properties:
 *                     pois:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PointOfInterest'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Can not access map services
 *       422:
 *         description: Missing or invalid location coordinates or POI type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingLocation:
 *                 value:
 *                   error: MISSING_LOCATION
 *                   message: Location coordinates missing or invalid
 *               invalidType:
 *                 value:
 *                   error: INVALID_TYPE
 *                   message: Invalid poi type
 *       429:
 *         description: Rate limit triggered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *       500:
 *         description: Failed to fetch points of interest
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Failed to fetch pois
 */
map_router.get('/nearby/pois', verify_token, create_trip_reading_limiter() ,map_controller.get_nearby_pois);

/**
 * @openapi
 * /api/maps/address/reverse:
 *   get:
 *     tags:
 *       - Maps
 *     summary: Get address and road information from coordinates
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude coordinate
 *         example: 40.7128
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude coordinate
 *         example: -74.0060
 *     responses:
 *       200:
 *         description: Address data retrieved successfully
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
 *                   example: Address data succesfully retrieved
 *                 data:
 *                   type: object
 *                   required:
 *                     - address_data
 *                   properties:
 *                     address_data:
 *                       $ref: '#/components/schemas/AddressData'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Can not access map services
 *       422:
 *         description: Missing or invalid location coordinates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: MISSING_LOCATION
 *               message: Location coordinates missing or invalid
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
 *         description: Failed to fetch address information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INTERNAL_SERVER_ERROR
 *               message: Failed to fetch address
 */
map_router.get('/address/reverse', verify_token, create_trip_reading_limiter() ,map_controller.get_address_reverse);
export default map_router;