import { Router, Request, Response } from "express";
import auth_controller from "../controllers/auth.controller";
import { verify_token } from '../middleware/auth';

const router = Router();

// Your routes here
export default router;