import { Router} from "express";
import auth_controller from "../controllers/auth.controller";
import { verify_token } from '../middleware/auth';
import { 
    register_limiter, 
    refresh_limiter, 
    user_based_limiter, 
    login_limiter_sliding, 
    forgot_password_limiter,
    reset_password_limiter
} from "../middleware/rate_limit";

const auth_router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     security: []
 *     summary: Register a new user
 *     description: Creates a new user account. Returns only a success message on success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *               - name
 *               - surname
 *               - phone_number
 *               - dob
 *               - consent_status
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               username:
 *                 type: string
 *                 example: johndoe123
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPass123!
 *               name:
 *                 type: string
 *                 example: John
 *               surname:
 *                 type: string
 *                 example: Doe
 *               phone_number:
 *                 type: string
 *                 example: "0123456789"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1995-06-15"
 *               consent_status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful. Please verify your email before logging in.
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *                 - message
 *               properties:
 *                 error:
 *                   type: string
 *                   example: INVALID_USERNAME
 *                 message:
 *                   type: string
 *                   example: Username must have atleast 3 characters
 *       409:
 *         description: Email or username conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *                 - message
 *               properties:
 *                 error:
 *                   type: string
 *                   example: INVALID_EMAIL
 *                 message:
 *                   type: string
 *                   example: You already have an account with this email address
  *       429:
 *         description: Too many registration attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *             example:
 *               error: TOO_MANY_ATTEMPTS
 *               message: Too many registration attempts, please try again later
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *               properties:
 *                 error:
 *                   type: string
 *                   example: INTERNAL_SERVER_ERROR
 */
auth_router.post("/register", register_limiter,auth_controller.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     security: []
 *     summary: Log in a user
 *     description: Authenticates a user by email or username and returns a JWT and refresh token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: johndoe123
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPass123!
 *     responses:
 *       201:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - token
 *                 - refresh_token
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refresh_token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCredentials:
 *                 value:
 *                   error: INVALID_CREDENTIALS
 *                   message: Incorrect username/email
 *               invalidPassword:
 *                 value:
 *                   error: INVALID_PASSWORD
 *                   message: Password incorrect
 *       403:
 *         description: Extended auth error such as email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: EMAIL_NOT_VERIFIED
 *               message: Please verify your email address before logging in.
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *             example:
 *               error: TOO_MANY_ATTEMPTS
 *               message: Too many login attempts, please try again later
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
auth_router.post("/login", login_limiter_sliding, auth_controller.login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Log out the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       429:
 *         description: Too many logout attempts
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
 *               message: Failed to log out
 */
auth_router.post("/logout", verify_token, user_based_limiter, auth_controller.logout);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh the access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - token
 *                 - refresh_token
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refresh_token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: MISSING_REFRESH_TOKEN
 *               message: Refresh token required
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *               message: Invalid refresh token
 *       429:
 *         description: Too many refresh attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *             example:
 *               error: TOO_MANY_ATTEMPTS
 *               message: Too many refresh attempts, please try again later
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
auth_router.post("/refresh", refresh_limiter ,auth_controller.refresh);
/**
 * @openapi
 * /api/auth/profile:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                   properties:
 *                     user_id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     name:
 *                       type: string
 *                     surname:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone_number:
 *                       type: string
 *                     dob:
 *                       type: string
 *                       format: date
 *                     trip_count:
 *                       type: integer
 *                     badge_count:
 *                       type: integer
 *                     vehicle_count:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: Profile retrieved successfully
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
 *         description: Too many logout attempts
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
 *               message: Failed to retrieve profile
 */
auth_router.get("/profile", verify_token, user_based_limiter, auth_controller.get_profile);

/**
 * @openapi
 * /api/auth/verify_email:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Verify a user's email address
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       302:
 *         description: Redirects to app deep link after successful verification
 *       400:
 *         description: Missing or invalid verification token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_TOKEN
 *               message: Verification token is required
 *       422:
 *         description: Validation error for the verification token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_TOKEN
 *               message: Verification token is required
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
auth_router.get("/verify_email", auth_controller.verify_email);

/**
 * @openapi
 * /api/auth/forgot_password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request a password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Reset email was sent if the account exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reset email sent if account exists
 *       429:
 *         description: Too many password reset requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *             example:
 *               error: TOO_MANY_ATTEMPTS
 *               message: Too many password reset requests, please try again later
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
auth_router.post("/forgot_password", forgot_password_limiter, auth_controller.forgot_password);

/**
 * @openapi
 * /api/auth/reset_password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Reset the user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 example: reset_token_here
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewStrongPass123!
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - message
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_TOKEN
 *               message: Invalid or expired token
 *       422:
 *         description: Validation error for the password or token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidToken:
 *                 value:
 *                   error: INVALID_TOKEN
 *                   message: Reset token is required
 *               invalidPassword:
 *                 value:
 *                   error: INVALID_PASSWORD
 *                   message: Password must contain at least one uppercase letter
 *       429:
 *         description: Too many reset requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 *             example:
 *               error: TOO_MANY_ATTEMPTS
 *               message: Too many reset requests, please try again later
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
auth_router.post("/reset_password", reset_password_limiter, auth_controller.reset_password);

/**
 * @openapi
 * /api/auth/reset_password_link:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Redirect to the app reset password screen
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     responses:
 *       302:
 *         description: Redirects to the mobile app reset-password deep link
 *       400:
 *         description: Missing reset token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: INVALID_TOKEN
 *               message: Reset token is required
 */
auth_router.get("/reset_password_link", auth_controller.reset_password_link);

export default auth_router;