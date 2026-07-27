import { GoogleGenAI } from "@google/genai";
import { z } from "zod";


import prisma from "../../src/db/prisma";// so i can get access to db 

const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_APPLICATION_CREDENTIALS});


//need a stronger system prompt to make it some what deterministic 
let system_prompt_at_end = `You are a driver classification agent for a driving tracker app. You receive a JSON object describing a driver's cumulative trip history and event counts, and you compute a numeric driver score plus a classification label using ONLY the exact formula below. Do not use your own judgment to adjust the score - follow the steps precisely so the same input always produces the same output.
 
INPUT
{
  "user_id": string,
  "total_trips": number,
  "total_distance_km": number,
  "event_counts": { "harsh_brake": number, "harsh_acceleration": number, "sharp_corner": number, "crash_like": number },
  "recent_trip": { "trip_id": string, "distance_km": number, "event_counts": { same shape } } | null
}
 
STEP 1 - If total_distance_km <= 0 or total_trips <= 0, return the "insufficient_data" case.
 
STEP 2 - events_per_100km[type] = event_counts[type] / (total_distance_km / 100), rounded to 2 decimals.
 
STEP 3 - weighted_events_per_100km = (harsh_brake*1.0) + (harsh_acceleration*1.0) + (sharp_corner*0.75) + (crash_like*8.0), using the per-100km values from Step 2.
 
STEP 4 - driver_score = 100 - (weighted_events_per_100km * 5), clamped to [0, 100], rounded to nearest integer.
 
STEP 5 - Classify by driver_score: 85-100 "SAFE_DRIVER", 65-84 "CAUTIOUS_DRIVER", 40-64 "MODERATE_RISK_DRIVER", 0-39 "AGGRESSIVE_DRIVER".
 
STEP 6 - If event_counts.crash_like > 0 anywhere in history, classification can never be better than "MODERATE_RISK_DRIVER" - cap the label only, never lower driver_score for this, and say so in rationale.
 
STEP 7 - Confidence: "low" if total_trips < 3 OR total_distance_km < 50; "medium" if total_trips 3-10 OR distance 50-200; "high" if total_trips > 10 AND distance > 200.
 
STEP 8 - If recent_trip is provided, add one sentence comparing its own event rate to the driver's overall rate. Never recompute driver_score from recent_trip alone.
 
GROUNDING RULES
- Follow the formula exactly - never substitute your own weights or thresholds.
- Use only the numbers given. Never estimate missing fields.
- These are sensor-inferred events, not confirmed incidents. Never state a crash occurred - "crash_like" means a detected hard-impact motion pattern only.
- Never make claims about the driver as a person (character, intent). Describe data patterns only.
- Never phrase this as an insurance, legal, or liability determination.
- Never diagnose fatigue, distraction, or any medical/psychological state.
- Do NOT invent an eco_score or safety_score - you are not given that data, and must not include those fields in your output.
 
OUTPUT - respond with ONLY this JSON, no prose, no markdown fences:
 
Normal case:
{
  "user_id": string,
  "driver_score": number,
  "driver_type": "SAFE_DRIVER" | "CAUTIOUS_DRIVER" | "MODERATE_RISK_DRIVER" | "AGGRESSIVE_DRIVER",
  "confidence": "low" | "medium" | "high",
  "events_per_100km": { "harsh_brake": number, "harsh_acceleration": number, "sharp_corner": number, "crash_like": number },
  "crash_override_applied": boolean,
  "rationale": string,
  "recent_trip_impact": string | null
}
 
Insufficient data case:
{ "user_id": string, "driver_type": "insufficient_data", "driver_score": null, "confidence": "low", "rationale": string }`;

const gemini_response_schema ={
    type: "OBJECT",
    properties: {
        user_id: { type: "STRING" },
        driver_score: { type: "NUMBER", nullable: true },
        driver_type: { type: "STRING" },
        confidence: { type: "STRING" },
        events_per_100km: {
            type: "OBJECT",
            nullable: true,
            properties: {
                harsh_brake: { type: "NUMBER" },
                harsh_acceleration: { type: "NUMBER" },
                sharp_corner: { type: "NUMBER" },
                crash_like: { type: "NUMBER" },
            },
        },
        crash_override_applied: { type: "BOOLEAN", nullable: true },
        rationale: { type: "STRING" },
        recent_trip_impact: { type: "STRING", nullable: true },
    },
    required: ["user_id", "driver_type", "confidence", "rationale"],
} as const;


const event_count_schema = z.object({
    harsh_brake: z.number().int().nonnegative(),
    harsh_acceleration: z.number().int().nonnegative(),
    crash_like: z.number().int().nonnegative(),
    sharp_corner: z.number().int().nonnegative(),
});

const input_schema = z.object({
     user_id: z.string().uuid(),
    total_trips: z.number().int().nonnegative(),
    total_distance_km: z.number().nonnegative(),
    event_counts: event_count_schema, 
    recent_trip: z.object({
        trip_id: z.string().uuid(),
        distance_km: z.number().nonnegative(), 
        event_counts: event_count_schema,       
    }).nullable(),
});
type input_s = z.infer<typeof input_schema>;

const output_schema = z.union([
    z.object({
        user_id: z.string(),
        driver_scope: z.number().min(0).max(100),
         driver_type: z.enum(["SAFE_DRIVER", "CAUTIOUS_DRIVER", "MODERATE_RISK_DRIVER", "AGGRESSIVE_DRIVER"]),
        confidence: z.enum(["low", "medium", "high"]),
        events_per_100km: z.object({
            harsh_brake: z.number(),
            harsh_acceleration: z.number(),
            sharp_corner: z.number(),
            crash_like: z.number(),
        }),
        crash_override_applied: z.boolean(),
        rationale: z.string(),
        recent_trip_impact: z.string().nullable(),
    }),
    z.object({
        user_id: z.string(),
        driver_type: z.literal("insufficient_data"),
        driver_score: z.null(),
        confidence: z.literal("low"),
        rationale: z.string(),
    }),
]);
type output_s = z.infer<typeof output_schema>


//still need to merge the eco, safety and overall scores to the output schema 

//build the input according to the schema 
async function build_input(user_id: string, recent_trip_id?: string): Promise<input_s>{
    const trips = await prisma.trips.aggregate({
        where: {user_id, status: "COMPLETED"},
        _count:{trip_id:true},
        _sum:{ distance_km:true},
    });

    const total_trips = trips._count.trip_id;
    const total_distance_km = trips._sum.distance_km ? Number(trips._sum.distance_km): 0 ;

    const event_group = await prisma.trip_events.groupBy({
        by: ['type'],
        where:{ trips:{ user_id, status: "COMPLETED"}},
        _count: { event_id: true},
    });

    const event_counts = { harsh_brake: 0, harsh_acceleration: 0, sharp_corner: 0, crash_like: 0 };

    //loop through all the events the user has gone through and count them 
    for(const row of event_group){
        if(row.type === "HARSH_BRAKE"){
            event_counts.harsh_brake = row._count.event_id;
        }
        if(row.type === " HARSH_ACCELERATION"){
            event_counts.harsh_acceleration = row._count.event_id;
        }
        if(row.type === "SHARP_CORNER"){
            event_counts.sharp_corner = row._count.event_id;
        }
        if(row.type === "CRASH_LIKE"){
            event_counts.crash_like = row._count.event_id;
        }
    }// if these events aren't found the count stays 0 

    // now find the recent trip 
    let recent_trip :input_s["recent_trip"]= null;
    if(recent_trip){
        const trip = await prisma.trips.findUnique({
            where: { trip_id: recent_trip_id},
            select: {trip_id:true, distance_km:true}
        });
        if(trip){
            const recent_events = await prisma.trip_events.groupBy({
                by: ['type'],
                where: { trip_id:recent_trip_id},
                _count:{ event_id:true},
            });

            const recent_counts =  { harsh_brake: 0, harsh_acceleration: 0, sharp_corner: 0, crash_like: 0 };

            for(const row of recent_events){
                if(row.type === "HARSH_BRAKE"){
                    recent_counts.harsh_brake = row._count.event_id;
                }
                if(row.type === " HARSH_ACCELERATION"){
                    recent_counts.harsh_acceleration = row._count.event_id;
                }
                if(row.type === "SHARP_CORNER"){
                    recent_counts.sharp_corner = row._count.event_id;
                }
                if(row.type === "CRASH_LIKE"){
                    recent_counts.crash_like = row._count.event_id;
                }
            }

            recent_trip ={
                trip_id: trip.trip_id,
                distance_km: trip.distance_km ? Number(trip.distance_km) : 0,
                event_counts: recent_counts,
            };
        }
    }
    return input_schema.parse({ user_id, total_trips, total_distance_km,event_counts,recent_trip});
}

//will average out the overall score based on what is returned 
async function average_scores(user_id: string){
    
    
}

