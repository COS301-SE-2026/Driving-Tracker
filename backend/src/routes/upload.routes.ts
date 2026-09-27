import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { verify_token } from "../middleware/auth";
import { create_user_based_limiter } from "../middleware/rate_limit";
import { upload } from "../middleware/upload";
import { upload_controller } from "../controllers/upload.controller";

const router = Router();

function handle_single_upload(field_name: string){
    return(req: Request, res: Response, next: NextFunction) => {
        upload.single(field_name)(req as any, res as any, (err: unknown) => {
            if(err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"){
                res.status(400).json({ error: "FILE_TOO_LARGE", message: "Image must be 10MB or smaller" });
                return;
            }

            if(err){
                res.status(400).json({ error: "INVALID_FILE_TYPE", message: "Only jpeg, jpg, png, and webp images are allowed"});
                return;
            }

            next();
        });
    };
}

router.post("/profile", create_user_based_limiter(), verify_token, handle_single_upload("image"),
upload_controller.upload_profile_picture);
router.post("/vehicle/:vehicle_id", create_user_based_limiter(), verify_token, handle_single_upload("image"),
upload_controller.upload_vehicle_image);

router.get("/profile-picture/:user_id", verify_token, upload_controller.get_profile_picture);
router.get("/vehicle-image/:vehicle_id", verify_token, upload_controller.get_vehicle_image);

/**
 * @openapi
 * /upload/fleet-vehicle/{vehicle_id}:
 *   post:
 *     tags:
 *       - Fleet
 *     summary: Upload a fleet vehicle image
 *     description: Uploads or replaces the image for an organization fleet vehicle.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: vehicle_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: vehicle-123
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Fleet vehicle image uploaded successfully
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
 *                   example: Fleet vehicle image uploaded successfully
 *                 data:
 *                   type: object
 *                   required:
 *                     - image_url
 *                   properties:
 *                     image_url:
 *                       type: string
 *                       example: upload/fleet-vehicle-image/vehicle-123
 *       400:
 *         description: No image or unsupported image type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               noFile:
 *                 value:
 *                   error: NO_FILE_PROVIDED
 *                   message: No image file was provided
 *               invalidType:
 *                 value:
 *                   error: INVALID_FILE_TYPE
 *                   message: Only jpeg, jpg, png, and webp images are allowed
 *               tooLarge:
 *                 value:
 *                   error: FILE_TOO_LARGE
 *                   message: Image must be 10MB or smaller
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       403:
 *         description: User does not have permission to manage the fleet vehicle
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: FORBIDDEN
 *               message: You do not have permission to manage fleet vehicles
 *       404:
 *         description: Fleet vehicle was not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: VEHICLE_NOT_FOUND
 *               message: Fleet vehicle not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/fleet-vehicle/:vehicle_id", create_user_based_limiter(), verify_token, handle_single_upload("image"), upload_controller.upload_fleet_vehicle_image,);

/**
 * @openapi
 * /upload/fleet-vehicle-image/{vehicle_id}:
 *   get:
 *     tags:
 *       - Fleet
 *     summary: Download a fleet vehicle image
 *     description: Downloads the stored image for an organization fleet vehicle.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: vehicle_id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: vehicle-123
 *     responses:
 *       200:
 *         description: Fleet vehicle image
 *         content:
 *           image/jpeg: {}
 *           image/png: {}
 *           image/webp: {}
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: UNAUTHORIZED
 *       404:
 *         description: Fleet vehicle or image was not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               vehicleNotFound:
 *                 value:
 *                   error: VEHICLE_NOT_FOUND
 *                   message: Fleet vehicle not found
 *               imageNotFound:
 *                 value:
 *                   error: NOT_FOUND
 *                   message: This fleet vehicle has no image
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/fleet-vehicle-image/:vehicle_id", verify_token, upload_controller.get_fleet_vehicle_image,);

export default router;