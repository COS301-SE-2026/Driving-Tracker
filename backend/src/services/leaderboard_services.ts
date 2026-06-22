import prisma from '../db/prisma';

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

export const leaderboard_services = {
  async get_leaderboard(params: get_leaderboard_params) {
    const { user_id, category, scope } = params;

    if (!user_id || !category || !scope) {
      throw new Error('Missing required fields');
    }

    const rows = await prisma.leaderboard.findMany({
      where: {
        category,
        scope,
      },
      include: {
        users: {
          select: {
            user_id: true,
            name: true,
            surname: true,
            username: true,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
    });

    const entries = rows.map((row: any, idx:any) => ({
      rank: idx + 1,
      user_id: row.user_id,
      display_name: `${row.users.name ?? row.users.username ?? ''} ${row.users.surname ?? ''}`.trim(),
      score: to_number(row.score ?? 0),
    }));

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

    const categories = await prisma.leaderboard.findMany({
      distinct: ['category'],
      select: {
        category: true
      }
    });

  const category_list = categories.map(item => item.category)
    .filter((category): category is string => category!== null)

    return {
      data: {
        categories: category_list
        }
      };
  }
};

export default leaderboard_services;
