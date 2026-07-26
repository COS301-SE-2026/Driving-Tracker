import { Router } from 'express';
import leaderboard_controller from '../controllers/leaderboard.controller';
import { verify_token } from '../middleware/auth';
import { user_based_limiter } from '../middleware/rate_limit';

const leaderboard_router = Router();


leaderboard_router.get('/', verify_token, user_based_limiter, leaderboard_controller.get_leaderboard);
leaderboard_router.get('/categories', verify_token, user_based_limiter, leaderboard_controller.get_categories);
leaderboard_router.get('/scopes', verify_token, user_based_limiter, leaderboard_controller.get_scopes);

export default leaderboard_router;
