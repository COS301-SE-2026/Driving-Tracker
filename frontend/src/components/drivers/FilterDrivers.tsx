"use client";

import {useEffect, useRef, useState} from "react";
import { SlidersHorizontal } from "lucide-react";


export type FilterState = {
    status: string[];
    sortBy: "name-asc" | "name-desc" | "score-desc" | "score-asc" | "distance-desc" | "distance-asc" | null;
};

type FilterProps = {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
};

const statusOptions = ["Inactive", "On Trip"];

export default function FilterDrivers({filters, onChange} :FilterProps){

    const [open, setOpen] = useState(false);
    const toggleStatus = (status: string) => {
        const next = filters.status.includes(status) ? 
        filters.status.filter((s)=> s !== status) :
        [...filters.status, status];
        onChange({...filters, status: next});
    };
    const containerRef = useRef<HTMLDivElement>(null);

    //to close popup just by pressing outside the dialog
    useEffect(() => {
        function handleClickOutside(e: MouseEvent){
            if (containerRef.current && !containerRef.current.contains (e.target as Node)){
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return(
        <div className="relative" ref = {containerRef}>
            <button onClick={()=> setOpen((o)=>!o)} className="text-gray-700">
                <SlidersHorizontal size = {20} />
            </button>

            {open && (
                <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                    <div className="mb-4">
                        <h4 className="mb-2 text-sm font-semibold text-gray-900">
                            Status
                        </h4>
                        <div className="flex flex-col gap-2">
                            {statusOptions.map((status) => (
                                <label key = {status} className="flex items-center gap-2 text-sm text-gray-700">
                                    <input type = "checkbox" checked = {filters.status.includes(status)}
                                    onChange={()=> toggleStatus(status)}
                                    className="rounded border-gray-300 text-sky-500 focus:ring-sky-400" />
                                    {status}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-2 text-sm font-semibold text-gray-900">
                            Sort By
                        </h4>
                        <select value = {filters.sortBy ?? ""}
                        onChange={(e) => onChange ({...filters, sortBy: (e.target.value || null) as FilterState["sortBy"]})
                        }
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-sky-400">
                            <option value = ""> None </option>
                            <option value = "name-asc"> Name (A-Z) </option>
                            <option value = "name-desc"> Name (Z-A) </option>
                            <option value = "score-desc"> Score (High-Low) </option>
                            <option value = "score-asc"> Score (Low-High) </option>
                            <option value = "distance-desc"> Distance (High-Low) </option>
                            <option value = "distance-asc"> Distance (Low-High) </option>
                        </select>
                    </div>
                    </div>
            )}
        </div>
    );
}

