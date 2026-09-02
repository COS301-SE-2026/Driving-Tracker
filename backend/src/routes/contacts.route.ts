import {Router} from "express";
import contacts_controller from "../controllers/contacts.controller";
import {verify_token} from '../middleware/auth';
import { create_user_based_limiter } from "../middleware/rate_limit";

const contacts_router = Router();
/**
 * routes are relative to the prefix this router is mounted at
 * E.g. if index.ts does app.use("/contacts", contacts_router),
 * then contacts_router/post("/") === POST /contacts
 */

//add trusted contact for logged-in user

/**
 * @openapi
 * /api/contacts:
 *   post:
 *     tags:
 *       - Contacts
 *     summary: Add a trusted contact by identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username, email, or user_id of the contact to add
 *                 example: johndoe123
 *     responses:
 *       201:
 *         description: Trusted contact created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/TrustedContactCreated'
 *       400:
 *         description: Invalid identifier or cannot add user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: CANNOT_ADD_USER
 *               message: Cannot add this user as a contact
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
 *       409:
 *         description: Contact already added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: ALREADY_TRUSTED_CONTACT
 *               message: contact already added
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
 *   get:
 *     tags:
 *       - Contacts
 *     summary: Get all approved trusted contacts for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contacts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *                 - message
 *               properties:
 *                 data:
 *                   type: object
 *                   required:
 *                     - contacts
 *                   properties:
 *                     contacts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TrustedContact'
 *                 message:
 *                   type: string
 *                   example: Contacts successfully retrieved
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
 */
contacts_router.post("/", verify_token, create_user_based_limiter(), contacts_controller.create_contact);
//lists all trusted contacts for logged in user
contacts_router.get("/", verify_token, create_user_based_limiter(), contacts_controller.get_contacts);

//creates alert for event and notifies selected contacts
/**
 * @openapi
 * /api/contacts/alerts:
 *   post:
 *     tags:
 *       - Contacts
 *     summary: Alert trusted contacts about a trip event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_type
 *               - event_id
 *               - contacts
 *             properties:
 *               event_type:
 *                 type: string
 *                 example: HARSH_BRAKE
 *               event_id:
 *                 type: string
 *                 format: uuid
 *               message:
 *                 type: string
 *                 nullable: true
 *                 example: Harsh brake detected during trip
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - contact_id
 *                   properties:
 *                     contact_id:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       200:
 *         description: Contacts successfully alerted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Contacts successfully alerted
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: BAD_REQUEST
 *               message: Invalid request body
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       403:
 *         description: Cannot access these contacts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: CANNOT_ACCESS_CONTACTS
 *               message: Cannot access these contacts
 *       404:
 *         description: Contact or event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               contactNotFound:
 *                 value:
 *                   error: CONTACT_NOT_FOUND
 *                   message: Cannot find contact
 *               eventNotFound:
 *                 value:
 *                   error: EVENT_NOT_FOUND
 *                   message: Cannot find event
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
contacts_router.post("/alerts", verify_token, create_user_based_limiter(), contacts_controller.alert_contacts);

//persists location sharing for a trip until end
/**
 * @openapi
 * /api/contacts/share_location:
 *   post:
 *     tags:
 *       - Contacts
 *     summary: Share trip location with trusted contacts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trip_id
 *               - contacts
 *             properties:
 *               trip_id:
 *                 type: string
 *                 format: uuid
 *                 example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *               contacts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - contact_id
 *                   properties:
 *                     contact_id:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       201:
 *         description: Location successfully shared with contacts
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
 *                   example: Location successfully shared
 *                 data:
 *                   $ref: '#/components/schemas/LocationShareResponse'
 *       400:
 *         description: Invalid request or no contacts provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noContacts:
 *                 value:
 *                   error: NO_CONTACTS_PROVIDED
 *                   message: Contact list is empty
 *               invalidTrip:
 *                 value:
 *                   error: TRIP_NOT_FOUND
 *                   message: Cannot find trip
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       403:
 *         description: Cannot share with non-trusted contacts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: NOT_TRUSTED_CONTACT
 *               message: Cannot share location with non-trusted contacts
 *       404:
 *         description: Trip or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               tripNotFound:
 *                 value:
 *                   error: TRIP_NOT_FOUND
 *                   message: Cannot find trip
 *               userNotFound:
 *                 value:
 *                   error: USER_NOT_FOUND
 *                   message: Could not find user
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
contacts_router.post("/share_location", verify_token, create_user_based_limiter(), contacts_controller.share_location);

//reponds to trusted contact request and changes the status
/**
 * @openapi
 * /api/contacts/{contact_id}/respond:
 *   patch:
 *     tags:
 *       - Contacts
 *     summary: Respond to a trusted contact request
 *     parameters:
 *       - in: path
 *         name: contact_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - APPROVED
 *                   - DENIED
 *                 example: APPROVED
 *     responses:
 *       200:
 *         description: Contact request response recorded successfully
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
 *                   example: Status updated successfully
 *                 data:
 *                   type: object
 *                   required:
 *                     - contact_id
 *                   properties:
 *                     contact_id:
 *                       type: string
 *                       format: uuid
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       422:
 *         description: Invalid status value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_STATUS
 *               message: Status should be APPROVED or DENIED
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
 *               message: Could not respond to trusted contact request
 */
contacts_router.patch("/:contact_id/respond", verify_token, create_user_based_limiter(), contacts_controller.respond_to_contact_request);

//gets trusted contact requests received by a user
/**
 * @openapi
 * /api/contacts/received_requests:
 *   get:
 *     tags:
 *       - Contacts
 *     summary: Get pending trusted contact requests received by the authenticated user
 *     responses:
 *       200:
 *         description: Received contact requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *                 - message
 *               properties:
 *                 data:
 *                   type: object
 *                   required:
 *                     - requests
 *                   properties:
 *                     requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContactRequest'
 *                 message:
 *                   type: string
 *                   example: Fetched received contact requests
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
 *               message: Could not get receieved trusted contact requests
 */
contacts_router.get("/received_requests", verify_token, create_user_based_limiter(), contacts_controller.get_receieved_contact_requests);

export default contacts_router;