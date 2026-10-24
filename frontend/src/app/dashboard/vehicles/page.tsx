"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import DashboardNavbar from "@/components/DashboardNavbar"
import VehicleCard from "@/components/vehicles/VehicleCard";
import AddVehicleDialog from "@/components/vehicles/AddVehicleDialog";
import { deleteVehicle, getVehicles, uploadVehicleImage } from "@/lib/vehicle-api";
import type { Vehicle } from "@/components/vehicles/types";
import EditVehicleDialog from "@/components/vehicles/EditVehicleDialog";
import FilterVehicles, { VehicleFilterState } from "@/components/vehicles/FilterVehicles";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function VehiclesPage() {

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<VehicleFilterState>({ status: [] });
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
    const [actionError, setActionError] = useState("");

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

        void loadVehicles();
    }, []);

	const availableStatuses = useMemo(() => {
        const statuses = new Set<string>();
		vehicles.forEach((v) => {
			if(v.status){
				statuses.add(v.status);
			}
		});

        return Array.from(statuses);
    }, [vehicles]);

    const filteredVehicles = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        return vehicles.filter((vehicle) => {
			if(searchValue){
				const searchTarget = `${vehicle.name ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""} ${vehicle.registration ?? ""}`.toLowerCase();
				if(!searchTarget.includes(searchValue)){
					return false;
				}
			}

			if(filters.status.length > 0){
				const vehicleStatus = (vehicle.status ?? "").toUpperCase();
				const matchesStatus = filters.status.some(
					(s) => s.toUpperCase() === vehicleStatus
				);
				if(!matchesStatus){
					return false;
				}
			}
			return true;
	});
    }, [search, vehicles, filters]);

    function handleVehicleCreated(vehicle: Vehicle) {
        setVehicles((current) => [...current, vehicle]);
    }


    return (
        <main className="flex min-h-screen bg-white">

            <section className="min-w-0 flex-1 bg-gradient-to-br from-white via-sky-50 to-sky-150 p-8">
                <h1 className="text-4xl text-center font-extrabold text-gray-900">
                    Vehicles
                </h1>
                <div className="mt-4 border-t border-gray-200 pt-3" />
                <div className="mt-6 flex items-center justify-between">
                    <button onClick={() => setIsAddOpen(true)} className="rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">
                        + Add Vehicle
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search Vehicles"
                                aria-label = "Search vehicles"
                                className="w-48 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400" />
                        </div>
                        <FilterVehicles filters={filters} onChange={setFilters} availableStatuses={availableStatuses}/>
                    </div>
                </div>

				{filters.status.length > 0 && (
					<div className="mb-6 flex flex-wrap items-center gap-2">
						<span className="text-xs font-medium text-slate-500">
							Filtered by status:
						</span>
						{filters.status.map((status) => (
							<span
								key={status}
								className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800"
							>
								{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
								<button
									type="button"
									onClick={() => 
										setFilters((prev) => ({
											...prev,
											status: prev.status.filter(
												(s) => s.toUpperCase() !== status.toUpperCase()
											),
										}))
									}
									className="ml-0.5 text-sky-600 hover:text-sky-900"
								>
									<X size={12} />
								</button>
							</span>
						))}
						<button
							type="button"
							onClick={() => setFilters((prev) => ({ ...prev, status: [] }))}
							className="text-xs text-slate-500 underline hover:text-slate-700"
						>
							Clear filters
						</button>
					</div>
				)}

                {isLoading && <LoadingSpinner message = "Loading vehicles..."/>}

                {error && (
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                )}

                {actionError && (
                    <p className="mb-4 text-sm text-red-600">
                        {actionError}
                    </p>
                )}

                {!isLoading && !error && (
                    <div className="mt-6 grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredVehicles.map((vehicle) => (
                            <VehicleCard
                                key={vehicle.vehicle_id}
                                vehicle={vehicle}
                                onEdit={(selectedVehicle) => {
                                    setActionError("");
                                    setVehicleToEdit(selectedVehicle);
                                }}
                                onDelete={(selectedVehicle) => {
                                    setActionError("");
                                    setVehicleToDelete(selectedVehicle);
                                }}
                                onImageChange={async (selectedVehicle, file) => {
                                    try{
                                        setActionError("");
                                        const imageUrl = await uploadVehicleImage(
                                            selectedVehicle.vehicle_id,
                                            file,
                                        );

                                        setVehicles((current) => 
                                            current.map((item) =>
                                            item.vehicle_id === selectedVehicle.vehicle_id
                                                ? { ...item, image_url: imageUrl }
                                                : item,
                                            ),
                                        );
                                    }catch(error){
                                        setActionError(
                                            error instanceof Error ? error.message : "Could not upload vehicle image."
                                        );
                                    }
                                }}
                            />
                        ))}
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

            <EditVehicleDialog
                vehicle={vehicleToEdit}
                onClose={() => setVehicleToEdit(null)}
                onUpdated={(updatedVehicle) => {
                    setVehicles((current) => 
                        current.map((vehicle) =>
                            vehicle.vehicle_id === updatedVehicle.vehicle_id ? updatedVehicle : vehicle,
                    ),
                );
                setVehicleToEdit(null);
            }}
            />

            {vehicleToDelete && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-bold">
                            Remove vehicle?
                        </h2>

                        <p className="mt-2 text-sm text-slate-600">
                            Remove {vehicleToDelete.name ?? vehicleToDelete.make } from
                            the fleet?
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setVehicleToDelete(null)}
                                className="rounded-md border px-4 py-2 text-sm"
                            >
                                Cancel
                            </button>

                            <button 
                                type="button"
                                onClick={async () => {
                                    try{
                                        await deleteVehicle(vehicleToDelete.vehicle_id);

                                        setVehicles((current) =>
                                            current.filter(
                                                (vehicle) =>
                                                    vehicle.vehicle_id !== vehicleToDelete.vehicle_id,
                                            ),
                                        );

                                        setVehicleToDelete(null);
                                    }catch(error){
                                        setActionError(
                                            error instanceof Error ? error.message : "Could not remove vehicle.",
                                        );
                                    }
                                }}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </main>
    )

}
