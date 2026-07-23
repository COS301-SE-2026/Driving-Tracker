import { Router} from "express";
import {verify_token} from '../middleware/auth';
import user_devices_controller from "../controllers/user_devices.controller";


const user_devices_router = Router();


user_devices_router.post("/fcm_token", verify_token, user_devices_controller.register_device_token);

export default user_devices_router;