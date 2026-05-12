import { Router, Request, Response } from "express";
import auth_controller from "../controllers/auth.controller";
import { verify_token } from '../middleware/auth';

const router = Router();

router.post("/register", auth_controller.register);
router.post("/login", auth_controller.login);
router.post("/logout", verify_token, auth_controller.logout);


export default router;