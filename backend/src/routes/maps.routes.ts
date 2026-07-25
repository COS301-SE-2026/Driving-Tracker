import { Router } from "express";
import map_controller from "../controllers/map.controller"
import { verify_token } from "../middleware/auth";
import { map_token_limiter } from "../middleware/rate_limit";

const map_router = Router();

map_router.get("/token", verify_token, map_token_limiter, map_controller.get_map_token);

export default map_router;