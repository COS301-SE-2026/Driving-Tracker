import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { leaderboard_services } from '../services/leaderboard_services';

function get_user_id(req: AuthRequest): string | null {
  return req.user?.sub ?? null;
}

const leaderboard_controller = {
  
  async get_leaderboard(req: AuthRequest, res: Response) {
    try {
      const user_id = get_user_id(req);
      if (!user_id) {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
      }

      const { category, scope } = req.query ?? {};

      if (!category || typeof category !== 'string' || !scope || typeof scope !== 'string') {
        return res.status(400).json({ error: 'BAD_REQUEST', message: 'Missing category or scope query parameters' });
      }

      const result = await leaderboard_services.get_leaderboard({ user_id, category, scope });

      return res.status(200).json(result);
    } catch (e: any) {
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Could not retrieve leaderboard' });
    }
  },
};

export default leaderboard_controller;
