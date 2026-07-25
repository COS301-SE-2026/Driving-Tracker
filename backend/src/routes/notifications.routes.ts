import { Router } from "express";
import notifications_controller from "../controllers/notifications.controller"
import { verify_token } from "../middleware/auth";
import { user_based_limiter } from "../middleware/rate_limit";

const notifications_router = Router();

notifications_router.get("/", verify_token, user_based_limiter, notifications_controller.fetch_notifications);

export default notifications_router;