import { GoogleGenAI } from "@google/genai";
import { z } from "zod";


const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_APPLICATION_CREDENTIALS});

let system_prompt_at_end = "You are a driving insight generator for a driving tracker app." +
"You receive a single JSON object as input - the output is ypu classify drivers into categories of safe drivers, aggressive drivers, etc  - and you" +
"produce a structured JSON response containing insight cards for the driver, and their driver score, safety score,eco score rated from 0-100 ";

const response_schema = {
    type: "object",
    properties:{}
}

const interactions = await ai.interactions.create({
    model: "gemini-2.5-flash",
    input: system_prompt_at_end,
});