import prisma from '../db/prisma';

import {
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export interface get_leaderboard_params{
  user_id: string;
  category: string;
  scope: string;
}
// Helper function to safely convert Decimal or number values to number
function to_number(value: any): number | null {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    // If it's already a number, return it
    if (typeof value === 'number') {
        return value;
    }
    // Otherwise try to convert to number
    return Number(value);
}

export const LEADERBOARD_CATEGORIES = [
  'OVERALL',
  'ECO',
  'SAFETY',
 ] as const;

 export const LEADERBOARD_SCOPES = [
  'ALL_TIME',
  'MONTHLY',
  'WEEKLY',
 ] as const;

type LeaderboardCategory = typeof LEADERBOARD_CATEGORIES[number];
type LeaderboardScope = typeof LEADERBOARD_SCOPES[number];

const SCORE_FIELDS = {
  OVERALL: 'overall_score',
  ECO: 'eco_score',
  SAFETY: 'safety_score',
} as const;

function is_leaderboard_category(
  value: string,
): value is LeaderboardCategory {
  return LEADERBOARD_CATEGORIES.includes(value as LeaderboardCategory)
}

function is_leaderboard_scope(
  value: string,
): value is LeaderboardScope {
  return LEADERBOARD_SCOPES.includes(value as LeaderboardScope)
}

function get_scope_start(scope: LeaderboardScope): Date {
  const now = new Date();

  switch(scope){
    case 'WEEKLY':
      return startOfWeek(now);
    case 'MONTHLY':
      return startOfMonth(now);
    case 'ALL_TIME':
      return new Date('1970-01-01T00:00:00.000Z');
  }
}

export const leaderboard_services = {
  async get_leaderboard(params: get_leaderboard_params) {
    const { user_id, category, scope } = params;

    if (!user_id || !category || !scope) {
      throw new Error('Missing required fields');
    }

    if(!is_leaderboard_scope(scope)){
      throw new Error("Invalid Scope");
    }

    if(!is_leaderboard_category(category)){
      throw new Error("Invalid Category");
    }

    const period_start = get_scope_start(scope);

    const rows = await prisma.leaderboard.findMany({
      where: {
        category,
        scope,
        period_start
      },
      include: {
        users: {
          select: {
            user_id: true,
            name: true,
            surname: true,
            username: true,
            profile_picture_url: true,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
    });

    const allEntries = rows.map((row: any, idx:any) => ({
      rank: idx + 1,
      user_id: row.user_id,
      display_name: `${row.users.name ?? row.users.username ?? ''} ${row.users.surname ?? ''}`.trim(),
      score: to_number(row.score ?? 0),
      profile_picture_url: row.users.profile_picture_url? `upload/profile-picture/${row.user_id}` : null,
    }));

    const entries = allEntries.slice(0, 25);

    const myIndex = rows.findIndex((r:any) => r.user_id === user_id);
    const my_rank = myIndex >= 0 ? myIndex + 1 : null;
    const my_score = myIndex >= 0 ? to_number(rows[myIndex].score ?? 0) : 0;

    return {
      data: {
        category,
        scope,
        entries,
        my_rank,
        my_score,
      },
    };
  },

  async get_categories(){

    return {
      data: {
        categories: [...LEADERBOARD_CATEGORIES]
        }
      };
  },

  async get_scopes(){

    return {
      data: {
        scopes: [...LEADERBOARD_SCOPES]
        }
      };
  },

  async update_user_leaderboards(user_id: string){

    if(!user_id){
      throw new Error('Missing required fields');
    }

    const now = new Date();

    for(const scope of LEADERBOARD_SCOPES) {
      const period_start = get_scope_start(scope);

      const trip_date_filter = scope === 'ALL_TIME'?{} 
      : {
        end_time: {
          gte: period_start,
          lte: now,
        }
      };

      const averages = await prisma.trip_scores.aggregate({
        where: {
          trips:{
            user_id,
            status: 'COMPLETED',
            ...trip_date_filter, 
          },
        },
        _avg: {
          safety_score: true,
          eco_score: true,
          overall_score: true,
        },
      });

      for(const category of LEADERBOARD_CATEGORIES){
        const score_field = SCORE_FIELDS[category];
        const average_score = averages._avg[score_field];

        if(average_score === null || average_score === undefined){
          continue;
        }

        const score = Number(Number(average_score.toFixed(2)));

        await prisma.leaderboard.upsert({
          where: {
            user_id_category_scope_period_start: {
              user_id,
              category,
              scope,
              period_start,
            },
          },
          update: {
            score,
            updated_at: now,
          },
          create: {
            user_id,
            category,
            scope,
            score,
            period_start
          },
        });
      }
    }

  }
};

export default leaderboard_services;
