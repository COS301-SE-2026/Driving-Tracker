"use client";

import {useState} from "react";
import {Search, ArrowRight} from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar";

type Route = {
    id: string;
    title: string;
    task: string;
    startDestination: string;
    endDestination: string;
    driver: string;
    status: "Not Started" | "On Trip" | "Completed";
};

function StatusPill({status} : {status: Route["status"]}){

    const styles: Record<Route["status"], string> = {
        "On Trip": "bg-emerald-100 text-emerald-700",
        "Not Started": "bg-red-100 text-red-700",
        "Completed": "bg-sky-100 text-sky-700",
    };

    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
            {status}
        </span>
    );
}

function RouteCard({route}: {route: Route}){
    return (
        <div className="w-full rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-start justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                    {route.title}
                </h3>
                <button className="flex items-center gap-1 text-xs font-semibold text-sky-500 hover:text-sky-600">
                    View Progress
                    <ArrowRight size = {14}/>
                </button>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <span className="font-medium text-gray-900">
                    Task:
                </span>
                <span className="text-gray-700">
                    {route.title}
                </span>

                <span className="font-medium text-gray-900">
                    Description:
                </span>
                <span className="text-gray-700">
                    {route.task}
                </span>

                <span className="font-medium text-gray-900">
                    Destination:
                </span>
                <span className="text-gray-700">
                    {route.endDestination}
                </span>

                <span className="font-medium text-gray-900">
                    Driver:
                </span>
                <span className="text-gray-700">
                    {route.driver}
                </span>

                <span className="font-medium text-gray-900">
                    Status:
                </span>
                <StatusPill status = {route.status} />
            </div>
        </div>
    );
}