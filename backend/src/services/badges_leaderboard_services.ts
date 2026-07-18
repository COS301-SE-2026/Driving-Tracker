import prisma from '../db/prisma';


export interface evaluate_badge{
    user_id: string;
    trip_id: string;
};
export interface get_badges{
    user_id: string;
}
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
        //you want to evaluate if all the trips are met , check all the events that have happened 

        
        const event_counts = trip.trip_events.reduce(
        (acc: any , event: any) => {
            const type = event.type ?? "";
            acc.total_events += 1;
            if (type === "HARSH_BRAKE") {
                acc.harsh_brake_count += 1;
            }
            if (type === "HARSH_ACCELERATION") {
                acc.harsh_acceleration_count += 1;
            }
            if (type === "SHARP_CORNER"){
                acc.sharp_corner_count += 1;
            } 
            if (type === "CRASH" || type === "CRASH_LIKE") {
                acc.crash_count += 1;
            }
            return acc;
        },
        {
            total_events: 0,
            harsh_brake_count: 0,
            harsh_acceleration_count: 0,
            sharp_corner_count: 0,
            crash_count: 0,
        }
        );

        const user_trip_count = await prisma.trips.count({
        where: {
            user_id: data.user_id,
            status: "COMPLETED",
        },
        });

        const metrics: MetricMap = {
            distance_km: Number(trip.distance_km ?? 0),
            duration_minutes: Number(trip.duration_minutes ?? 0),
            fuel_estimate: Number(trip.fuel_estimate ?? 0),
            safety_score: Number(trip_score?.safety_score ?? 0),
            eco_score: Number(trip_score?.eco_score ?? 0),
            overall_score: Number(trip_score?.overall_score ?? 0),
            total_events: event_counts.total_events,
            harsh_brake_count: event_counts.harsh_brake_count,
            harsh_acceleration_count: event_counts.harsh_acceleration_count,
            sharp_corner_count: event_counts.sharp_corner_count,
            crash_count: event_counts.crash_count,
            shared_trip_count: trip.trip_location_shares.length,
            completed_trip_count: user_trip_count,
        };

        const badges = await prisma.badges.findMany({
            include: {
                badge_criteria: true,
            },
        });
        const newly_earned_badges = [];

        for (const badge of badges) {
        const criteria = badge.badge_criteria;

        if (criteria.length === 0) {
            continue;
        }

        const meets_all_criteria = criteria.every((criterion: any) => {
            const metric_name = criterion.metric ?? "";
            const actual = metrics[metric_name];
            const threshold = Number(criterion.threshold ?? criterion.target ?? 0);

            if (actual === undefined) {
                return false;
            }

            return compare(criterion.operator, actual, threshold);
        });
        if (!meets_all_criteria) {
            continue;
        }

        const existing = await prisma.user_badges.findUnique({
            where: {
                user_id_badge_id: {
                    user_id: data.user_id,
                    badge_id: badge.badge_id,
                },
            },
        });

        if (existing) {
            continue;
        }
        const earned = await prisma.user_badges.create({
            data: {
                user_id: data.user_id,
                badge_id: badge.badge_id,
            },
            include: {
                badges: true,
            },
        });

        newly_earned_badges.push({
            badge_id: earned.badge_id,
            name: earned.badges.name,
            description: earned.badges.description,
            category: earned.badges.category,
            earned_at: earned.earned_at,
            icon_url: earned.badges.icon_url,
        });
        }
        return{
            data:{
                evaluated: true,
                new_badges: newly_earned_badges,
            }
        };
    },
    async get_badges(data: get_badges){
        const user_id = data.user_id;
        if(!user_id){
            throw new Error("Missing required fields");
        }
        const user_badges = await prisma.user_badges.findMany({
            where: {user_id},
            include:{
                badges:{
                    select:{
                        badge_id: true,
                        name: true,
                        category: true,
                        description: true,
                    },
                },
            },
            orderBy:{
                earned_at: "desc",
            }
        });
        const earned = user_badges.map((entry: any)=>({
            badge_id: entry.badge_id,
            name: entry.badges.name,
            category: entry.badges.category,
            description: entry.badges.description,
            current: 1,
        }));
        const categoryCounts = earned.reduce((acc: Record<string, number>, badge:any) => {
            const category = badge.category ?? "UNCATEGORIZED";
            acc[category] = (acc[category] ?? 0) + 1;
            return acc;
            }, {});

            const categories = Object.entries(categoryCounts).map(([category, current]) => ({
            category,
            current,
        }));
        return {
            data: {
                earned,
                summary: {
                Total_earned: earned.length,
                categories: categories,
                },
            },
        };

    },

    async get_badge_definitions(){
        const badges = await prisma.badges.findMany({
            include:{
                badge_criteria: true,
            },
            orderBy:{
                name:"asc",
            },
        });
        return {
            data: {
                badges: badges.map((badge:any) => ({
                    badge_id: badge.badge_id,
                    name: badge.name,
                    description: badge.description,
                    category: badge.category,
                    icon_url: badge.icon_url,
                    criteria: badge.badge_criteria.map((criterion:any) => ({
                    metric: criterion.metric,
                    operator: criterion.operator,
                    threshold: criterion.threshold,
                    target: criterion.target,
                    })),
                })),
            },
        }
    },
    async get_leaderboard(){

    }
};