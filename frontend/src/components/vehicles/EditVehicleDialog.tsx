"use client"

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { updateVehicle } from "@/lib/vehicle-api";
import type{CreateVehicleInput, Vehicle} from "./types";


type Props = {
    vehicle: Vehicle | null;
    onClose: () => void;
    onUpdated: (vehicle: Vehicle) => void;
};

export default function EditVehicleDialog({
    vehicle,
    onClose,
    onUpdated,
}: Props) {

    const [name, setName] = useState("");
    const [registration, setRegistration] = useState("");
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [fuelType, setFuelType] = useState("PETROL");
    const [fuelTank, setFuelTank] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!vehicle) return; 

        setName(vehicle.name ?? "");
        setRegistration(vehicle.registration ?? "");
        setMake(vehicle.make ?? "");
        setModel(vehicle.model ?? "");
        setYear(vehicle.year?.toString() ?? "");
        setFuelType(vehicle.fuel_type ??"PETROL");
        setFuelTank(vehicle.fuel_tank?.toString() ?? "");
        setError("");
    }, [vehicle]);

    if (!vehicle) return null;

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {

        event.preventDefault();

        const input: CreateVehicleInput = {
            name: name.trim(),
            registration: registration.trim(),
            make: make.trim(),
            model: model.trim(),
            year: Number(year),
            fuel_type: fuelType,
            fuel_tank: Number(fuelTank),
        };

        if(
            !input.make || !input.model || !Number.isInteger(input.year) || input.fuel_tank <= 0
        ){
            setError("Make, model, year, and fuel tank are required.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try{
            const updatedVehicle = await updateVehicle(
                vehicle!.vehicle_id,
                input,
            )

            onUpdated(updatedVehicle);
            onClose();
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : "Could not update vehicle.",
            );
        } finally {
            setIsSubmitting(false);
        }

    }

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
            <div
                role="dialog"
                aria-modal="true"
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        Edit Vehicle
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="rounded-md p-1 hover:bg-slate-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >

                    <label className="block text-sm font-medium">
                        Name/Alias
                        <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Registration
                        <input
                            value={registration}
                            onChange={(event) => setRegistration(event.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Make
                        <input
                            value={make}
                            onChange={(event) => setMake(event.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Model
                        <input
                            value={model}
                            onChange={(event) => setModel(event.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Year
                        <input
                            type="number"
                            min="1886"
                            max={new Date().getFullYear() + 1}
                            value={year}
                            onChange={(event) => setYear(event.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Fuel type
                        <select
                            value={fuelType}
                            onChange={(event) => setFuelType(event.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                        >
                            <option value="PETROL">Petrol</option>
                            <option value="DIESEL">Diesel</option>
                            <option value="ELECTRIC">Electric</option>
                            <option value="HYBRID">Hybrid</option>
                        </select>
                    </label>

                    <label className="block text-sm font-medium">
                        Fuel tank size
                        <div>
                            <input
                                type="number"
                                min="1"
                                step="0.1"
                                value={fuelTank}
                                onChange={(event) => setFuelTank(event.target.value)}
                                className="w-full rounded-l-md border border-slate-300 px-3 py-2"
                            />
                            <span className="flex items-center rounded-r-md border border-l-0 border-slate-100 px-3 text-sm">
                                L
                            </span>
                        </div>
                        
                    </label>

                    {error && (
                        <p className="text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
                    >
                        {isSubmitting && (
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                        )}

                        {isSubmitting
                            ? "Saving..."
                            : "Save changes"}
                    </button>
                </form>
            </div>
        </div>
    );

}