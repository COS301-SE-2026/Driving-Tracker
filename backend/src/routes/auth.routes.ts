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

auth_router.post("/register", register_limiter,auth_controller.register);
auth_router.post("/login", login_limiter_sliding, auth_controller.login);
auth_router.post("/logout", verify_token, user_based_limiter, auth_controller.logout);
auth_router.post("/refresh", refresh_limiter ,auth_controller.refresh);
auth_router.get("/profile", verify_token, user_based_limiter, auth_controller.get_profile);
auth_router.get("/verify_email", auth_controller.verify_email);
auth_router.post("/forgot_password", forgot_password_limiter, auth_controller.forgot_password);
auth_router.post("/reset_password", reset_password_limiter, auth_controller.reset_password);
auth_router.get("/reset_password_link", auth_controller.reset_password_link);

export default auth_router;