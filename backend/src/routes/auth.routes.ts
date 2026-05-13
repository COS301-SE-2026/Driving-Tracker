import { Router} from "express";
import auth_controller from "../controllers/auth.controller";
import { verify_token } from '../middleware/auth';

const auth_router = Router();

auth_router.post("/register", auth_controller.register);
auth_router.post("/login", auth_controller.login);
auth_router.post("/logout", verify_token, auth_controller.logout);


export default auth_router;