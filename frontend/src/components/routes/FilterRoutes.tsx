"use client";

import {useEffect, useRef, useState} from "react";
import { SlidersHorizontal } from "lucide-react";


export type FilterState = {
    status: string[];
    sortBy: "title-asc" | "title-desc" | "driver-asc" | "driver-desc" | "destination-asc" | "destination-desc" | null;
};

type FilterProps = {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
};

const statusOptions = ["Not Started", "On Trip", "Completed"];

function CheckBoxGroup({
    label, options, selected, onToggle,
} : {
    label: string;
    options: string[];
    selected: string[];
    onToggle: (value: string) => void;
}){
    if (options.length === 0){
        return null;
    }
    
    return(
        <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
                {label}
            </h4>
            <div className="flex max-h-32 flex-col gap-2 overflow-y-auto">
                {options.map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox"
                        checked = {selected.includes(option)}
                        onChange={()=>onToggle(option)}
                        className="rounded border-gray-300 text-sky-500 focus:ring-sky-400"
                        />
                        {option}
                    </label>
                ))}
            </div>
        </div>
    );
}

export default function FilterRoutes({filters, onChange} :FilterProps){

    const [open, setOpen] = useState(false);
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

    const toggle = (key: "status", value: string) => {
        const curr = filters[key];
        const next = curr.includes(value) ? curr.filter((v)=> v !== value) : [...curr, value];
        onChange({...filters, [key]: next});
    };

    return(
        <div className="relative" ref = {containerRef}>
            <button onClick={()=> setOpen((o)=>!o)} className="text-gray-700">
                <SlidersHorizontal size = {20} />
            </button>

            {open && (
                <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                    <CheckBoxGroup label = "Status" options = {statusOptions} selected={filters.status} onToggle={(v) => toggle("status", v)}/>

                    <div>
                        <h4 className="mb-2 text-sm font-semibold text-gray-900">
                            Sort By
                        </h4>
                        <select value = {filters.sortBy ?? ""}
                        onChange={(e) => onChange ({...filters, sortBy: (e.target.value || null) as FilterState["sortBy"]})
                        }
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-sky-400">
                            <option value = ""> None </option>
                            <option value = "title-asc"> Title (A-Z) </option>
                            <option value = "title-desc"> Title (Z-A) </option>

                            <option value = "driver-asc"> Driver (A-Z) </option>
                            <option value = "driver-desc"> Driver (Z-A) </option>

                            <option value = "destination-asc"> Destination (A-Z) </option>
                            <option value = "destination-desc"> Destination (Z-A) </option>

                        </select>
                    </div>
                    </div>
            )}
        </div>
    );
}

