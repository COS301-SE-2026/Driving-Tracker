"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import Navbar from "@/components/Navbar";
import FleetMap from "@/components/fleet/FleetMap";
import type {
    Driver,
    FleetDashboardResponse,
    FleetStats,
} from "@/components/fleet/type";

//temporary fallback data
const fallbackDrivers: Driver[] = [
    {
        id: "driver-1",
        name: "Sipho M",
        status: "On trip",
        location: [-74.15, 40.51],
        route: [
            [-74.15, 40.51],
            [-74.15, 40.51],
            [-74.15, 40.51],
            [-74.15, 40.51],
        ],
    },
    {
        id: "driver-2",
        name: "Jane V",
        status: "Inactive",
        location: [-74.1, 40.57],
        route: [
            [-74.1, 40.57],
            [-74.05, 40.61],
            [-74.02, 40.64],
        ],
    },
    {
        id: "driver-3",
        name: "Thando S",
        status: "On trip",
        location: [-74.08, 40.54],
        route: [
            [-74.08, 40.54],
            [-74.04, 40.58],
            [-73.98, 40.62],
        ],
    },
    
];

const fallbackStats: FleetStats = {
    harshBraking: 8,
    harshAcceleration: 2,
    idleVehicles: 1,
    tripsInProgress: 2,
};

export default function DashboardHomePage() {
    const [drivers, setDrivers] = useState<Driver[]>(fallbackDrivers);
    const [stats, setStats] = useState<FleetStats>(fallbackStats);
    const [search, setSearch] = useState("");
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null,);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        async function loadFleetDashboard() {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const accessToken = localStorage.getItem("access_token");

            if (!apiUrl) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${apiUrl}/admin/fleet/dashboard`, {
                    headers: {
                        Authorization: `Bearer ${accessToken ?? ""}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Unabel to load fleet dashboard data");
                }

                const result = (await response.json()) as {
                    data?: FleetDashboardResponse;
                } & FleetDashboardResponse;

                //supports both {  data: {...} } and direct API responses
                const dashboard = result.data ?? result;

                setDrivers(dashboard.drivers);
                setStats(dashboard.stats);
                setApiError(null);
            } catch (error) {
                setApiError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load dashboard data."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadFleetDashboard();
    }, []);

    //filtering driver cards by the search input
    const filteredDrivers = useMemo(() => {
        const normalizedSearch = search.trim(). toLowerCase();

        if (!normalizedSearch) {
            return drivers;
        }

        return drivers.filter((driver) => driver.name.toLowerCase().includes(normalizedSearch),);
    }, [drivers, search]);

    return (
        <main className="flex min-h-screen w-full bg-white">

            <Navbar />

            {/* driver search ad driver cards section */}
            <aside className="w-[190px] shrink-0 border-r border-black bg-white px-[18px] py-[26px]">
                <div className="mx-auto mb-[50px] flex h-7 w-[122px] items-center rounded-full border border-black px-2">
                    <input 
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search"
                        aria-label="Search drivers"
                        className="w-full bg-transparent text-[11px] outline-none"
                    />

                    <Search size={15} aria-hidden="true" />
                </div>

                <div className="flex flex-col gap-5">
                    {filteredDrivers.map((driver) => {
                        const isSelected = selectedDriverId === driver.id;

                        return (
                            <button 
                                key={driver.id}
                                type="button"
                                onClick={() => setSelectedDriverId(driver.id)}
                                aria-pressed={isSelected}
                                className={`flex min-h-12 w-36 items-center gap-2 rounded-[11px] bg-[#e8f8ff] p-2 text-left transition ${
                                    isSelected
                                        ? "border-2 border-[#0095ff] shadow-[0_0_0_2px_#c8edff]"
                                        : "border border-black"
                                }`}
                            >
                                {/* profile image or fallback user icon */}
                                <span className="grid h-[27px] w-[27px] shrink-0 place-items-center overflow-hidden rounded-full bg-white text-indigo-500">
                                    {driver.image ? (
                                        <Image
                                            src={driver.image}
                                            alt={`${driver.name} profile`}
                                            width={27}
                                            height={27}
                                            unoptimized
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserRound size={17} aria-hidden="true" />
                                    )}
                                </span>

                                <span className="flex flex-col gap-[3px] text-xs">
                                    <strong>{driver.name}</strong>

                                    <small
                                        className={
                                            driver.status === "On trip"
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }
                                    >
                                        {driver.status}
                                    </small>
                                </span>

                            </button>
                        );
                    })}

                    {!isLoading && filteredDrivers.length === 0 && (
                        <p className="px-2 text-xs text-slate-500">No drivers found.</p>
                    )}
                </div>

                {apiError && (
                    <p className="mt-6 px-2 text-xs text-slate-500">
                        Showing fallback dashboard data.
                    </p>
                )}
            </aside>

            {/* Main map and stats area */}
            <section className="flex min-w-0 flex-1 flex-col">
                <div className="h-[460px] border-b-2 border-[#159fe9]">
                    <FleetMap
                        drivers={drivers}
                        selectedDriverId={selectedDriverId}
                    />
                </div>

                {/* Stats */}
                <section className="px-[26px] py-4">
                    <h1 className="mb-6 text-[25px] font-bold">Events &amp; Stats</h1>

                    <div className="grid grid-cols-2 items-center gap-8 text-center md:grid-cols-4">
                        <StatItem 
                            label="Harsh Braking"
                            value={stats.harshBraking}
                        />

                        <StatItem 
                            label="Harsh Acceleration"
                            value={stats.harshAcceleration}
                        />

                        <StatItem 
                            label="Idle Vehicles"
                            value={stats.idleVehicles}
                        />

                        <div className="mx-auto flex min-h-[102px] w-[120px] flex-col justify-center gap-2 rounded-[11px] border border-[#1b2730] bg-[#e8f8ff] text-[15px]">
                            <span>Trips in progress</span>

                            <strong className="text-[25px] font-normal text-green-600">
                                {stats.tripsInProgress}
                            </strong>
                        </div>
                    </div>
                </section>
            </section>
        
        </main>
    );
}

//stats item
function StatItem({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="flex flex-col gap-2 text-[15px]">
            <span>{label}</span>
            <strong className="text-[25px] font-normal">{value}</strong>
        </div>
    )
}