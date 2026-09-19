"use client";

import {useState} from "react";
import { MoreVertical, Search, SlidersHorizontal } from "lucide-react";

//mocked for now
type Driver = {
    id: string;
    name: string;
    trips: number;
    distanceKm: number;
    status: "Inactive" | "On Trip";
    score: number;
};

//mock drivers
const drivers: Driver[] = [
    {id: "1", name: "Joseph Sethoba", trips: 5, distanceKm: 80, status: "Inactive", score: 96},
    {id: "1", name: "Marius Surname", trips: 3, distanceKm: 52, status: "Inactive", score: 52},
    {id: "1", name: "Noah Beck", trips: 2, distanceKm: 48, status: "On Trip", score: 72}
]

function ScoreValue({score} : {score: number}){
    const color = score >= 60 ? "text-emerald-500" : "text-red-500";
    return <span className={`font-semibold ${color}`}> {score} </span>
}

function DriverCard({driver} : {driver : Driver}){
    return (
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5">
            
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200"/>
                    <h3 className="text-lg font-bold text-gray-900">
                        {driver.name}
                    </h3>
                </div>

                <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size = {20} />
                </button>

            </div>

            <div className="grid grid-cols-2 gap-y-2 text-sm">

                <span className="font-medium text-gray-900">
                    Trips
                </span>
                <span className="text-gray-700">
                    {driver.trips}
                </span>

                <span className="font-medium text-gray-900">
                    Distance
                </span>
                <span className="text-gray-700">
                    {driver.distanceKm}
                </span>

                <span className="font-medium text-gray-900">
                    Status
                </span>
                <span className="text-gray-700">
                    {driver.status}
                </span>

                <span className="font-medium text-gray-900">
                    Score
                </span>
                <ScoreValue score = {driver.score} />

            </div>
        </div>
    );
}