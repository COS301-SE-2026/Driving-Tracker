import { Router } from "express";
import map_controller from "../controllers/map.controller"
import { verify_token } from "../middleware/auth";

const map_router = Router();

map_router.get("/token", verify_token, map_controller.get_map_token);

export default map_router;