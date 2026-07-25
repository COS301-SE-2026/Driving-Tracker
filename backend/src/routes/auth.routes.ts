import { Router} from "express";
import auth_controller from "../controllers/auth.controller";
import { verify_token } from '../middleware/auth';
import { login_limiter, register_limiter, refresh_limiter, user_based_limiter } from "../middleware/rate_limit";

const auth_router = Router();

auth_router.post("/register", register_limiter,auth_controller.register);
auth_router.post("/login", login_limiter, auth_controller.login);
auth_router.post("/logout", verify_token, user_based_limiter, auth_controller.logout);
auth_router.post("/refresh", refresh_limiter ,auth_controller.refresh);


export default auth_router;