/* istanbul ignore file */
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";


import prisma from "../db/prisma";// so i can get access to db 

const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY});


//need a stronger system prompt to make it some what deterministic 
let system_prompt_at_end = `You are a driver classification agent for a driving tracker app. You receive a JSON object describing a driver's cumulative trip history and event counts, and you compute a numeric driver score plus a classification label using ONLY the exact formula below. Do not use your own judgment to adjust the score - follow the steps precisely so the same input always produces the same output.
 
INPUT
{
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
    //  user_id: z.string().uuid(),
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
        // user_id: z.string(),
        driver_score: z.number().min(0).max(100),
        driver_type: z.enum(["SAFE_DRIVER", "CAUTIOUS_DRIVER", "MODERATE_RISK_DRIVER", "AGGRESSIVE_DRIVER"]).default("CAUTIOUS_DRIVER"),
        confidence: z.enum(["low", "medium", "high"]).default('low'),
        events_per_100km: z.object({
            harsh_brake: z.number().default(0),
            harsh_acceleration: z.number().default(0),
            sharp_corner: z.number().default(0),
            crash_like: z.number().default(0),
        }),
        crash_override_applied: z.boolean().default(false),
        rationale: z.string().default("Analysis completed based on available data."),
        recent_trip_impact: z.string().nullable().default(null),
    }),
    z.object({
        // user_id: z.string(),
        driver_type: z.literal("insufficient_data"),
        driver_score: z.null(),
        confidence: z.literal("low"),
        rationale: z.string(),
    }),
]);
type output_s = z.infer<typeof output_schema>


//still need to merge the eco, safety and overall scores to the output schema 
export type driver_profile = output_s &{
    eco_score: number | null ;
    safety_score: number | null ;
    overall_score: number | null ;
}

//build the input according to the schema 
function countEventsFromGroups(groups: Array<{ type: string|null; _count: { event_id: number } }>) {
    const counts = {
        harsh_brake: 0,
        harsh_acceleration: 0,
        sharp_corner: 0,
        crash_like: 0,
    };

    for (const row of groups) {

        const type = row.type?.trim();
        if(!type) continue;
        switch (type) {
            case "HARSH_BRAKE":
                counts.harsh_brake = row._count.event_id;
                break;
            case "HARSH_ACCELERATION":
                counts.harsh_acceleration = row._count.event_id;
                break;
            case "SHARP_CORNER":
                counts.sharp_corner = row._count.event_id;
                break;
            case "CRASH_LIKE":
                counts.crash_like = row._count.event_id;
                break;
            // other types are ignored (stay 0)
        }
    }
    return counts;
}

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

   const event_counts = countEventsFromGroups(event_group);

    // now find the recent trip 
    let recent_trip :input_s["recent_trip"]= null;
    if(recent_trip_id){
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

           const recent_counts = countEventsFromGroups(recent_events);


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
    // only way to get the scores is the trip_scores table 
    const current_scores = await prisma.trip_scores.aggregate({
        where:{trips:{user_id,status:"COMPLETED"}},
        _avg: { eco_score:true,safety_score: true, overall_score: true}
    });    
    return{
        eco_score: current_scores._avg.eco_score != null ? Math.round(Number(current_scores._avg.eco_score)) : null,
        safety_score : current_scores._avg.safety_score != null ? Math.round(Number(current_scores._avg.safety_score)): null,
        overall_score: current_scores._avg.overall_score != null ? Math.round(Number(current_scores._avg.overall_score)): null,
    };  
};
function get_event_per_100km(counts: input_s["event_counts"],distance_km:number){
    const factor = distance_km / 100;
    return {
        harsh_brake: Number((counts.harsh_brake / factor).toFixed(2)),
        harsh_acceleration: Number((counts.harsh_acceleration / factor).toFixed(2)),
        sharp_corner: Number((counts.sharp_corner / factor).toFixed(2)),
        crash_like: Number((counts.crash_like / factor).toFixed(2)),
    };
};
function get_driver_classification(score: number, has_crash: boolean){
    let type: "SAFE_DRIVER" | "CAUTIOUS_DRIVER" | "MODERATE_RISK_DRIVER" | "AGGRESSIVE_DRIVER";
    let crash_override = false;
    let rationale = `Calculated score of ${score} based on event frequency per 100km.`;

    if (score >= 85){
        type = "SAFE_DRIVER";
    }
    else if (score >= 65){
        type = "CAUTIOUS_DRIVER";
    } 
    else if (score >= 40){
        type = "MODERATE_RISK_DRIVER";
    }
    else type = "AGGRESSIVE_DRIVER";

    //  Cap classification if a crash pattern was detected
    if (has_crash && (type === "SAFE_DRIVER" || type === "CAUTIOUS_DRIVER")) {
        type = "MODERATE_RISK_DRIVER";
        crash_override = true;
        rationale += " Classification capped at MODERATE_RISK due to detected high-impact patterns.";
    }

    return { type, crash_override, rationale };

}
function calculate_manual_evaluation(input: input_s):output_s{
    const { total_trips, total_distance_km,event_counts , recent_trip}= input;
    if (total_distance_km <= 0 || total_trips <= 0) {
        return {
            driver_score: null,
            driver_type: "insufficient_data",
            confidence: "low",
            rationale: "Insufficient trips or distance recorded to generate a profile.",
        };
    }
    //events per 100 km
    const events_per_100 = get_event_per_100km(event_counts,total_distance_km);
    //weighted_events_per_100 
    const weighted = (events_per_100.harsh_brake * 1.0)+(events_per_100.harsh_acceleration * 1.0)
                    +( events_per_100.sharp_corner* 0.75)+(events_per_100.crash_like* 8.0);

    //driver score
    let score = Math.round(100 - (weighted * 5));
    score = Math.max(0, Math.min(100, score));
    const classification = get_driver_classification(score,event_counts.crash_like >0);
    //classification
    
    //driver confidence
    let confidence: "low" | "medium" | "high" = "low";
    if (total_trips > 10 && total_distance_km > 200){
        confidence = "high";
    } 
    else if (total_trips >= 3 || total_distance_km >= 50){
        confidence = "medium";
    }
    
    let impact: string | null = null;
    if (recent_trip && recent_trip.distance_km > 0) {
        const rFactor = recent_trip.distance_km / 100;
        const rWeighted = (recent_trip.event_counts.harsh_brake * 1.0) +
                          (recent_trip.event_counts.harsh_acceleration * 1.0) +
                          (recent_trip.event_counts.sharp_corner * 0.75) +
                          (recent_trip.event_counts.crash_like * 8.0);
        const rRate = rWeighted / rFactor;
        const oRate = weighted;

        if (rRate > oRate * 1.2){
            impact = "This recent trip was more aggressive than your usual driving history.";
        }
        else if (rRate < oRate * 0.8){
            impact = "Excellent! This trip was significantly smoother than your average.";
        } 
        else {
            impact = "This trip was consistent with your typical driving pattern.";
        }
        
    }
    return {
        driver_score: score,
        driver_type: classification.type,
        confidence,
        events_per_100km: events_per_100,
        crash_override_applied: classification.crash_override,
        rationale: classification.rationale,
        recent_trip_impact: impact,
    };
}

export async function driver_profile(user_id: string, recent_trip_id: string): Promise<driver_profile>{
    const current_trip = await prisma.trips.findUnique({
        where: { trip_id: recent_trip_id },
        select: { distance_km: true, duration_minutes: true }
    });

    const dist = Number(current_trip?.distance_km || 0);
    const dur = current_trip?.duration_minutes || 0;
    
    if (dist < 0.5 && dur < 2) {
        // console.log(`AI: Skipping eval for trip ${recent_trip_id} (Too short: ${dist}km, ${dur}min)`);
        
        // Return a manual "insufficient_data" result to avoid calling Gemini
        const scores = await average_scores(user_id);
        return {
            driver_type: "insufficient_data",
            driver_score: null,
            confidence: "low",
            rationale: "This trip was too short for a meaningful driving profile analysis.",
            ...scores
        };
    }

    const [input_s,scores] = await Promise.all([
        build_input(user_id, recent_trip_id),
        average_scores(user_id),
    ]);

    //call ai to get the scores calculated... 
    // Perform manual calculation (No tokens used)
    const classification = calculate_manual_evaluation(input_s);


    // const response = await ai.models.generateContent({
    //     model:"gemini-3.6-flash",
    //     contents: JSON.stringify(input_s),
    //     config:{
    //         systemInstruction: system_prompt_at_end,
    //         responseMimeType:"application/json",
    //         responseSchema: gemini_response_schema,
    //     },
    // });

    // const raw = JSON.parse(response.text ?? "{}");
    // const classification = output_schema.parse(raw);
    if (classification.driver_type !== "insufficient_data" && classification.driver_score != null) {
        
        const existing_score = await prisma.trip_scores.findFirst({
            where: { trip_id: recent_trip_id }
        });
 
        if (existing_score) {
            await prisma.trip_scores.update({
                where: { score_id: existing_score.score_id },
                data: { overall_score: classification.driver_score }
            });
        }
        
    }

    return { 
        ...classification, 
        ...scores,
        safety_score: classification.driver_score ?? scores.safety_score,
        overall_score: classification.driver_score ?? scores.overall_score
    } as driver_profile;;
}
