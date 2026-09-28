"use client";

import {useState, useEffect} from "react";
import {X,Plus,Trash2,Circle,Route as RouteIcon, Loader2} from "lucide-react";
import Image from "next/image";
import {BASE_PATH} from "@/lib/basePath";
import { apiFetch } from "@/lib/auth/apiClient";

// type Stop = {id: string, address: string};
type Stop = { id: string; address: string; lat?: number; lng?: number };
type Status = "Not Started" | "On Trip" | "Completed";

export type RouteFormData = {
    title: string;
    task: string;
    driver: string;
    vehicle: string;
    stops: Stop[];
    selected_points?: { lat: number; lng: number }[];
    risk_level?: 'LOW' | 'MEDIUM' | 'HIGH'; 
}
export type RouteOption = {
    route_index: number;
    name: string;
    distance_km: number;
    travel_time_seconds: number;
    pothole_count: number;
    harsh_brake_hotspot_count: number ;
    risk_level: 'LOW'|'MEDIUM'|'HIGH';
    points: { lat: number; lng: number }[]; 
};

type addRouteDialogProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: RouteFormData & 
        {status: Status}
    ) => void;
    driverOptions: string[];
    vehicleOptions: string[];
    initialData?: RouteFormData;
};

const emptyStops = (): Stop[] => [
    {id: crypto.randomUUID(), address: ""},
    {id: crypto.randomUUID(), address: ""},
];
export function AddressAutocompleteInput({ 
    value, 
    placeholder, 
    onChange, 
    onSelectAddress, }
    : { 
        value: string; 
        placeholder: string; 
        onChange: (val: string) => void; 
        onSelectAddress: (addr: string, lat: number, lng: number) => void; 
    }) { 
    const [suggestions, setSuggestions] = useState<{ address: string; lat: number; lng: number }[]>([]); 
    const [showDropdown, setShowDropdown] = useState(false);
    useEffect(() => {
        if (!value || value.trim().length < 3) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await apiFetch<{ data: { address: string; lat: number; lng: number }[] }>(
                    `/map/search?address=${encodeURIComponent(value)}`
                );
                if (res.data?.length) {
                    setSuggestions(res.data);
                    setShowDropdown(true);
                } else {
                    setSuggestions([]);
                }
            } catch (err) {
                console.error("Address search failed", err);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="relative w-full">
            <input
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                }}
                placeholder={placeholder}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />

            {showDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {suggestions.map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => {
                                onSelectAddress(item.address, item.lat, item.lng);
                                setShowDropdown(false);
                            }}
                            className="cursor-pointer px-3 py-2 text-xs font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-700 border-b border-gray-100 last:border-0"
                        >
                             {item.address}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
export function RouteRiskSelector({
    routes,
    selectedIndex,
    onSelect,
}:{
    routes: RouteOption[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}){
    const riskBadgeColor = {
        LOW: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
        HIGH: 'bg-rose-100 text-rose-800 border-rose-300',
    };
    return(
        <div className="flex flex-col gap-3 my-3">
            <label className="text-sm font-semibold text-gray-800">
                Choose Preferred Route:
            </label>
            {routes.map((rt) =>{
                const isSelected = selectedIndex === rt.route_index;
                const minutes = Math.round(rt.travel_time_seconds / 60);
                return(
                    <div key={rt.route_index}
                    onClick={() => onSelect(rt.route_index)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                            isSelected
                                ? 'border-sky-500 bg-sky-50 shadow-md ring-2 ring-sky-400'
                                : 'border-gray-200 bg-white hover:border-sky-300'
                        }`}
                    > 
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-gray-900">{rt.name}</span>
                            <span
                                className={`px-2 py-0.5 text-xs font-bold rounded-full border ${
                                    riskBadgeColor[rt.risk_level]
                                }`}
                            >
                                {rt.risk_level} RISK
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>{rt.distance_km.toFixed(1)} km</div>
                            <div>{minutes} mins</div>
                            <div>{rt.pothole_count} Potholes</div>
                            <div>{rt.harsh_brake_hotspot_count} Harsh Brake Spots</div>
                        </div>
                    </div>
                );
            })}
        </div>
    )
}

export default function AddRoute(
    {open, onClose, onSubmit, driverOptions, vehicleOptions, initialData} : addRouteDialogProps
){

    const isEditing = !!initialData;

    const [title, setTitle] = useState(initialData?.title ?? "");
    const [task, setTask] = useState(initialData?.task ?? "");
    const [driver, setDriver] = useState(initialData?.driver ?? "");
    const [vehicle, setVehicle] = useState(initialData?.vehicle ?? "");
    const [stops, setStops] = useState<Stop[]>(initialData?.stops ?? emptyStops());
    const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
    const [loadingRoutes, setLoadingRoutes] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);

    useEffect(() => {
        if (open){
            setTitle(initialData?.title ?? "");
            setTask(initialData?.task ?? "");
            setDriver(initialData?.driver ?? "");
            setVehicle(initialData?.vehicle ?? "");
            setStops(initialData?.stops ?? emptyStops());
            setRouteOptions([]);
            setSelectedRouteIndex(0);
            setRouteError(null);
        }
    }, [open, initialData]);

    if (!open){
        return null;
    }

  const updateStopAddress = (id: string, address: string) => {
        setStops((prev) =>
            prev.map((s) => (s.id === id ? { ...s, address, lat: undefined, lng: undefined } : s))
        );
        setRouteOptions([]);
    };

    const updateStopCoordinates = (id: string, address: string, lat: number, lng: number) => {
        setStops((prev) =>
            prev.map((s) => (s.id === id ? { ...s, address, lat, lng } : s))
        );
        setRouteOptions([]);
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
    const handlePreviewRoutes = async () => {
        const startStop = stops[0];
        const endStop = stops[stops.length - 1];

        if (!startStop?.address?.trim() || !endStop?.address?.trim()) {
            setRouteError("Please select both Start Location and Final Destination from the dropdown suggestions.");
            return;
        }

        setLoadingRoutes(true);
        setRouteError(null);

        try {
            let startLat = startStop.lat;
            let startLng = startStop.lng;
            let endLat = endStop.lat;
            let endLng = endStop.lng;

            // Fallback search if user typed custom address without selecting dropdown
            if (!startLat || !startLng) {
                const startRes = await apiFetch<{ data: { lat: number; lng: number }[] }>(
                    `/map/search?address=${encodeURIComponent(startStop.address)}`
                );
                if (startRes.data?.[0]) {
                    startLat = startRes.data[0].lat;
                    startLng = startRes.data[0].lng;
                }
            }

            if (!endLat || !endLng) {
                const endRes = await apiFetch<{ data: { lat: number; lng: number }[] }>(
                    `/map/search?address=${encodeURIComponent(endStop.address)}`
                );
                if (endRes.data?.[0]) {
                    endLat = endRes.data[0].lat;
                    endLng = endRes.data[0].lng;
                }
            }

            if (!startLat || !startLng || !endLat || !endLng) {
                setRouteError("Could not resolve coordinates for addresses. Please choose a location from the dropdown suggestions.");
                return;
            }

            const routeRes = await apiFetch<{ data: { routes: RouteOption[] } }>(
                `/map/route?start_lat=${startLat}&start_lng=${startLng}&dest_lat=${endLat}&dest_lng=${endLng}&include_alternative=true`
            );

            if (routeRes.data?.routes?.length) {
                setRouteOptions(routeRes.data.routes);
                setSelectedRouteIndex(0);
            } else {
                setRouteError("No routes found between those locations.");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to calculate route alternatives.";
            console.error("Failed to fetch route alternatives", err);
            setRouteError(message);
        } finally {
            setLoadingRoutes(false);
        }
    };
    const resetForm = () => {
        setTitle("");
        setTask("");
        setVehicle("");
        setDriver("");
        setRouteOptions([]);
        setSelectedRouteIndex(0);
        setRouteError(null);
        setStops(
            [
                {id: crypto.randomUUID(), address: ""},
                {id: crypto.randomUUID(), address: ""}
            ]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const chosen = routeOptions[selectedRouteIndex];

        onSubmit({
            title,
            task,
            driver,
            vehicle,
            stops,
            status: "Not Started",
            selected_points: chosen?.points,
            risk_level: chosen?.risk_level
        });

        resetForm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                    <div className="w-5" />
                    <div className="h-14 w-14 overflow-hidden rounded-full">
                        <Image
                            src={`${BASE_PATH}/images/screen1.png`}
                            alt="Driving Tracker Logo"
                            width={56}
                            height={56}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
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
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Task
                        </label>
                        <input
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Driver
                        </label>
                        <select
                            value={driver}
                            onChange={(e) => setDriver(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                        >
                            <option value="" disabled>
                                Select a driver
                            </option>
                            {driverOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Vehicle
                        </label>
                        <select
                            value={vehicle}
                            onChange={(e) => setVehicle(e.target.value)}
                            required
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-400"
                        >
                            <option value="" disabled>
                                Select a vehicle
                            </option>
                            {vehicleOptions.map((name) => (
                                <option key={name} value={name}>
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
                                return (
                                    <div key={stop.id} className="flex items-start gap-3">
                                        <div className="flex flex-col items-center pt-2.5">
                                            {isFirst ? (
                                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                            ) : isLast ? (
                                                <Circle size={10} className="text-red-500" fill="none" strokeWidth={2.5} />
                                            ) : (
                                                <div className="h-2 w-2 rounded-full bg-gray-300" />
                                            )}
                                            {!isLast && <div className="my-0.5 h-6 w-px bg-gray-300" />}
                                        </div>

                                        <div className="flex flex-1 items-center gap-2">
                                            <AddressAutocompleteInput
                                                value={stop.address}
                                                placeholder={isFirst ? "Start Location": isLast ?"Final destination": "stop"}
                                                onChange={(addr) => updateStopAddress(stop.id,addr)}
                                                onSelectAddress={(addr, lat,lng)=> updateStopCoordinates(stop.id,addr,lat,lng)}/>

                                            {!isFirst && !isLast && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeStop(stop.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={addStop}
                                className="flex items-center gap-1 text-sm font-medium text-sky-500 hover:text-sky-600"
                            >
                                <Plus size={16} />
                                Add Stop
                            </button>

                            <button
                                type="button"
                                onClick={handlePreviewRoutes}
                                disabled={loadingRoutes}
                                className="flex items-center gap-1.5 rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-200 disabled:opacity-50"
                            >
                                {loadingRoutes ? <Loader2 size={14} className="animate-spin" /> : <RouteIcon size={14} />}
                                Preview & Compare Routes
                            </button>
                        </div>
                    </div>

                    {routeError && (
                        <p className="text-xs font-medium text-rose-500 my-1">{routeError}</p>
                    )}

                    {routeOptions.length > 0 && (
                        <RouteRiskSelector
                            routes={routeOptions}
                            selectedIndex={selectedRouteIndex}
                            onSelect={setSelectedRouteIndex}
                        />
                    )}

                    <div className="mt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
                        >
                            {isEditing ? "Save Changes" : "Create Route"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}