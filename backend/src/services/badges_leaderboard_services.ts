import prisma from '../db/prisma';


export interface evaluate_badge{
    user_id: string;
    trip_id: string;
};
//helper function used to compare if the threshold was met 
type MetricMap = Record<string, number>;

function compare(operator: string | null | undefined, actual: number, threshold: number) {
  switch (operator) {
    case ">":
      return actual > threshold;
    case ">=":
      return actual >= threshold;
    case "<":
      return actual < threshold;
    case "<=":
      return actual <= threshold;
    case "=":
    case "==":
      return actual === threshold;
    case "!=":
      return actual !== threshold;
    default:
      return false;
  }
}

export const badges_leaderboard_services = {
    async evaluate(data: evaluate_badge){
        if(!data.user_id || !data.trip_id){
            throw new Error("Missing required fields");
        }
        const trip = await prisma.trips.findUnique({
            where: { trip_id: data.trip_id },
            include: {
                trip_scores: {
                    select: {
                        safety_score: true,
                        eco_score: true,
                        overall_score: true,
                    },
                    },
                    trip_events: {
                        select: {
                            type: true,
                        },
                    },
                    trip_location_shares: {
                        select: {
                            share_id: true,
                        },
                },
            },
        });
        if(!trip){
            throw new Error("Trip not found");
        }
        if(trip.user_id !== data.user_id){
            throw new Error("You do not own this trip");
        }
        const trip_score = trip.trip_scores[0];
    }

};