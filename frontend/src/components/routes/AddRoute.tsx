"use client";

import {useState} from "react";
import {X,Plus,Trash2,Circle} from "lucide-react";
import Image from "next/image";
import {BASE_PATH} from "@/lib/basePath";

type Stop = {id: string, address: string};
type Status = "Not Started" | "On Trip" | "Completed";

type addRouteDialogProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (data:
        {title: string; task: string; driver: string; stops: Stop[]; status: Status}
    ) => void;
    driverOptions: string[];
};

export default function AddRoute(
    {open, onClose, onSubmit, driverOptions} : addRouteDialogProps
){

    const [title, setTitle] = useState("");
    const [task, setTask] = useState("");
    const [driver, setDriver] = useState("");
    const [stops, setStops] = useState<Stop[]>([
        {id: crypto.randomUUID(), address: ""},
        {id: crypto.randomUUID(), address: ""}
    ]);

    if (!open){
        return null;
    }

    const updateStop = (id: string, address: string) => {
        setStops((prev) =>
        prev.map((s) => (s.id === id ? {...s,address} : s)));
    };

    const addStop = () => {
        setStops((prev) =>
        [...prev.slice(0,-1), {id :crypto.randomUUID(), address: ""}, prev[prev.length - 1]]);
    };

    const removeStop = (id: string) => {
        if (stops.length <= 2){ //keep start and end
            return; 
        }
        setStops((prev) =>
        prev.filter((s) => (s.id !== id )));
    };

    const resetForm = () => {
        setTitle("");
        setTask("");
        setDriver("");
        setStops(
            [
                {id: crypto.randomUUID(), address: ""},
                {id: crypto.randomUUID(), address: ""}
            ]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({title, task, driver, stops, status: "Not Started"});
        resetForm();
        onClose();
    };

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                    <div className="w-5" />
                    <div className="h-14 w-14 overflow-hidden rounded-full">
                        < Image src = {`${BASE_PATH}/images/screen1.png`}
                        alt = "Driving Tracker Logo"
                        width = {56}
                        height={56}
                        className="h-full w-full object-cover"
                        />
                    </div>

                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size = {20} />
                    </button>
                </div>

                <h2 className="mb-4 text-center text-lg font-bold text-gray-900">
                    Assign Route(s)
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Title
                        </label>
                        <input value = {title} onChange={(e) => setTitle(e.target.value)} required
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                            />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Task
                        </label>
                        <input value = {task} onChange={(e) => setTask(e.target.value)} required
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                            />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Driver
                        </label>
                        <select value = {driver} onChange={(e) => setDriver(e.target.value)} required
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400">
                                <option value = "" disabled>
                                    Select a driver
                                </option>
                                {driverOptions.map((name) => (
                                    <option key = {name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Stops
                        </label>
                        <div className="flex flex-col gap-1">
                            {stops.map((stop, index) => {
                                const isFirst = index === 0;
                                const isLast = index === stops.length - 1;
                                return(
                                    <div key = {stop.id} className="flex items-start gap-3">
                                        <div className="flex flex-col items-center pt-2.5">
                                            {isFirst ? (
                                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />)
                                                : isLast ? (<Circle size={10} className="text-red-500" fill="none" strokeWidth={2.5}/>)
                                                : (<div className="h-2 w-2 rounded-full bg-gray-300" />)}
                                                {!isLast && <div className="my-0.5 h-6 w-px bg-gray-300" />}
                                    </div>

                                    <div className="flex flex-1 items-center gap-2">
                                        <input 
                                        value = {stop.address}
                                        onChange={(e) => updateStop(stop.id, e.target.value)}
                                        placeholder={isFirst?"Start Location":isLast ? "Final destination" : "Stop"}
                                        required
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"/>

                                        {!isFirst && !isLast && (
                                            <button 
                                            type = "button"
                                            onClick={()=> removeStop(stop.id)}
                                            className="text-gray-400 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                );
                            })}
                        </div>

                        <button type="button" onClick={addStop} className="mt-2 flex items-center gap-1 text-sm font-medium text-sky-500 hover:text-sky-600">
                            <Plus size={16}/>
                            Add Stop
                        </button>

                    </div>


                    <div className="mt-2 flex justify-end gap-3">

                        <button 
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
                            Cancel
                        </button>

                        <button type="submit" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">
                            Create Route
                        </button>

                    </div>

                </form>
            </div>
        </div>
    );
}