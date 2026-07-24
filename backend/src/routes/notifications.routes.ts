import { Router } from "express";
import notifications_controller from "../controllers/notifications.controller"
import { verify_token } from "../middleware/auth";

const notifications_router = Router();

notifications_router.get("/", verify_token, notifications_controller.fetch_notifications);

export default notifications_router;