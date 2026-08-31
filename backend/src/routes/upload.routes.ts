import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { verify_token } from "../middleware/auth";
import { user_based_limiter } from "../middleware/rate_limit";
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

router.post("/profile", user_based_limiter, verify_token, handle_single_upload("image"),
upload_controller.upload_profile_picture);
router.post("/vehicle/:vehicle_id", user_based_limiter, verify_token, handle_single_upload("image"),
upload_controller.upload_vehicle_image);

router.get("/profile-picture/:user_id", verify_token, upload_controller.get_profile_picture);
router.get("/vehicle-image/:vehicle_id", verify_token, upload_controller.get_vehicle_image);

export default router;