import { Router } from "express";
import { verify_token } from "../middleware/auth";
import user_controller from "../controllers/user_controller";

const user_router = Router();

user_router.post("/users/me/delete", verify_token, user_controller.delete_account);

export default user_router;