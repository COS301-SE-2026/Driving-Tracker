"use client";
import { History, MapPin } from "lucide-react";

type PastRoute = {
    id: string;
    title: string;
    driver: string;
    vehicle: string;
};

type PastRoutesProps = {
    routes: PastRoute[];
    onSelect: (id: string) => void;
};

export default function PastRoutes({
    routes, onSelect
} : PastRoutesProps){

    return(
        <div className="flex w-56 flex-col gap-3 border-r border-black bg-white p-4">
            <div className="flex items-center gap-2">
                <History size={22} className="text-gray-700"/>
                <h1 className="text-xl font-extrabold text-gray-900">
                    Past Routes
                </h1>
            </div>

            <div className="mt-2 mb-2 border-t border-gray-200"/>

            {routes.length === 0 ? (
                <p className="text-xs text-gray-400">
                    No completed routes.
                </p>
                ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto">
                        {routes.map((route) => (
                            <button key = {route.id} 
                            onClick={()=> onSelect(route.id)}
                            className="flex flex-col items-start gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:border-sky-300">

                                <div className="flex items-center gap-1.5">
                                    <MapPin size = {12} className="shrink-0 text-sky-500"/>
                                    <p className="text-xs font-semibold text-gray-900">
                                        {route.title}
                                    </p>
                                </div>

                                
                                <p className="text-[11px] text-gray-600">
                                    <span className="font-medium text-gray-700">Driver: </span>{route.driver}
                                </p>

                                <p className="text-[11px] text-gray-600">
                                    <span className="font-medium text-gray-700">Vehicle: </span>{route.vehicle}
                                </p>
                                
                            </button>
                        ))}
                    </div>
                )
            }
        </div>
    );
}