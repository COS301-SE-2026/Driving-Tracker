"use client";

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

                            </button>
                        )
                    })}
                </div>
            </aside>
        
        </main>
    )
}