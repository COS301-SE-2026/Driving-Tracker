"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { assignDriver, getDrivers } from "@/lib/vehicle-api";
import type { Driver, Vehicle } from "./types";

type Props = {
    vehicle: Vehicle | null;
    onClose: () => void;
    onAssigned: (driver: Driver) => void;
};

export default function AssignDriverDialog({
    vehicle,
    onClose,
    onAssigned,
}: Props) {

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [driverId, setDriverId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {

        if (!vehicle) {
            return;
        }

        async function loadDrivers() {

            setIsLoading(true);
            setError("");

            try {
                setDrivers(await getDrivers());
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Could not load drivers."
                );
            } finally {
                setIsLoading(false);
            }

        }

        loadDrivers();

    }, [vehicle]);

    if (!vehicle) {
        return null;
    }

    async function handleAssign() {

        if (!driverId) {
            setError("Select a driver first.");
            return;
        }

        const driver = drivers.find(
            (item) => item.user_id === driverId,
        );

        if (!driver) {
            return;
        }

        try {
            await assignDriver(vehicle.vehicle_id, driverId);
            onAssigned(driver);
            onClose();
        } catch (assignError) {
            setError(
                assignError instanceof Error
                    ? assignError.message
                    : "Could not assign driver."
            );
        }

    }

    return (

        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        Assign Driver
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="rounded-md p-1 hover:bg-slate-100"
                    >
                        <X sixe={20} />
                    </button>
                </div>

                <p className="mb-4 text-sm text-slate-600">
                    Assign a driver to {vehicle.make} {vehicle.model}.
                </p>

                <select
                    value={driverId}
                    onChange={(event => setDriverId(event.target.value))}
                    disabled={isLoading}
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                >
                    <option value="">
                        {isLoading ? "Loading drivers..." : "Select a driver"}
                    </option>

                    {drivers.map((driver) => (
                        <option
                            key={driver.user_id}
                            value={driver.user_id}
                        >
                            {driver.name} {driver.surname}
                        </option>
                    ))}
                </select>

                {error && (
                    <p className="mt-3 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleAssign}
                    disabled={isLoading}
                    className="mt-5 w-full rounded-md bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
                >
                    Assign Driver
                </button>
            </div>
        </div>

    );

}