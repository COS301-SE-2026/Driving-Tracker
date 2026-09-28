"use client";

import {useEffect, useState} from "react";
import {Search} from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar"
import AddDriver from "@/components/drivers/AddDriver";
import DriverMenu from "@/components/drivers/DriverMenu";
import ViewDriver from "@/components/drivers/ViewDriver";
import FilterDrivers, { FilterState } from "@/components/drivers/FilterDrivers";
import { apiFetch } from "@/lib/auth/apiClient";
import Image from "next/image";

type DriverStatus = "Available" | "Assigned" | "On Trip";

type Driver = {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    trips: number;
    distanceKm: number;
    profilePictureUrl: string | null;
    status: DriverStatus;
    score: number | null;
};

type FleetDriver = {
    user_id: string;
    name: string | null;
    surname: string | null;
    email: string | null;
    phone_number: string | null;
    profile_picture_url: string | null;
    status: "AVAILABLE" | "ASSIGNED" | "UNAVAILABLE";
    trips: number;
    distance_km: number;
    score: number | null;
};

type FleetDriversResponse = {
    data: {drivers: FleetDriver[]};
};

function ScoreValue({score} : {score: number | null}){
    if (score === null){
        return <span className="text-gray-500">No score yet</span>;
    }
    const color = score >= 60 ? "text-emerald-500" : "text-red-500";
    return <span className={`font-semibold ${color}`}> {score} </span>
}

function DriverCard({driver, onView, onDelete} : {driver : Driver; onView: ()=> void; onDelete: ()=> void;}){
    return (
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5">

            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">

                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                        {driver.profilePictureUrl ? (
                            <Image src = {driver.profilePictureUrl}
                            alt = {`${driver.name}'s profile picture`}
                            fill
                            sizes = "48px"
                            unoptimized
                            className="object-cover"
                            />
                        ) : (
                            <span className = "font-semibold text-gray-600">
                                {driver.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900">
                        {driver.name}
                    </h3>

                </div>

                <DriverMenu driverName = {driver.name} onDelete = {onDelete} onViewDetails = {onView}/>

            </div>

            <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">

                <span className="font-medium text-gray-900">
                    Email
                </span>
                <span className="min-w-0 break-all text-gray-700">
                    {driver.email}
                </span>

                <span className="font-medium text-gray-900">
                    Phone Number
                </span>
                <span className="text-gray-700">
                    {driver.phoneNumber}
                </span>

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
                    {driver.distanceKm} km
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

function compareScores(a: Driver, b: Driver, direction: "asc" | "desc"){

    if (a.score === null){
        return b.score === null ? 0 : 1;
    }

    if (b.score === null){
        return -1;
    }

    return direction === "asc" ? a.score - b.score : b.score - a.score;
}

export default function ManageDrivers(){

    const [query, setQuery] = useState("");
    const [driversList, setDriversList] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const availableCount = driversList.filter((d) => d.status === "Available").length;
    const assignedCount = driversList.filter((d) => d.status === "Assigned").length;
    const onTripCount = driversList.filter((d) => d.status === "On Trip").length;
    const [filters, setFilters] = useState<FilterState>({status: [], sortBy: null});

    const filtered = driversList.filter((d) => 
    d.name.toLowerCase().includes(query.toLowerCase()))
    .filter((d) => filters.status.length === 0 || filters.status.includes(d.status))
    .sort((a,b) => {
        if (filters.sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (filters.sortBy === "name-desc") return b.name.localeCompare(a.name);
        if (filters.sortBy === "score-desc") return compareScores(a,b,"desc");
        if (filters.sortBy === "score-asc") return compareScores(a,b,"asc");
        if (filters.sortBy === "distance-desc") return b.distanceKm -a.distanceKm;
        if (filters.sortBy === "distance-asc") return a.distanceKm - b.distanceKm;
        return 0;
    });

    const [addOpen, setAddOpen] = useState(false);
    const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);

    useEffect(()=> {

        let cancelled = false;

        setIsLoading(true);

        apiFetch<FleetDriversResponse>("/fleet/fleet_drivers")
        .then(({data}) => {
            
            if (cancelled){
                return;
            }

            const statusMap: Record<FleetDriver["status"], DriverStatus> = {
                AVAILABLE: "Available",
                ASSIGNED: "Assigned",
                UNAVAILABLE: "On Trip",
            };

            setDriversList(data.drivers.map((driver) => ({
                id: driver.user_id,
                name: [driver.name, driver.surname].filter(Boolean).join(" ") || "Unnamed driver",
                email: driver.email ?? "Not Provided",
                phoneNumber: driver.phone_number ?? "Not provided",
                profilePictureUrl: driver.profile_picture_url,
                status: statusMap[driver.status],
                trips: driver.trips,
                distanceKm: driver.distance_km,
                score: driver.score,
            })));

            setLoadError(null);
        })
        .catch((error: unknown) => {
            if (!cancelled){
                setLoadError(error instanceof Error ? error.message : "Could not load drivers");
            }
        })
        .finally (() => {
            if (!cancelled){
                setIsLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    const handleAddDriver = async (data: {name:string; surname:string;email: string, phoneNumber: string, dob: string}) => {

        const emailPrefix = data.email
                    .split("@")[0]
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "")
                    .slice(0,50);
        
        const username = emailPrefix.length >= 3 ? emailPrefix : `drv${crypto.randomUUID().replaceAll("-","").slice(0,8)}`;

        await apiFetch("/fleet/add_driver",{
            method: "POST",
            body: JSON.stringify({
                email: data.email.trim(),
                username,
                name: data.name.trim(),
                surname: data.surname.trim(),
                phone_number: data.phoneNumber,
                dob: data.dob
            }),
        });

        setRefreshKey((key) => key + 1);
    };

    const handleDeleteDriver = (id: string) => {
        setDriversList((prev) => prev.filter((d)=> d.id !== id));
    }

    return(
        <div className="flex">
            <DashboardNavbar/>

        <div className="flex-1 bg-gradient-to-br from-white via-sky-50 to-sky-150 p-8">

            <h1 className="text-4xl text-center font-extrabold text-gray-900">
                Manage Drivers
            </h1>
            <div className="mt-4 border-t border-gray-200 pt-3 text-center text-sm text-black">
                {driversList.length} drivers &nbsp; •&nbsp; {onTripCount} on trip•&nbsp; {availableCount} available &nbsp; •&nbsp; {assignedCount} assigned &nbsp; 
            </div>

            <div className="mt-6 flex items-center justify-between">
                <button onClick={()=> setAddOpen(true)} className="rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">
                    + Add Driver
                </button>
                <AddDriver open = {addOpen} onClose={()=> setAddOpen(false)} onSubmit = {handleAddDriver} />

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size = {20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input value = {query} onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search Drivers" 
                        className="w-48 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400"/>
                    </div>
                    <FilterDrivers filters = {filters} onChange = {setFilters}/>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((driver) => (
                    <DriverCard key = {driver.id} driver = {driver} 
                    onView={()=> setViewingDriver(driver)}
                    onDelete={() => handleDeleteDriver(driver.id)}/>
                ))}
            </div>

            <ViewDriver
            open = {!!viewingDriver}
            onClose = {() => setViewingDriver(null)}
            driver = {viewingDriver}
            />

            {isLoading && <p>Loading drivers...</p>}
            {loadError && <p role="alert">{loadError}</p>}

        </div>
        </div>
    );
}