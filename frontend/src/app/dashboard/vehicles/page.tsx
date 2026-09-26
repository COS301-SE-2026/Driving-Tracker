"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar"
import VehicleCard from "@/components/vehicles/VehicleCard";
import AddVehicleDialog from "@/components/vehicles/AddVehicleDialog";
import { getVehicles } from "@/lib/vehicle-api";
import type { Vehicle } from "@/components/vehicles/types";

export default function VehiclesPage() {

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [search, setSearch] = useState("");
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadVehicles() {
            try {
                setVehicles(await getVehicles());
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Could not load vehicles."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadVehicles();
    }, []);

    const filteredVehicles = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        if (!searchValue) {
            return vehicles;
        }

        return vehicles.filter((vehicle) =>
            `${vehicle.make} ${vehicle.model} ${vehicle.registration}`
            .toLowerCase()
            .includes(searchValue),
        );
    }, [search, vehicles]);

    function handleVehicleCreated(vehicle: Vehicle) {
        setVehicles((current) => [...current, vehicle]);
    }


    return (
        <main className="flex min-h-screen bg-white">
            <DashboardNavbar />

            <section className="min-w-0 flex-1 px-3 py-8 md:px-4">
                <header className="mb-8 flex items-center gap-8">
                    <div className="flex h-7 w-[177px] items-center rounded-full border border-black px-3">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search"
                            aria-label="Search vehicles"
                            className="w-full bg-transparent text-[11px] outline-none"
                        />

                        <Search size={15} />
                    </div>

                    <button
                        type="button"
                        aria-label="Filter vehicles"
                        className="rounded-md p-1 hover:bg-slate-100"
                    >
                        <Filter size={20} />
                    </button>
                </header>

                {isLoading && (
                    <p className="text-sm text-slate-500">
                        Loading vehicles...
                    </p>
                )}

                {error && (
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                {!isLoading && !error && (
                    <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredVehicles.map((vehicle) => (
                            <VehicleCard
                                key={vehicle.vehicle_id}
                                vehicle={vehicle}
                            />
                        ))}

                        <button
                            type="button"
                            onClick={() => setIsAddOpen(true)}
                            className="flex min-h-[258px] w-full max-w-[238px] flex-col items-center justify-center gap-2 rounded-[9px] text-center hover:bg-slate-50"
                        >
                            <Plus size={76} strokeWidth={1.5} />
                            <span className="text-sm">Add Vehicle</span>
                        </button>
                    </div>
                )}

                {!isLoading && !error && filteredVehicles.length === 0 && (
                    <p className="text-sm text-slate-500">
                        No vehicles found.
                    </p>
                )}
            </section>

            <AddVehicleDialog
                open={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onCreated={handleVehicleCreated}
            />

        </main>
    )

}
