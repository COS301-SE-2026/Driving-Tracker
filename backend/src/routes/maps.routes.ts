import { Router } from "express";
import map_controller from "../controllers/map.controller"
import { verify_token } from "../middleware/auth";
import { map_token_limiter } from "../middleware/rate_limit";

const map_router = Router();

map_router.get("/token", verify_token, map_token_limiter, map_controller.get_map_token);
map_router.get('/search',verify_token,map_controller.search_address);

map_router.get('/route', verify_token, map_controller.suggested_route);
export default map_router;